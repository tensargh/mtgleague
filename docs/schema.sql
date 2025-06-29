-- MtgLeague Database Schema
-- Based on PRD data model for Supabase PostgreSQL

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'tournament_organiser');
CREATE TYPE player_visibility AS ENUM ('public', 'private');
CREATE TYPE season_status AS ENUM ('active', 'completed');
CREATE TYPE leg_status AS ENUM ('scheduled', 'in_progress', 'completed');
CREATE TYPE top8_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE top8_round AS ENUM ('qf', 'sf', 'final');
CREATE TYPE top8_result AS ENUM ('player1_win', 'player2_win');

-- STORE table
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    street1 VARCHAR(255),
    street2 VARCHAR(255),
    city VARCHAR(100),
    region VARCHAR(100),
    postal_code VARCHAR(30),
    country VARCHAR(100),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
);

-- USER table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'tournament_organiser',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STORE_TO junction table (many-to-many relationship)
CREATE TABLE store_tos (
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (store_id, user_id)
);

-- PLAYER table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    visibility player_visibility NOT NULL DEFAULT 'public',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SEASON table
CREATE TABLE seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    total_legs INTEGER NOT NULL DEFAULT 10,
    best_legs_count INTEGER NOT NULL DEFAULT 7,
    status season_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- LEG table
CREATE TABLE legs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    round_number INTEGER NOT NULL,
    status leg_status NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- LEG_RESULT table
CREATE TABLE leg_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leg_id UUID NOT NULL REFERENCES legs(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    points INTEGER NOT NULL DEFAULT 0,
    wins INTEGER NOT NULL DEFAULT 0,
    draws INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(leg_id, player_id)
);

-- TOP8 table
CREATE TABLE top8s (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    status top8_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- TOP8_MATCH table
CREATE TABLE top8_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    top8_id UUID NOT NULL REFERENCES top8s(id) ON DELETE CASCADE,
    player1_id UUID REFERENCES players(id) ON DELETE SET NULL,
    player2_id UUID REFERENCES players(id) ON DELETE SET NULL,
    round top8_round NOT NULL,
    result top8_result,
    ordinal INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_stores_name ON stores(name);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_store_tos_user_id ON store_tos(user_id);
CREATE INDEX idx_store_tos_store_id ON store_tos(store_id);
CREATE INDEX idx_players_store_id ON players(store_id);
CREATE INDEX idx_players_visibility ON players(visibility);
CREATE INDEX idx_seasons_store_id ON seasons(store_id);
CREATE INDEX idx_seasons_status ON seasons(status);
CREATE INDEX idx_legs_season_id ON legs(season_id);
CREATE INDEX idx_legs_status ON legs(status);
CREATE INDEX idx_leg_results_leg_id ON leg_results(leg_id);
CREATE INDEX idx_leg_results_player_id ON leg_results(player_id);
CREATE INDEX idx_top8s_season_id ON top8s(season_id);
CREATE INDEX idx_top8_matches_top8_id ON top8_matches(top8_id);
CREATE INDEX idx_top8_matches_round ON top8_matches(round);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for stores table
CREATE TRIGGER update_stores_updated_at 
    BEFORE UPDATE ON stores 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_tos ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leg_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE top8s ENABLE ROW LEVEL SECURITY;
ALTER TABLE top8_matches ENABLE ROW LEVEL SECURITY;

-- STORES policies
-- Public can read all stores
CREATE POLICY "Public can view stores" ON stores
    FOR SELECT USING (true);

-- Admins can do everything
CREATE POLICY "Admins can manage stores" ON stores
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- TOs can update their assigned stores
CREATE POLICY "TOs can update their stores" ON stores
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM store_tos 
            WHERE store_tos.store_id = stores.id 
            AND store_tos.user_id = auth.uid()
        )
    );

-- USERS policies
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Admins can manage all users
CREATE POLICY "Admins can manage users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- STORE_TOS policies
-- Admins can manage all store assignments
CREATE POLICY "Admins can manage store assignments" ON store_tos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Users can view their own assignments
CREATE POLICY "Users can view own assignments" ON store_tos
    FOR SELECT USING (user_id = auth.uid());

-- PLAYERS policies
-- Public can view public players
CREATE POLICY "Public can view public players" ON players
    FOR SELECT USING (visibility = 'public');

-- TOs can manage players in their stores
CREATE POLICY "TOs can manage their store players" ON players
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM store_tos 
            WHERE store_tos.store_id = players.store_id 
            AND store_tos.user_id = auth.uid()
        )
    );

-- Admins can manage all players
CREATE POLICY "Admins can manage all players" ON players
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- SEASONS policies
-- Public can view active seasons
CREATE POLICY "Public can view active seasons" ON seasons
    FOR SELECT USING (status = 'active');

-- TOs can manage seasons in their stores
CREATE POLICY "TOs can manage their store seasons" ON seasons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM store_tos 
            WHERE store_tos.store_id = seasons.store_id 
            AND store_tos.user_id = auth.uid()
        )
    );

-- Admins can manage all seasons
CREATE POLICY "Admins can manage all seasons" ON seasons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- LEGS policies
-- Public can view completed legs
CREATE POLICY "Public can view completed legs" ON legs
    FOR SELECT USING (status = 'completed');

-- TOs can manage legs in their store seasons
CREATE POLICY "TOs can manage their store legs" ON legs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM store_tos st
            JOIN seasons s ON s.store_id = st.store_id
            WHERE s.id = legs.season_id 
            AND st.user_id = auth.uid()
        )
    );

-- Admins can manage all legs
CREATE POLICY "Admins can manage all legs" ON legs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- LEG_RESULTS policies
-- Public can view results from completed legs
CREATE POLICY "Public can view completed leg results" ON leg_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM legs 
            WHERE legs.id = leg_results.leg_id 
            AND legs.status = 'completed'
        )
    );

-- TOs can manage results in their store legs
CREATE POLICY "TOs can manage their store leg results" ON leg_results
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM store_tos st
            JOIN seasons s ON s.store_id = st.store_id
            JOIN legs l ON l.season_id = s.id
            WHERE l.id = leg_results.leg_id 
            AND st.user_id = auth.uid()
        )
    );

-- Admins can manage all leg results
CREATE POLICY "Admins can manage all leg results" ON leg_results
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- TOP8S policies
-- Public can view completed top8s
CREATE POLICY "Public can view completed top8s" ON top8s
    FOR SELECT USING (status = 'completed');

-- TOs can manage top8s in their store seasons
CREATE POLICY "TOs can manage their store top8s" ON top8s
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM store_tos st
            JOIN seasons s ON s.store_id = st.store_id
            WHERE s.id = top8s.season_id 
            AND st.user_id = auth.uid()
        )
    );

-- Admins can manage all top8s
CREATE POLICY "Admins can manage all top8s" ON top8s
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- TOP8_MATCHES policies
-- Public can view completed top8 matches
CREATE POLICY "Public can view completed top8 matches" ON top8_matches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM top8s 
            WHERE top8s.id = top8_matches.top8_id 
            AND top8s.status = 'completed'
        )
    );

-- TOs can manage matches in their store top8s
CREATE POLICY "TOs can manage their store top8 matches" ON top8_matches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM store_tos st
            JOIN seasons s ON s.store_id = st.store_id
            JOIN top8s t ON t.season_id = s.id
            WHERE t.id = top8_matches.top8_id 
            AND st.user_id = auth.uid()
        )
    );

-- Admins can manage all top8 matches
CREATE POLICY "Admins can manage all top8 matches" ON top8_matches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Insert sample admin user (optional - remove in production)
-- INSERT INTO users (email, name, role) VALUES ('admin@mtgleague.com', 'System Admin', 'admin'); 