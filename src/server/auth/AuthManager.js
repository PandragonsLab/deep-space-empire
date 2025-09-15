import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import dbManager from '../database/connection.js';
import { ERROR_CODES, SERVER_CONFIG } from '../shared/constants.js';

class AuthManager {
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
        this.saltRounds = 12;
        this.maxFailedAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes

        // Validation schemas
        this.registerSchema = Joi.object({
            username: Joi.string().alphanum().min(3).max(32).required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(8).max(128).required()
        });

        this.loginSchema = Joi.object({
            username: Joi.string().required(),
            password: Joi.string().required()
        });
    }

    async register(userData, clientInfo = {}) {
        // Validate input
        const { error, value } = this.registerSchema.validate(userData);
        if (error) {
            throw new Error(`${ERROR_CODES.INVALID_INPUT}: ${error.details[0].message}`);
        }

        const { username, email, password } = value;

        // Check if username or email already exists
        const existingUser = await dbManager.query(
            'SELECT id FROM players WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (existingUser.rows.length > 0) {
            throw new Error(ERROR_CODES.INVALID_CREDENTIALS);
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, this.saltRounds);

        // Create player in database
        const result = await dbManager.transaction(async (client) => {
            // Insert player
            const playerResult = await client.query(
                `INSERT INTO players (username, email, password_hash, skill_points_unallocated)
                 VALUES ($1, $2, $3, $4) RETURNING id, username, email, created_at`,
                [username, email, passwordHash, 5000]
            );

            const player = playerResult.rows[0];

            // Initialize starting resources
            await this.initializeStartingResources(client, player.id);

            // Initialize starting skills
            await this.initializeStartingSkills(client, player.id);

            // Create starting ship
            await this.createStartingShip(client, player.id);

            return player;
        });

        // Log registration event
        await this.logEvent('player_registered', result.id, clientInfo);

        return {
            success: true,
            player: {
                id: result.id,
                username: result.username,
                email: result.email,
                createdAt: result.created_at
            }
        };
    }

    async login(credentials, clientInfo = {}) {
        // Validate input
        const { error, value } = this.loginSchema.validate(credentials);
        if (error) {
            throw new Error(`${ERROR_CODES.INVALID_INPUT}: ${error.details[0].message}`);
        }

        const { username, password } = value;

        // Get player from database
        const result = await dbManager.query(
            `SELECT id, username, email, password_hash, failed_login_attempts,
                    locked_until, is_active, is_banned, last_login
             FROM players WHERE username = $1 OR email = $1`,
            [username]
        );

        if (result.rows.length === 0) {
            throw new Error(ERROR_CODES.INVALID_CREDENTIALS);
        }

        const player = result.rows[0];

        // Check if account is banned
        if (player.is_banned) {
            throw new Error(ERROR_CODES.ACCOUNT_LOCKED);
        }

        // Check if account is locked
        if (player.locked_until && new Date() < player.locked_until) {
            throw new Error(ERROR_CODES.ACCOUNT_LOCKED);
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, player.password_hash);

        if (!isValidPassword) {
            await this.handleFailedLogin(player.id);
            throw new Error(ERROR_CODES.INVALID_CREDENTIALS);
        }

        // Reset failed attempts and update last login
        await dbManager.query(
            `UPDATE players
             SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW()
             WHERE id = $1`,
            [player.id]
        );

        // Create session
        const sessionToken = uuidv4();
        const expiresAt = new Date(Date.now() + SERVER_CONFIG.SESSION_TIMEOUT);

        await dbManager.query(
            `INSERT INTO player_sessions (player_id, session_token, expires_at, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5)`,
            [player.id, sessionToken, expiresAt, clientInfo.ip, clientInfo.userAgent]
        );

        // Cache session in Redis
        await dbManager.createSession(player.id, sessionToken, expiresAt, {
            username: player.username,
            email: player.email
        });

        // Log login event
        await this.logEvent('player_login', player.id, clientInfo);

        return {
            success: true,
            player: {
                id: player.id,
                username: player.username,
                email: player.email,
                lastLogin: player.last_login
            },
            session: {
                token: sessionToken,
                expiresAt
            }
        };
    }

    async logout(sessionToken, clientInfo = {}) {
        // Get session data
        const sessionData = await dbManager.getSession(sessionToken);

        if (sessionData) {
            // Remove from database
            await dbManager.query(
                'UPDATE player_sessions SET expires_at = NOW() WHERE session_token = $1',
                [sessionToken]
            );

            // Remove from cache
            await dbManager.destroySession(sessionToken);

            // Log logout event
            await this.logEvent('player_logout', sessionData.playerId, clientInfo);
        }

        return { success: true };
    }

    async validateSession(sessionToken) {
        // Check Redis cache first
        const sessionData = await dbManager.getSession(sessionToken);

        if (!sessionData) {
            return null;
        }

        // Verify session still exists in database
        const result = await dbManager.query(
            `SELECT ps.player_id, p.username, p.email, p.is_active, p.is_banned
             FROM player_sessions ps
             JOIN players p ON p.id = ps.player_id
             WHERE ps.session_token = $1 AND ps.expires_at > NOW()`,
            [sessionToken]
        );

        if (result.rows.length === 0) {
            // Clean up invalid session from cache
            await dbManager.destroySession(sessionToken);
            return null;
        }

        const player = result.rows[0];

        // Check if account is banned or inactive
        if (player.is_banned || !player.is_active) {
            await this.logout(sessionToken);
            return null;
        }

        return {
            playerId: player.player_id,
            username: player.username,
            email: player.email
        };
    }

    async refreshSession(sessionToken) {
        const sessionData = await this.validateSession(sessionToken);

        if (!sessionData) {
            throw new Error(ERROR_CODES.SESSION_EXPIRED);
        }

        // Extend session
        const newExpiresAt = new Date(Date.now() + SERVER_CONFIG.SESSION_TIMEOUT);

        await dbManager.query(
            'UPDATE player_sessions SET expires_at = $1 WHERE session_token = $2',
            [newExpiresAt, sessionToken]
        );

        // Update cache
        await dbManager.createSession(sessionData.playerId, sessionToken, newExpiresAt, sessionData);

        return {
            success: true,
            expiresAt: newExpiresAt
        };
    }

    async changePassword(playerId, currentPassword, newPassword) {
        // Validate new password
        const { error } = Joi.string().min(8).max(128).validate(newPassword);
        if (error) {
            throw new Error(`${ERROR_CODES.INVALID_INPUT}: ${error.details[0].message}`);
        }

        // Get current password hash
        const result = await dbManager.query(
            'SELECT password_hash FROM players WHERE id = $1',
            [playerId]
        );

        if (result.rows.length === 0) {
            throw new Error(ERROR_CODES.INVALID_CREDENTIALS);
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
        if (!isValidPassword) {
            throw new Error(ERROR_CODES.INVALID_CREDENTIALS);
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, this.saltRounds);

        // Update password
        await dbManager.query(
            'UPDATE players SET password_hash = $1 WHERE id = $2',
            [newPasswordHash, playerId]
        );

        // Invalidate all sessions for this player
        await this.invalidateAllSessions(playerId);

        return { success: true };
    }

    async handleFailedLogin(playerId) {
        const result = await dbManager.query(
            `UPDATE players
             SET failed_login_attempts = failed_login_attempts + 1
             WHERE id = $1
             RETURNING failed_login_attempts`,
            [playerId]
        );

        const attempts = result.rows[0].failed_login_attempts;

        // Lock account if too many failed attempts
        if (attempts >= this.maxFailedAttempts) {
            const lockUntil = new Date(Date.now() + this.lockoutDuration);
            await dbManager.query(
                'UPDATE players SET locked_until = $1 WHERE id = $2',
                [lockUntil, playerId]
            );
        }
    }

    async invalidateAllSessions(playerId) {
        // Update database
        await dbManager.query(
            'UPDATE player_sessions SET expires_at = NOW() WHERE player_id = $1',
            [playerId]
        );

        // Clear from cache (we'd need to track all session tokens for a player to do this efficiently)
        // For now, rely on the database check in validateSession
    }

    async initializeStartingResources(client, playerId) {
        const startingResources = [
            { type: 'hydrogen', quantity: 1000 },
            { type: 'iron', quantity: 500 },
            { type: 'energy_cells', quantity: 100 }
        ];

        for (const resource of startingResources) {
            await client.query(
                `INSERT INTO player_resources (player_id, resource_type, quantity)
                 VALUES ($1, $2, $3)`,
                [playerId, resource.type, resource.quantity]
            );
        }
    }

    async initializeStartingSkills(client, playerId) {
        const startingSkills = [
            { name: 'engineering_basic', level: 1, experience: 250 },
            { name: 'navigation_basic', level: 1, experience: 250 },
            { name: 'combat_basic', level: 1, experience: 250 }
        ];

        for (const skill of startingSkills) {
            await client.query(
                `INSERT INTO player_skills (player_id, skill_name, skill_level, experience_points)
                 VALUES ($1, $2, $3, $4)`,
                [playerId, skill.name, skill.level, skill.experience]
            );
        }
    }

    async createStartingShip(client, playerId) {
        // Create starting frigate
        const shipResult = await client.query(
            `INSERT INTO ships (owner_id, ship_type, name, hull_hp, cargo_capacity, fuel_amount)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
            [playerId, 'rookie_frigate', 'My First Ship', 1000, 100, 500]
        );

        const shipId = shipResult.rows[0].id;

        // Add basic fittings
        const basicFittings = [
            { module: 'civilian_mining_laser', slot_type: 'high_power', position: 1 },
            { module: 'basic_shield_generator', slot_type: 'medium_power', position: 1 },
            { module: 'micro_warp_drive', slot_type: 'medium_power', position: 2 },
            { module: 'basic_armor_plate', slot_type: 'low_power', position: 1 }
        ];

        for (const fitting of basicFittings) {
            await client.query(
                `INSERT INTO ship_fittings (ship_id, module_type, slot_type, slot_position)
                 VALUES ($1, $2, $3, $4)`,
                [shipId, fitting.module, fitting.slot_type, fitting.position]
            );
        }

        // Set as current ship
        await client.query(
            'UPDATE players SET current_ship_id = $1 WHERE id = $2',
            [shipId, playerId]
        );
    }

    async logEvent(eventType, playerId, clientInfo) {
        await dbManager.query(
            `INSERT INTO game_events (event_type, player_id, event_data)
             VALUES ($1, $2, $3)`,
            [eventType, playerId, JSON.stringify(clientInfo)]
        );
    }

    // Admin functions
    async banPlayer(playerId, reason = '') {
        await dbManager.query(
            'UPDATE players SET is_banned = true WHERE id = $1',
            [playerId]
        );

        // Invalidate all sessions
        await this.invalidateAllSessions(playerId);

        // Log ban event
        await this.logEvent('player_banned', playerId, { reason });
    }

    async unbanPlayer(playerId) {
        await dbManager.query(
            'UPDATE players SET is_banned = false WHERE id = $1',
            [playerId]
        );

        await this.logEvent('player_unbanned', playerId, {});
    }
}

export default new AuthManager();