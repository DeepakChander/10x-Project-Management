-- ============================================================================
-- Fix: Add source_display_name Column
-- Description: Health check looks for source_display_name, not display_name
-- ============================================================================

-- Add source_display_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'archon_sources' AND column_name = 'source_display_name'
    ) THEN
        -- Check if display_name exists (rename it)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'archon_sources' AND column_name = 'display_name'
        ) THEN
            ALTER TABLE archon_sources RENAME COLUMN display_name TO source_display_name;
            RAISE NOTICE 'Renamed display_name to source_display_name';
        ELSE
            ALTER TABLE archon_sources ADD COLUMN source_display_name TEXT;
            RAISE NOTICE 'Added source_display_name column';
        END IF;
    ELSE
        RAISE NOTICE 'source_display_name column already exists';
    END IF;
END $$;

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
VALUES ('0.1.0', 'add_source_display_name_column')
ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Health check should now pass.';
    RAISE NOTICE '========================================';
END $$;
