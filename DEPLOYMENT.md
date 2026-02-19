# Deployment Guide - 10x Project Management

This guide helps you deploy and run the 10x PM system.

## Prerequisites

- Docker and Docker Compose installed
- Supabase account (cloud or local)
- Node.js 18+ (for local frontend development)
- Python 3.12+ (for local backend development)

## Quick Start (Docker)

### 1. Set Up Environment Variables

Create a `.env` file in the project root:

```bash
# Supabase Configuration (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key-here

# Application Base URL (for invitation links)
APP_BASE_URL=http://localhost:3737

# Email Configuration (optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@yourcompany.com
SMTP_FROM_NAME=10x Project Management
SMTP_USE_TLS=true

# AI Configuration (optional - uses Anthropic by default)
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key

# Feature Flags (optional)
ENABLE_PROJECTS=true
ENABLE_ANALYTICS=true
```

### 2. Run Database Migrations

**Option A: Supabase Cloud**

1. Open your Supabase Dashboard: https://app.supabase.com
2. Navigate to: **SQL Editor**
3. Create a new query
4. Copy the contents of `migration/complete_setup.sql`
5. Paste and click **Run**
6. Wait for completion (should show "Success")

**Option B: Local Supabase**

```bash
# If you have psql installed
chmod +x run-migrations.sh
./run-migrations.sh

# Or manually
export SUPABASE_URL='http://localhost:54321'
psql -h localhost -p 54322 -U postgres -d postgres -f migration/complete_setup.sql
```

### 3. Start Docker Services

```bash
# Build and start all services
docker compose up --build -d

# Check service status
docker compose ps

# You should see:
# - 10x-server (healthy)
# - 10x-mcp (running)
# - 10x-ui (running)
```

### 4. Verify Health

```bash
# Check backend health
curl http://localhost:8181/api/health

# Expected response:
{
  "status": "healthy",
  "ready": true,
  ...
}
```

### 5. Access the Application

- **Frontend:** http://localhost:3737
- **Backend API:** http://localhost:8181
- **MCP Server:** http://localhost:8051
- **API Docs:** http://localhost:8181/docs

## Troubleshooting

### Container Shows as "unhealthy"

**Problem:** Docker health check fails

**Solution:**
1. Check if migrations were run: `curl http://localhost:8181/api/health`
2. If `migration_required: true`, run migrations (step 2 above)
3. Restart server: `docker compose restart server`

### "Could not find table" errors

**Problem:** Missing database tables

**Solution:**
1. Ensure migrations were run successfully
2. Check Supabase connection:
   ```bash
   docker compose logs server | grep -i "supabase"
   ```
3. Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct

### Import errors on startup

**Problem:** Missing dependencies or import errors

**Solution:**
1. Check server logs: `docker compose logs server --tail 100`
2. Rebuild containers: `docker compose down && docker compose up --build -d`
3. Verify all dependencies are in `pyproject.toml`

### Health check timeout

**Problem:** Server takes too long to start

**Solution:**
1. Increase health check timeout in `docker-compose.yml`:
   ```yaml
   healthcheck:
     interval: 10s
     timeout: 10s
     retries: 10  # Increase this
   ```
2. Rebuild: `docker compose up --build -d`

## Development Workflows

### Hybrid Mode (Recommended for Development)

Run backend in Docker, frontend locally:

```bash
# Start backend services
docker compose --profile backend up -d

# Start frontend locally
cd archon-ui-main
npm install
npm run dev
```

### Full Local Mode

```bash
# Backend
cd python
uv sync --group all
uv run python -m src.server.main

# Frontend (separate terminal)
cd archon-ui-main
npm install
npm run dev
```

### Full Docker Mode

```bash
# Start everything
docker compose up --build -d

# View logs
docker compose logs -f

# Stop everything
docker compose down
```

## Updating the Application

### Pull Latest Changes

```bash
git pull origin main
docker compose down
docker compose up --build -d
```

### Run New Migrations

After pulling changes, check for new migrations:

```bash
ls migration/0.1.0/ | grep -E "^[0-9]" | sort -V

# Run any new migrations via Supabase Dashboard SQL Editor
# Or use the migration helper script
./run-migrations.sh
```

## Production Deployment

### Environment Variables

Ensure these are set in production:

```bash
# Use production Supabase instance
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_SERVICE_KEY=your-prod-service-key

# Set production base URL
APP_BASE_URL=https://your-domain.com

# Configure SMTP for emails
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key

# Add API keys
ANTHROPIC_API_KEY=your-prod-anthropic-key
```

### Security Checklist

- [ ] Change default passwords
- [ ] Use strong `SUPABASE_SERVICE_KEY`
- [ ] Enable SSL/TLS for all connections
- [ ] Set up CORS restrictions
- [ ] Configure rate limiting
- [ ] Enable logging and monitoring
- [ ] Set up database backups
- [ ] Review and update RLS policies

### Performance Optimization

- Enable PostgreSQL connection pooling
- Configure Redis for caching (optional)
- Set up CDN for static assets
- Enable Brotli/Gzip compression
- Configure appropriate worker counts

## Monitoring

### Check Service Health

```bash
# Backend
curl http://localhost:8181/api/health

# MCP Server
curl http://localhost:8051/health

# Frontend (should return HTML)
curl http://localhost:3737
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f server
docker compose logs -f mcp
docker compose logs -f frontend

# Filter for errors
docker compose logs server | grep -i error
```

### Database Connection

```bash
# Connect to local Supabase
psql -h localhost -p 54322 -U postgres -d postgres

# List tables
\dt archon_*

# Check migration status
SELECT * FROM archon_migrations ORDER BY applied_at DESC;
```

## Common Tasks

### Reset Database

```bash
# WARNING: This deletes all data!
psql -h localhost -p 54322 -U postgres -d postgres -f migration/RESET_DB.sql
psql -h localhost -p 54322 -U postgres -d postgres -f migration/complete_setup.sql
```

### Backup Database

```bash
# Export data
pg_dump -h localhost -p 54322 -U postgres -d postgres > backup.sql

# Restore data
psql -h localhost -p 54322 -U postgres -d postgres < backup.sql
```

### Update Dependencies

```bash
# Backend
cd python
uv lock
uv sync --group all

# Frontend
cd archon-ui-main
npm update
npm install
```

## Support

For issues or questions:
- Check the logs: `docker compose logs -f`
- Review migrations: `migration/0.1.0/`
- See architecture docs: `PRPs/ai_docs/ARCHITECTURE.md`
- File an issue on GitHub
