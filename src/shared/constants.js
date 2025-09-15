// Shared constants used across client and server

// Server Configuration
export const SERVER_CONFIG = {
    PORT: process.env.PORT || 3000,
    TICK_RATE: 50, // Server ticks per second
    MAX_PLAYERS_PER_INSTANCE: 5000,
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
};

// Game Constants
export const GAME_CONSTANTS = {
    // Universe
    GALAXY_SIZE: 100000, // Number of star systems
    SECTORS_PER_REGION: 100,
    SYSTEMS_PER_SECTOR: 1000,

    // Resources
    RESOURCE_TYPES: {
        // Tier 1 - Raw Materials
        HYDROGEN: 'hydrogen',
        HELIUM: 'helium',
        IRON: 'iron',
        SILICON: 'silicon',
        CARBON: 'carbon',
        TITANIUM: 'titanium',
        LITHIUM: 'lithium',
        FUSION_FUEL: 'fusion_fuel',
        RARE_EARTH: 'rare_earth',
        QUANTUM_FOAM: 'quantum_foam',

        // Tier 2 - Refined Materials
        STEEL: 'steel',
        POLYMERS: 'polymers',
        CERAMICS: 'ceramics',
        ENERGY_CELLS: 'energy_cells',
        NEURAL_MATRIX: 'neural_matrix',
        EXOTIC_MATTER: 'exotic_matter',

        // Tier 3 - Components
        SHIP_COMPONENTS: 'ship_components',
        WEAPON_SYSTEMS: 'weapon_systems',
        DEFENSE_SYSTEMS: 'defense_systems',
        ELECTRONICS: 'electronics',

        // Tier 4 - Advanced Technology
        SHIP_HULLS: 'ship_hulls',
        CAPITAL_COMPONENTS: 'capital_components',
        EXPERIMENTAL_TECH: 'experimental_tech'
    },

    // Ship Classifications
    SHIP_CLASSES: {
        FRIGATE: 'frigate',
        DESTROYER: 'destroyer',
        CRUISER: 'cruiser',
        BATTLESHIP: 'battleship',
        CAPITAL: 'capital',
        TITAN: 'titan'
    },

    // Security Levels
    SECURITY_LEVELS: {
        HIGH_SEC: { min: 0.8, max: 1.0 },
        LOW_SEC: { min: 0.1, max: 0.7 },
        NULL_SEC: { min: 0.0, max: 0.0 },
        WORMHOLE: { min: -1.0, max: -0.1 }
    },

    // Module Slots
    MODULE_SLOTS: {
        HIGH_POWER: 'high_power',
        MEDIUM_POWER: 'medium_power',
        LOW_POWER: 'low_power',
        RIG_SLOTS: 'rig_slots',
        SUBSYSTEM: 'subsystem'
    },

    // Skills
    SKILL_CATEGORIES: {
        ENGINEERING: 'engineering',
        COMBAT: 'combat',
        NAVIGATION: 'navigation',
        TRADE: 'trade',
        LEADERSHIP: 'leadership',
        SCIENCE: 'science',
        EXPLORATION: 'exploration'
    },

    // Syndicate Roles
    SYNDICATE_ROLES: {
        EXECUTIVE: 'executive',
        DIRECTOR: 'director',
        MANAGER: 'manager',
        MEMBER: 'member',
        RECRUIT: 'recruit'
    }
};

// Network Events
export const NETWORK_EVENTS = {
    // Authentication
    AUTH_LOGIN: 'auth:login',
    AUTH_LOGOUT: 'auth:logout',
    AUTH_REGISTER: 'auth:register',
    AUTH_SUCCESS: 'auth:success',
    AUTH_FAILURE: 'auth:failure',

    // Game State
    GAME_STATE_UPDATE: 'game:state_update',
    GAME_ACTION: 'game:action',
    GAME_ACTION_RESULT: 'game:action_result',

    // Player
    PLAYER_UPDATE: 'player:update',
    PLAYER_LOCATION_CHANGE: 'player:location_change',
    PLAYER_SKILL_UPDATE: 'player:skill_update',

    // Universe
    UNIVERSE_UPDATE: 'universe:update',
    SYSTEM_UPDATE: 'system:update',
    MARKET_UPDATE: 'market:update',

    // Syndicate
    SYNDICATE_UPDATE: 'syndicate:update',
    SYNDICATE_MESSAGE: 'syndicate:message',
    SYNDICATE_INVITE: 'syndicate:invite',

    // Combat
    COMBAT_START: 'combat:start',
    COMBAT_UPDATE: 'combat:update',
    COMBAT_END: 'combat:end',

    // Communication
    CHAT_MESSAGE: 'chat:message',
    CHAT_CHANNEL_JOIN: 'chat:channel_join',
    CHAT_CHANNEL_LEAVE: 'chat:channel_leave',

    // System
    SYSTEM_ERROR: 'system:error',
    SYSTEM_MAINTENANCE: 'system:maintenance',
    SYSTEM_ANNOUNCEMENT: 'system:announcement'
};

// Error Codes
export const ERROR_CODES = {
    // Authentication
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',

    // Game Logic
    INSUFFICIENT_RESOURCES: 'INSUFFICIENT_RESOURCES',
    INVALID_ACTION: 'INVALID_ACTION',
    COOLDOWN_ACTIVE: 'COOLDOWN_ACTIVE',
    TARGET_NOT_FOUND: 'TARGET_NOT_FOUND',

    // Server
    SERVER_OVERLOADED: 'SERVER_OVERLOADED',
    DATABASE_ERROR: 'DATABASE_ERROR',
    RATE_LIMITED: 'RATE_LIMITED',

    // Validation
    INVALID_INPUT: 'INVALID_INPUT',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    VALUE_OUT_OF_RANGE: 'VALUE_OUT_OF_RANGE'
};

// Default Configuration
export const DEFAULTS = {
    PLAYER: {
        starting_system: 'SOL-001',
        starting_ship: 'rookie_frigate',
        starting_resources: {
            [GAME_CONSTANTS.RESOURCE_TYPES.HYDROGEN]: 1000,
            [GAME_CONSTANTS.RESOURCE_TYPES.IRON]: 500,
            [GAME_CONSTANTS.RESOURCE_TYPES.ENERGY_CELLS]: 100
        },
        starting_skills: {
            [GAME_CONSTANTS.SKILL_CATEGORIES.ENGINEERING]: 1,
            [GAME_CONSTANTS.SKILL_CATEGORIES.NAVIGATION]: 1,
            [GAME_CONSTANTS.SKILL_CATEGORIES.COMBAT]: 1
        }
    },

    SHIP: {
        rookie_frigate: {
            name: 'Rookie Frigate',
            class: GAME_CONSTANTS.SHIP_CLASSES.FRIGATE,
            hull_hp: 1000,
            shield_hp: 500,
            cargo_bay: 100,
            fuel_tank: 500,
            slots: {
                [GAME_CONSTANTS.MODULE_SLOTS.HIGH_POWER]: 2,
                [GAME_CONSTANTS.MODULE_SLOTS.MEDIUM_POWER]: 3,
                [GAME_CONSTANTS.MODULE_SLOTS.LOW_POWER]: 2,
                [GAME_CONSTANTS.MODULE_SLOTS.RIG_SLOTS]: 1
            }
        }
    }
};