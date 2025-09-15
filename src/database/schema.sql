-- Deep Space Empire Database Schema
-- PostgreSQL schema for MMO persistence

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Players table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(32) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    is_banned BOOLEAN DEFAULT false,

    -- Game data
    current_system_id UUID,
    current_ship_id UUID,
    skill_points_total BIGINT DEFAULT 0,
    skill_points_unallocated INTEGER DEFAULT 5000,

    -- Security
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,

    CONSTRAINT valid_username CHECK (username ~ '^[a-zA-Z0-9_-]{3,32}$'),
    CONSTRAINT valid_email CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$')
);

-- Player sessions
CREATE TABLE player_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Star systems
CREATE TABLE star_systems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(64) NOT NULL,
    coordinates_x BIGINT NOT NULL,
    coordinates_y BIGINT NOT NULL,
    coordinates_z BIGINT NOT NULL,
    security_level DECIMAL(2,1) NOT NULL CHECK (security_level >= -1.0 AND security_level <= 1.0),
    star_type VARCHAR(32) NOT NULL,

    -- Procedural generation seed
    generation_seed BIGINT NOT NULL,

    -- Control and ownership
    controlling_corp_id UUID,
    sovereignty_level INTEGER DEFAULT 0,

    -- Economic data
    market_hub BOOLEAN DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(coordinates_x, coordinates_y, coordinates_z)
);

-- Celestial bodies (planets, asteroids, etc.)
CREATE TABLE celestial_bodies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    system_id UUID NOT NULL REFERENCES star_systems(id) ON DELETE CASCADE,
    name VARCHAR(64) NOT NULL,
    body_type VARCHAR(32) NOT NULL, -- planet, asteroid_belt, moon, gas_giant
    orbit_position INTEGER NOT NULL,

    -- Resource data
    resource_richness JSONB DEFAULT '{}',

    -- Ownership
    owner_corp_id UUID,

    UNIQUE(system_id, orbit_position)
);

-- Ships
CREATE TABLE ships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    ship_type VARCHAR(64) NOT NULL,
    name VARCHAR(64) NOT NULL,

    -- Location
    current_system_id UUID REFERENCES star_systems(id),
    docked_at_structure_id UUID,
    coordinates_x DECIMAL(15,6),
    coordinates_y DECIMAL(15,6),
    coordinates_z DECIMAL(15,6),

    -- Ship status
    hull_hp INTEGER NOT NULL,
    shield_hp INTEGER DEFAULT 0,
    capacitor_charge DECIMAL(8,2) DEFAULT 100.0,
    fuel_amount INTEGER DEFAULT 0,

    -- Cargo
    cargo_used INTEGER DEFAULT 0,
    cargo_capacity INTEGER NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_ship_name CHECK (name ~ '^[a-zA-Z0-9 _-]{1,64}$')
);

-- Ship fittings (modules installed on ships)
CREATE TABLE ship_fittings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ship_id UUID NOT NULL REFERENCES ships(id) ON DELETE CASCADE,
    module_type VARCHAR(64) NOT NULL,
    slot_type VARCHAR(32) NOT NULL, -- high_power, medium_power, low_power, rig_slots
    slot_position INTEGER NOT NULL,

    -- Module state
    is_online BOOLEAN DEFAULT true,
    heat_level DECIMAL(5,2) DEFAULT 0.0,

    UNIQUE(ship_id, slot_type, slot_position)
);

-- Player resources/inventory
CREATE TABLE player_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    resource_type VARCHAR(64) NOT NULL,
    quantity BIGINT NOT NULL DEFAULT 0,
    location_system_id UUID REFERENCES star_systems(id),
    location_structure_id UUID,

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(player_id, resource_type, location_system_id, location_structure_id),
    CONSTRAINT positive_quantity CHECK (quantity >= 0)
);

-- Player skills
CREATE TABLE player_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    skill_name VARCHAR(64) NOT NULL,
    skill_level INTEGER NOT NULL DEFAULT 0,
    experience_points BIGINT NOT NULL DEFAULT 0,

    -- Skill training queue
    training_start_time TIMESTAMP WITH TIME ZONE,
    training_end_time TIMESTAMP WITH TIME ZONE,

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(player_id, skill_name),
    CONSTRAINT valid_skill_level CHECK (skill_level >= 0 AND skill_level <= 5),
    CONSTRAINT positive_experience CHECK (experience_points >= 0)
);

-- Corporations
CREATE TABLE corporations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(64) UNIQUE NOT NULL,
    ticker VARCHAR(8) UNIQUE NOT NULL,
    description TEXT,

    -- Leadership
    ceo_id UUID NOT NULL REFERENCES players(id),
    founded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Settings
    tax_rate DECIMAL(4,2) DEFAULT 10.00,
    is_recruiting BOOLEAN DEFAULT true,

    CONSTRAINT valid_corp_name CHECK (name ~ '^[a-zA-Z0-9 _-]{3,64}$'),
    CONSTRAINT valid_ticker CHECK (ticker ~ '^[A-Z0-9]{2,8}$'),
    CONSTRAINT valid_tax_rate CHECK (tax_rate >= 0.0 AND tax_rate <= 100.0)
);

-- Corporation memberships
CREATE TABLE corp_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    corp_id UUID NOT NULL REFERENCES corporations(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(player_id), -- Player can only be in one corp
    CONSTRAINT valid_role CHECK (role IN ('ceo', 'director', 'manager', 'member', 'recruit'))
);

-- Market orders
CREATE TABLE market_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    system_id UUID NOT NULL REFERENCES star_systems(id),

    -- Order details
    order_type VARCHAR(16) NOT NULL, -- buy, sell
    resource_type VARCHAR(64) NOT NULL,
    quantity INTEGER NOT NULL,
    price_per_unit DECIMAL(12,2) NOT NULL,

    -- Status
    quantity_remaining INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT valid_order_type CHECK (order_type IN ('buy', 'sell')),
    CONSTRAINT positive_quantity CHECK (quantity > 0),
    CONSTRAINT positive_price CHECK (price_per_unit > 0),
    CONSTRAINT valid_remaining CHECK (quantity_remaining >= 0 AND quantity_remaining <= quantity)
);

-- Research projects
CREATE TABLE research_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    corp_id UUID REFERENCES corporations(id) ON DELETE CASCADE,

    -- Project details
    project_name VARCHAR(64) NOT NULL,
    project_type VARCHAR(32) NOT NULL, -- basic, applied, theoretical

    -- Progress
    research_points_required BIGINT NOT NULL,
    research_points_current BIGINT DEFAULT 0,

    -- Timing
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estimated_completion TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Results
    success_chance DECIMAL(5,2) DEFAULT 100.0,
    is_completed BOOLEAN DEFAULT false,

    CONSTRAINT either_player_or_corp CHECK ((player_id IS NULL) != (corp_id IS NULL)),
    CONSTRAINT valid_project_type CHECK (project_type IN ('basic', 'applied', 'theoretical')),
    CONSTRAINT positive_research_points CHECK (research_points_required > 0),
    CONSTRAINT valid_success_chance CHECK (success_chance >= 0.0 AND success_chance <= 100.0)
);

-- Game events log
CREATE TABLE game_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(64) NOT NULL,
    player_id UUID REFERENCES players(id),
    corp_id UUID REFERENCES corporations(id),
    system_id UUID REFERENCES star_systems(id),

    -- Event data
    event_data JSONB NOT NULL DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_players_username ON players(username);
CREATE INDEX idx_players_email ON players(email);
CREATE INDEX idx_players_last_login ON players(last_login);

CREATE INDEX idx_sessions_player_id ON player_sessions(player_id);
CREATE INDEX idx_sessions_token ON player_sessions(session_token);
CREATE INDEX idx_sessions_expires ON player_sessions(expires_at);

CREATE INDEX idx_systems_coordinates ON star_systems(coordinates_x, coordinates_y, coordinates_z);
CREATE INDEX idx_systems_security ON star_systems(security_level);
CREATE INDEX idx_systems_corp ON star_systems(controlling_corp_id);

CREATE INDEX idx_ships_owner ON ships(owner_id);
CREATE INDEX idx_ships_system ON ships(current_system_id);

CREATE INDEX idx_resources_player ON player_resources(player_id);
CREATE INDEX idx_resources_type ON player_resources(resource_type);
CREATE INDEX idx_resources_location ON player_resources(location_system_id);

CREATE INDEX idx_skills_player ON player_skills(player_id);
CREATE INDEX idx_skills_training ON player_skills(training_end_time) WHERE training_end_time IS NOT NULL;

CREATE INDEX idx_corp_members ON corp_memberships(corp_id);
CREATE INDEX idx_corp_player ON corp_memberships(player_id);

CREATE INDEX idx_market_system ON market_orders(system_id);
CREATE INDEX idx_market_resource ON market_orders(resource_type);
CREATE INDEX idx_market_active ON market_orders(is_active) WHERE is_active = true;

CREATE INDEX idx_events_type ON game_events(event_type);
CREATE INDEX idx_events_player ON game_events(player_id);
CREATE INDEX idx_events_time ON game_events(created_at);

-- Create materialized view for market prices
CREATE MATERIALIZED VIEW market_price_summary AS
SELECT
    system_id,
    resource_type,
    order_type,
    AVG(price_per_unit) as avg_price,
    MIN(price_per_unit) as min_price,
    MAX(price_per_unit) as max_price,
    SUM(quantity_remaining) as total_quantity,
    COUNT(*) as order_count,
    MAX(created_at) as last_updated
FROM market_orders
WHERE is_active = true
GROUP BY system_id, resource_type, order_type;

CREATE UNIQUE INDEX idx_market_summary ON market_price_summary(system_id, resource_type, order_type);