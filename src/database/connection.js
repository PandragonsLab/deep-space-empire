import { Pool } from 'pg';
import Redis from 'redis';
import winston from 'winston';

// Database connection pool
class DatabaseManager {
    constructor() {
        this.pgPool = null;
        this.redisClient = null;
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'logs/database.log' })
            ]
        });
    }

    async initialize() {
        try {
            await this.initializePostgreSQL();
            await this.initializeRedis();
            this.logger.info('Database connections initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize database connections:', error);
            throw error;
        }
    }

    async initializePostgreSQL() {
        const config = {
            user: process.env.DB_USER || 'deepspace',
            host: process.env.DB_HOST || 'localhost',
            database: process.env.DB_NAME || 'deepspace_empire',
            password: process.env.DB_PASSWORD || 'password',
            port: process.env.DB_PORT || 5432,

            // Connection pool settings
            max: 20, // Maximum number of clients in the pool
            min: 5,  // Minimum number of clients in the pool
            idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
            connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established

            // Statement timeout
            statement_timeout: 10000, // 10 seconds
            query_timeout: 10000,

            // SSL settings for production
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        };

        this.pgPool = new Pool(config);

        // Handle pool errors
        this.pgPool.on('error', (err) => {
            this.logger.error('PostgreSQL pool error:', err);
        });

        // Test connection
        const client = await this.pgPool.connect();
        try {
            const result = await client.query('SELECT NOW()');
            this.logger.info('PostgreSQL connected successfully:', result.rows[0]);
        } finally {
            client.release();
        }
    }

    async initializeRedis() {
        const redisConfig = {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            db: process.env.REDIS_DB || 0,

            // Connection settings
            connectTimeout: 2000,
            commandTimeout: 1000,
            retryDelayOnFailover: 100,

            // Retry strategy
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            }
        };

        this.redisClient = Redis.createClient(redisConfig);

        this.redisClient.on('error', (err) => {
            this.logger.error('Redis error:', err);
        });

        this.redisClient.on('connect', () => {
            this.logger.info('Redis connected successfully');
        });

        await this.redisClient.connect();
    }

    // PostgreSQL query methods
    async query(text, params = []) {
        const start = Date.now();
        try {
            const result = await this.pgPool.query(text, params);
            const duration = Date.now() - start;

            if (duration > 1000) {
                this.logger.warn('Slow query detected:', {
                    query: text,
                    duration,
                    rowCount: result.rowCount
                });
            }

            return result;
        } catch (error) {
            this.logger.error('Database query error:', {
                query: text,
                params,
                error: error.message
            });
            throw error;
        }
    }

    async getClient() {
        return await this.pgPool.connect();
    }

    async transaction(callback) {
        const client = await this.getClient();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Redis methods
    async cacheGet(key) {
        try {
            return await this.redisClient.get(key);
        } catch (error) {
            this.logger.error('Redis GET error:', { key, error: error.message });
            return null;
        }
    }

    async cacheSet(key, value, ttl = 3600) {
        try {
            if (typeof value === 'object') {
                value = JSON.stringify(value);
            }
            return await this.redisClient.setEx(key, ttl, value);
        } catch (error) {
            this.logger.error('Redis SET error:', { key, error: error.message });
            return false;
        }
    }

    async cacheDel(key) {
        try {
            return await this.redisClient.del(key);
        } catch (error) {
            this.logger.error('Redis DEL error:', { key, error: error.message });
            return false;
        }
    }

    async cacheGetJSON(key) {
        try {
            const value = await this.redisClient.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            this.logger.error('Redis GET JSON error:', { key, error: error.message });
            return null;
        }
    }

    async cacheSetJSON(key, value, ttl = 3600) {
        return await this.cacheSet(key, JSON.stringify(value), ttl);
    }

    // Session management
    async createSession(playerId, sessionToken, expiresAt, metadata = {}) {
        const sessionData = {
            playerId,
            expiresAt: expiresAt.toISOString(),
            ...metadata
        };

        await this.cacheSetJSON(`session:${sessionToken}`, sessionData,
            Math.floor((expiresAt - new Date()) / 1000));

        return sessionToken;
    }

    async getSession(sessionToken) {
        const sessionData = await this.cacheGetJSON(`session:${sessionToken}`);
        if (!sessionData) return null;

        const expiresAt = new Date(sessionData.expiresAt);
        if (expiresAt < new Date()) {
            await this.cacheDel(`session:${sessionToken}`);
            return null;
        }

        return sessionData;
    }

    async destroySession(sessionToken) {
        return await this.cacheDel(`session:${sessionToken}`);
    }

    // Health check
    async healthCheck() {
        const health = {
            postgres: false,
            redis: false,
            timestamp: new Date().toISOString()
        };

        try {
            await this.query('SELECT 1');
            health.postgres = true;
        } catch (error) {
            this.logger.error('PostgreSQL health check failed:', error);
        }

        try {
            await this.redisClient.ping();
            health.redis = true;
        } catch (error) {
            this.logger.error('Redis health check failed:', error);
        }

        return health;
    }

    // Graceful shutdown
    async close() {
        if (this.pgPool) {
            await this.pgPool.end();
            this.logger.info('PostgreSQL pool closed');
        }

        if (this.redisClient) {
            await this.redisClient.quit();
            this.logger.info('Redis connection closed');
        }
    }
}

// Singleton instance
const dbManager = new DatabaseManager();

export default dbManager;