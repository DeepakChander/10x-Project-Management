#!/bin/bash
# Migration Helper Script for 10x Project Management
# This script helps you run database migrations on your Supabase instance

set -e

echo "======================================"
echo "10x PM Database Migration Helper"
echo "======================================"
echo ""

# Check if SUPABASE_URL is set
if [ -z "$SUPABASE_URL" ]; then
    echo "❌ Error: SUPABASE_URL environment variable is not set"
    echo ""
    echo "Please set your Supabase URL:"
    echo "  export SUPABASE_URL='https://your-project.supabase.co'"
    echo ""
    echo "Or create a .env file with:"
    echo "  SUPABASE_URL=https://your-project.supabase.co"
    echo "  SUPABASE_SERVICE_KEY=your-service-key"
    exit 1
fi

echo "📊 Supabase URL: $SUPABASE_URL"
echo ""

# Check if using local Supabase or cloud
if [[ "$SUPABASE_URL" == *"localhost"* ]] || [[ "$SUPABASE_URL" == *"127.0.0.1"* ]]; then
    echo "🏠 Detected local Supabase instance"
    DB_HOST="localhost"
    DB_PORT="54322"
    DB_USER="postgres"
    DB_NAME="postgres"
    DB_PASSWORD="postgres"
else
    echo "☁️  Detected Supabase Cloud instance"
    echo ""
    echo "⚠️  For Supabase Cloud, please run migrations via the Dashboard:"
    echo ""
    echo "1. Open: $SUPABASE_URL"
    echo "2. Go to: SQL Editor"
    echo "3. Copy and paste: migration/complete_setup.sql"
    echo "4. Click: Run"
    echo ""
    echo "After running migrations, restart Docker:"
    echo "  docker compose restart server"
    exit 0
fi

echo ""
echo "🔄 Running migrations on local Supabase..."
echo ""

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql is not installed"
    echo ""
    echo "Please install PostgreSQL client:"
    echo "  - On Mac: brew install postgresql"
    echo "  - On Ubuntu: sudo apt-get install postgresql-client"
    echo "  - On Windows: Install from https://www.postgresql.org/download/windows/"
    exit 1
fi

# Run complete setup
echo "📝 Running complete_setup.sql..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f migration/complete_setup.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migrations completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Restart Docker: docker compose restart server"
    echo "2. Check health: curl http://localhost:8181/api/health"
else
    echo ""
    echo "❌ Migration failed. Please check the error above."
    exit 1
fi
