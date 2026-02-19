-- ============================================================================
-- Quick Fix: Add Missing Core Tables
-- Description: Creates essential tables that are missing from the database
-- ============================================================================

-- Create archon_sources table if it doesn't exist
CREATE TABLE IF NOT EXISTS archon_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_url TEXT NOT NULL UNIQUE,
    display_name TEXT,
    knowledge_type TEXT DEFAULT 'documentation',
    crawl_status TEXT DEFAULT 'pending',
    last_crawled_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create archon_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS archon_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    encrypted_value TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    category VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create archon_prompts table if it doesn't exist
CREATE TABLE IF NOT EXISTS archon_prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    prompt_text TEXT NOT NULL,
    category VARCHAR(100),
    description TEXT,
    variables JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create archon_page_metadata table if it doesn't exist
CREATE TABLE IF NOT EXISTS archon_page_metadata (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_id UUID REFERENCES archon_sources(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    page_type TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source_id, url)
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_archon_sources_url ON archon_sources(source_url);
CREATE INDEX IF NOT EXISTS idx_archon_sources_status ON archon_sources(crawl_status);
CREATE INDEX IF NOT EXISTS idx_archon_settings_key ON archon_settings(key);
CREATE INDEX IF NOT EXISTS idx_archon_settings_category ON archon_settings(category);
CREATE INDEX IF NOT EXISTS idx_archon_page_metadata_source ON archon_page_metadata(source_id);
CREATE INDEX IF NOT EXISTS idx_archon_page_metadata_url ON archon_page_metadata(url);

-- Enable RLS on tables (only if not already enabled)
ALTER TABLE archon_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_page_metadata ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (with IF NOT EXISTS equivalent using DROP IF EXISTS first)
DROP POLICY IF EXISTS "Allow public read access to archon_sources" ON archon_sources;
CREATE POLICY "Allow public read access to archon_sources" ON archon_sources
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow service role full access to archon_sources" ON archon_sources;
CREATE POLICY "Allow service role full access to archon_sources" ON archon_sources
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow public read access to archon_page_metadata" ON archon_page_metadata;
CREATE POLICY "Allow public read access to archon_page_metadata" ON archon_page_metadata
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow service role full access to archon_page_metadata" ON archon_page_metadata;
CREATE POLICY "Allow service role full access to archon_page_metadata" ON archon_page_metadata
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow service role full access to archon_settings" ON archon_settings;
CREATE POLICY "Allow service role full access to archon_settings" ON archon_settings
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow service role full access to archon_prompts" ON archon_prompts;
CREATE POLICY "Allow service role full access to archon_prompts" ON archon_prompts
    FOR ALL USING (auth.role() = 'service_role');

-- Ensure archon_migrations table exists
CREATE TABLE IF NOT EXISTS archon_migrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    version VARCHAR(20) NOT NULL,
    migration_name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checksum VARCHAR(32),
    UNIQUE(version, migration_name)
);

-- Track this migration
INSERT INTO archon_migrations (version, migration_name)
VALUES ('0.1.0', 'quick_fix_missing_tables')
ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully! Essential tables created.';
END $$;
