-- ============================================================================
-- Comprehensive Fix: Add All Missing Columns to Existing Tables
-- Description: Safely adds missing columns that were added in various updates
-- ============================================================================

-- Fix archon_sources table - add missing columns if they don't exist
DO $$
BEGIN
    -- Add display_name if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'archon_sources' AND column_name = 'display_name'
    ) THEN
        ALTER TABLE archon_sources ADD COLUMN display_name TEXT;
    END IF;

    -- Add source_url if missing (rename from url if needed)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'archon_sources' AND column_name = 'source_url'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'archon_sources' AND column_name = 'url'
        ) THEN
            ALTER TABLE archon_sources RENAME COLUMN url TO source_url;
        ELSE
            ALTER TABLE archon_sources ADD COLUMN source_url TEXT;
        END IF;
    END IF;

    -- Add knowledge_type if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'archon_sources' AND column_name = 'knowledge_type'
    ) THEN
        ALTER TABLE archon_sources ADD COLUMN knowledge_type TEXT DEFAULT 'documentation';
    END IF;

    -- Add crawl_status if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'archon_sources' AND column_name = 'crawl_status'
    ) THEN
        ALTER TABLE archon_sources ADD COLUMN crawl_status TEXT DEFAULT 'pending';
    END IF;

    -- Add last_crawled_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'archon_sources' AND column_name = 'last_crawled_at'
    ) THEN
        ALTER TABLE archon_sources ADD COLUMN last_crawled_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add error_message if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'archon_sources' AND column_name = 'error_message'
    ) THEN
        ALTER TABLE archon_sources ADD COLUMN error_message TEXT;
    END IF;

    -- Add metadata if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'archon_sources' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE archon_sources ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;

    RAISE NOTICE 'archon_sources table columns updated successfully';
END $$;

-- Fix archon_documents table - add missing columns
DO $$
BEGIN
    -- Add embedding if missing
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'archon_documents') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'archon_documents' AND column_name = 'embedding'
        ) THEN
            ALTER TABLE archon_documents ADD COLUMN embedding vector(1536);
        END IF;

        -- Add metadata if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'archon_documents' AND column_name = 'metadata'
        ) THEN
            ALTER TABLE archon_documents ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
        END IF;

        -- Add search_vector if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'archon_documents' AND column_name = 'search_vector'
        ) THEN
            ALTER TABLE archon_documents ADD COLUMN search_vector tsvector;
        END IF;

        RAISE NOTICE 'archon_documents table columns updated successfully';
    END IF;
END $$;

-- Fix archon_tasks table - add Phase 1.1 enhanced lifecycle columns
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'archon_tasks') THEN
        -- Add reviewer_id if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'archon_tasks' AND column_name = 'reviewer_id'
        ) THEN
            ALTER TABLE archon_tasks ADD COLUMN reviewer_id UUID;
        END IF;

        -- Add story_points if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'archon_tasks' AND column_name = 'story_points'
        ) THEN
            ALTER TABLE archon_tasks ADD COLUMN story_points INTEGER;
        END IF;

        -- Add due_date if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'archon_tasks' AND column_name = 'due_date'
        ) THEN
            ALTER TABLE archon_tasks ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;
        END IF;

        -- Add started_at if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'archon_tasks' AND column_name = 'started_at'
        ) THEN
            ALTER TABLE archon_tasks ADD COLUMN started_at TIMESTAMP WITH TIME ZONE;
        END IF;

        -- Add completed_at if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'archon_tasks' AND column_name = 'completed_at'
        ) THEN
            ALTER TABLE archon_tasks ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
        END IF;

        -- Add created_by if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'archon_tasks' AND column_name = 'created_by'
        ) THEN
            ALTER TABLE archon_tasks ADD COLUMN created_by UUID;
        END IF;

        -- Add parent_task_id if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'archon_tasks' AND column_name = 'parent_task_id'
        ) THEN
            ALTER TABLE archon_tasks ADD COLUMN parent_task_id UUID REFERENCES archon_tasks(id) ON DELETE SET NULL;
        END IF;

        -- Add tags if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'archon_tasks' AND column_name = 'tags'
        ) THEN
            ALTER TABLE archon_tasks ADD COLUMN tags TEXT[];
        END IF;

        -- Add estimated_hours if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'archon_tasks' AND column_name = 'estimated_hours'
        ) THEN
            ALTER TABLE archon_tasks ADD COLUMN estimated_hours NUMERIC(5,2);
        END IF;

        -- Add actual_hours if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'archon_tasks' AND column_name = 'actual_hours'
        ) THEN
            ALTER TABLE archon_tasks ADD COLUMN actual_hours NUMERIC(5,2);
        END IF;

        RAISE NOTICE 'archon_tasks table columns updated successfully';
    END IF;
END $$;

-- Fix archon_projects table - add missing columns
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'archon_projects') THEN
        -- Add pinned if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'archon_projects' AND column_name = 'pinned'
        ) THEN
            ALTER TABLE archon_projects ADD COLUMN pinned BOOLEAN DEFAULT FALSE;
        END IF;

        -- Add archived if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'archon_projects' AND column_name = 'archived'
        ) THEN
            ALTER TABLE archon_projects ADD COLUMN archived BOOLEAN DEFAULT FALSE;
        END IF;

        RAISE NOTICE 'archon_projects table columns updated successfully';
    END IF;
END $$;

-- Create archon_code_examples table if it doesn't exist
CREATE TABLE IF NOT EXISTS archon_code_examples (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_id UUID REFERENCES archon_sources(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    language TEXT,
    summary TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding vector(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for archon_code_examples
CREATE INDEX IF NOT EXISTS idx_code_examples_source ON archon_code_examples(source_id);
CREATE INDEX IF NOT EXISTS idx_code_examples_language ON archon_code_examples(language);

-- Enable RLS on archon_code_examples
ALTER TABLE archon_code_examples ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for archon_code_examples
DROP POLICY IF EXISTS "Allow public read access to archon_code_examples" ON archon_code_examples;
CREATE POLICY "Allow public read access to archon_code_examples" ON archon_code_examples
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow service role full access to archon_code_examples" ON archon_code_examples;
CREATE POLICY "Allow service role full access to archon_code_examples" ON archon_code_examples
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
VALUES ('0.1.0', 'fix_all_missing_columns')
ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'All missing columns have been added.';
    RAISE NOTICE '========================================';
END $$;
