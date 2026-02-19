# AWS Deployment Guide — 10x Project Management

**Complete step-by-step guide to deploy on an AWS EC2 instance**
**Covers:** Full stack deployment + MCP server accessible from your local Claude Code

---

## What Gets Deployed

```
Your EC2 Instance (Public IP: X.X.X.X)
├── :3737  → Frontend (React UI)
├── :8181  → Backend API (FastAPI)
├── :8051  → MCP Server (your Claude Code connects here)
└── :8052  → Agents Service (Coding Agent)

Your Local Machine
└── Claude Code → .mcp.json points to http://X.X.X.X:8051
    (MCP tools work exactly the same, but run on AWS)
```

---

## PART 1 — AWS Console: Security Group Setup

> Do this FIRST before connecting to your server. Without open ports, nothing will work.

1. Open **AWS Console → EC2 → Security Groups**
2. Find the Security Group attached to your instance
3. Click **Edit Inbound Rules** → Add these rules:

| Type | Protocol | Port | Source | Purpose |
|------|----------|------|--------|---------|
| SSH | TCP | 22 | My IP | Connect to server |
| Custom TCP | TCP | 3737 | 0.0.0.0/0 | Frontend UI |
| Custom TCP | TCP | 8181 | 0.0.0.0/0 | Backend API |
| Custom TCP | TCP | 8051 | 0.0.0.0/0 | MCP Server |
| Custom TCP | TCP | 8052 | 0.0.0.0/0 | Agents Service |

4. Click **Save rules**

> **Security note:** Port 22 is restricted to your IP. Ports 3737, 8181, 8051, 8052 are open to the internet so your team can access them. If you want to restrict MCP to only your IP, change port 8051 Source to `My IP`.

---

## PART 2 — Get Your EC2 Public IP

In AWS Console → EC2 → Instances → click your instance.

Find: **Public IPv4 address** (example: `54.123.45.67`)

> Recommended: Assign an **Elastic IP** so the IP never changes.
> AWS Console → EC2 → Elastic IPs → Allocate → Associate with your instance.

**Write down your IP — you'll use it in every step below:**
```
MY_AWS_IP = 54.123.45.67    ← replace with your actual IP
```

---

## PART 3 — Connect to Your EC2 Instance

Open a terminal on your local machine.

**Find your .pem key file** (downloaded when you created the instance).

```bash
# Give the key file correct permissions (required on Linux/Mac)
chmod 400 /path/to/your-key.pem

# Connect via SSH
ssh -i /path/to/your-key.pem ubuntu@54.123.45.67
```

> Replace `ubuntu` with `ec2-user` if you're using Amazon Linux instead of Ubuntu.

You are now inside the EC2 instance. All commands below run ON the EC2 server.

---

## PART 4 — Install Docker on EC2

Run these commands on your EC2 instance:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add current user to docker group (avoids needing sudo for docker commands)
sudo usermod -aG docker $USER

# Apply the group change without logging out
newgrp docker

# Verify Docker is installed
docker --version
```

Expected output: `Docker version 25.x.x, build ...`

```bash
# Install Docker Compose plugin
sudo apt install -y docker-compose-plugin

# Verify
docker compose version
```

Expected output: `Docker Compose version v2.x.x`

---

## PART 5 — Upload Project Code to EC2

You have two options. **Option A is easier** if your code is on GitHub. **Option B** works if it's only on your local machine.

---

### OPTION A — Clone from GitHub (Recommended)

```bash
# On EC2: install git
sudo apt install -y git

# Clone your repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Enter the project folder
cd YOUR_REPO_NAME
```

---

### OPTION B — Upload from Your Local Machine (No GitHub needed)

Run this on your **local machine** (not EC2):

```bash
# From your local machine — uploads the entire project to EC2
# Run this from the PARENT folder of the project
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '__pycache__' \
  --exclude '.git' \
  --exclude '*.pyc' \
  --exclude 'dist' \
  -e "ssh -i /path/to/your-key.pem" \
  ./10x-Project-Management/ \
  ubuntu@54.123.45.67:~/10x-Project-Management/
```

Then on EC2:
```bash
cd ~/10x-Project-Management
```

---

## PART 6 — Create the .env File on EC2

This is the most important configuration step.

```bash
# On EC2, inside the project folder
# Copy the example to create your .env
cp .env.example .env

# Open it for editing
nano .env
```

**Replace the contents with this — fill in YOUR values:**

```bash
# =============================================================
# REQUIRED: Supabase credentials (same as your local setup)
# =============================================================
SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
SUPABASE_SERVICE_KEY=YOUR-SERVICE-ROLE-KEY-HERE

# =============================================================
# REQUIRED: Set this to your EC2 Public IP
# =============================================================
HOST=54.123.45.67

# =============================================================
# REQUIRED: Update this URL to your EC2 IP for invite links
# =============================================================
APP_BASE_URL=http://54.123.45.67:3737

# =============================================================
# REQUIRED: Allow the EC2 IP as a valid host for the frontend
# =============================================================
VITE_ALLOWED_HOSTS=54.123.45.67

# =============================================================
# Service Ports (keep as-is unless you have a reason to change)
# =============================================================
ARCHON_SERVER_PORT=8181
ARCHON_MCP_PORT=8051
ARCHON_AGENTS_PORT=8052
ARCHON_UI_PORT=3737

# =============================================================
# Logging
# =============================================================
LOG_LEVEL=INFO
LOGFIRE_TOKEN=

# =============================================================
# Email (optional — for invitation emails)
# If not set, invitations will still be created but emails won't send
# =============================================================
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=YOUR-SENDGRID-API-KEY
EMAIL_FROM=noreply@yourcompany.com
EMAIL_FROM_NAME=10x PM

# =============================================================
# Frontend
# =============================================================
VITE_SHOW_DEVTOOLS=false
PROD=false
```

Save and exit: press `Ctrl+X`, then `Y`, then `Enter`

**Verify the file saved correctly:**
```bash
cat .env | grep HOST
# Should show: HOST=54.123.45.67
```

---

## PART 7 — Build and Start All Containers

```bash
# On EC2, inside the project folder
# Build all images and start all 4 services including the agents
docker compose --profile agents up -d --build
```

This takes **5–10 minutes** on first run (downloading base images, building).

Watch the build progress:
```bash
docker compose --profile agents logs -f
```

Press `Ctrl+C` to stop watching logs (containers keep running).

---

## PART 8 — Verify Everything is Running

```bash
# Check all 4 containers are healthy
docker compose ps
```

Expected output:
```
NAME          STATUS                    PORTS
10x-server    Up X minutes (healthy)    0.0.0.0:8181->8181/tcp
10x-mcp       Up X minutes (healthy)    0.0.0.0:8051->8051/tcp
10x-agents    Up X minutes (healthy)    0.0.0.0:8052->8052/tcp
10x-ui        Up X minutes (healthy)    0.0.0.0:3737->3737/tcp
```

If a container shows `(unhealthy)` or keeps restarting, check its logs:
```bash
docker compose logs 10x-server    # or 10x-mcp, 10x-agents, 10x-ui
```

**Verify each service from the EC2 instance itself:**

```bash
# Backend API health check
curl http://localhost:8181/health

# MCP server health check
curl http://localhost:8051/health

# Agents service health check
curl http://localhost:8052/health

# Frontend (should return HTML)
curl -I http://localhost:3737
```

All should return `200 OK` responses.

---

## PART 9 — Verify from Your Browser

Open these URLs in your browser (replace with your actual IP):

| Service | URL | Expected |
|---------|-----|----------|
| Frontend | `http://54.123.45.67:3737` | Login page loads |
| Backend API | `http://54.123.45.67:8181/health` | `{"status": "healthy"}` |
| MCP Server | `http://54.123.45.67:8051/health` | `{"status": "healthy"}` |
| Agents | `http://54.123.45.67:8052/health` | `{"status": "healthy", "agents_available": [...]}` |

If the frontend loads but API calls fail, check that port 8181 is open in the Security Group.

---

## PART 10 — Run the One-Time Database Trigger Fix

This is required if you haven't already run it. Open your Supabase project → SQL Editor and run:

```sql
CREATE OR REPLACE FUNCTION record_status_change()
RETURNS TRIGGER AS $$
DECLARE
    time_in_status INTERVAL;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        time_in_status := NOW() - OLD.updated_at;
        INSERT INTO archon_task_status_history (
            task_id, user_id, old_status, new_status, time_in_previous_status
        ) VALUES (
            NEW.id,
            '00000000-0000-0000-0000-000000000001'::uuid,
            OLD.status,
            NEW.status,
            time_in_status
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## PART 11 — Connect Claude Code MCP to AWS

This makes your **local Claude Code** use the MCP server running on AWS. Your prompts run locally but the tools execute on the AWS server.

### Step 1 — Find or create your .mcp.json

**On your local machine**, the MCP configuration is stored in:

- **Project-level** (recommended): `C:\Users\hp\Desktop\10x-Project-Management\.mcp.json`
- **Global level**: `C:\Users\hp\.claude\claude.json` (under `mcpServers` key)

### Step 2 — Create the project .mcp.json

On your local machine, create this file at `C:\Users\hp\Desktop\10x-Project-Management\.mcp.json`:

```json
{
  "mcpServers": {
    "10x": {
      "type": "sse",
      "url": "http://54.123.45.67:8051/sse"
    }
  }
}
```

Replace `54.123.45.67` with your actual EC2 Public IP.

### Step 3 — Restart Claude Code

Close and reopen Claude Code in the project folder. It will pick up the new `.mcp.json` automatically.

### Step 4 — Verify MCP is connected

In Claude Code, type:

```
Show me all projects
```

If it returns results from your Supabase database, the MCP connection to AWS is working.

**Or test directly from your browser:**
```
http://54.123.45.67:8051/health
```

---

## PART 12 — Configure OpenAI API Key on AWS

After deploying, the OpenAI key needs to be added via the Settings UI on AWS (it's stored in the database, not the .env file).

1. Open `http://54.123.45.67:3737` in your browser
2. Sign up / Log in
3. Go to **Settings → Credentials**
4. Add `OPENAI_API_KEY` with your key value
5. Click **Save**

Verify the agents service picked it up:
```bash
# On EC2
docker logs 10x-agents 2>&1 | grep -E "OPENAI|credential|coding"
```

Expected:
```
INFO: Set credential: OPENAI_API_KEY
INFO: Initialized coding agent with model: openai:gpt-4o-mini
```

---

## PART 13 — Keep the Application Running (Auto-restart)

By default, Docker containers stop when the EC2 instance restarts. Add this to make them start automatically:

```bash
# On EC2
# Enable Docker to start on boot
sudo systemctl enable docker

# Add restart policy to all running containers
docker update --restart unless-stopped 10x-server 10x-mcp 10x-ui 10x-agents
```

Alternatively, add `restart: unless-stopped` to each service in docker-compose.yml before deploying.

---

## COMMON ISSUES & FIXES

### Frontend loads but API calls fail (CORS or proxy error)

The Vite proxy in the frontend container forwards `/api` requests to `http://server:8181` via Docker's internal network. This should work automatically.

If it's not working, check the proxy target in container logs:
```bash
docker logs 10x-ui 2>&1 | grep -E "PROXY|proxy|error"
```

### Frontend shows "Invalid Host header" error

You need to add your EC2 IP to `VITE_ALLOWED_HOSTS` in `.env`:
```bash
# Edit .env and change:
VITE_ALLOWED_HOSTS=54.123.45.67

# Restart the frontend container to apply:
docker compose restart frontend
```

### MCP tools not connecting from Claude Code

1. Verify the MCP server is running: `curl http://54.123.45.67:8051/health`
2. Verify port 8051 is open in AWS Security Group
3. Check the `.mcp.json` URL uses `/sse` at the end: `http://54.123.45.67:8051/sse`
4. Restart Claude Code completely

### Agents container not starting

```bash
docker compose --profile agents logs agents
```

Common cause: Docker requires the `--profile agents` flag. Verify:
```bash
docker ps | grep agents
# If not listed, run:
docker compose --profile agents up -d agents
```

### Container keeps restarting

```bash
# Check what's failing
docker logs 10x-server --tail 50

# Most common cause: .env missing required values
# Check:
cat .env | grep SUPABASE
```

### Code changes not reflected

The docker-compose.yml mounts source code as volumes (hot reload). If you upload new code:
```bash
# Pull latest code
git pull

# Restart to apply changes
docker compose --profile agents restart
```

If you changed `docker-compose.yml` or `.env`:
```bash
docker compose --profile agents up -d --build
```

---

## UPDATING THE APPLICATION

When you make code changes locally and push to GitHub:

```bash
# On EC2
cd ~/10x-Project-Management

# Pull latest code
git pull

# Restart containers (volumes auto-reflect source changes)
docker compose --profile agents restart

# If you changed Dockerfiles or dependencies:
docker compose --profile agents up -d --build
```

---

## DAILY OPERATIONS

```bash
# Check status
docker compose ps

# View server logs
docker compose logs -f 10x-server

# View all logs
docker compose --profile agents logs -f

# Stop everything
docker compose --profile agents down

# Start everything
docker compose --profile agents up -d

# Restart one service
docker compose restart 10x-mcp

# Check disk usage
docker system df

# Clean up old images (free disk space)
docker system prune -f
```

---

## SECURITY HARDENING (Optional but Recommended)

### Restrict API access to known IPs only

In AWS Security Group, change Source for ports 8181 and 8051 from `0.0.0.0/0` to your office/home IP.

### Set up HTTPS with a domain name

If you have a domain name, you can add SSL with nginx + certbot:

```bash
# On EC2
sudo apt install -y nginx certbot python3-certbot-nginx

# Create nginx config
sudo nano /etc/nginx/sites-available/10x-pm
```

Nginx config for reverse proxy:
```nginx
server {
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3737;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api {
        proxy_pass http://localhost:8181;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/10x-pm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate (free)
sudo certbot --nginx -d yourdomain.com
```

After adding SSL, update your `.mcp.json` to use `https`:
```json
{
  "mcpServers": {
    "10x": {
      "type": "sse",
      "url": "https://yourdomain.com/mcp/sse"
    }
  }
}
```

---

## DEPLOYMENT CHECKLIST

### Before Deploying
- [ ] EC2 instance created and running
- [ ] Security Group has ports 22, 3737, 8181, 8051, 8052 open
- [ ] Public IP noted (or Elastic IP assigned)
- [ ] SSH key (.pem file) accessible on local machine

### On EC2 Server
- [ ] SSH connected successfully
- [ ] Docker installed (`docker --version`)
- [ ] Docker Compose installed (`docker compose version`)
- [ ] Project code uploaded (git clone or rsync)
- [ ] `.env` file created with correct values:
  - [ ] `SUPABASE_URL` filled in
  - [ ] `SUPABASE_SERVICE_KEY` filled in (service role key, NOT anon key)
  - [ ] `HOST=<EC2-PUBLIC-IP>`
  - [ ] `APP_BASE_URL=http://<EC2-PUBLIC-IP>:3737`
  - [ ] `VITE_ALLOWED_HOSTS=<EC2-PUBLIC-IP>`
- [ ] `docker compose --profile agents up -d --build` ran successfully
- [ ] All 4 containers show `(healthy)` in `docker compose ps`
- [ ] `curl http://localhost:8181/health` returns 200

### In Browser
- [ ] `http://<EC2-IP>:3737` loads the login page
- [ ] Can sign up and create organization
- [ ] Settings → Credentials → OPENAI_API_KEY saved
- [ ] `docker logs 10x-agents | grep "coding agent"` shows "Initialized"

### MCP on Local Machine
- [ ] `.mcp.json` created with `"url": "http://<EC2-IP>:8051/sse"`
- [ ] Claude Code restarted
- [ ] MCP tools work ("Show me all projects" returns results)

### Database
- [ ] Trigger fix SQL run in Supabase SQL Editor

### Done!
- [ ] Open `http://<EC2-IP>:3737` and run the full demo

---

## QUICK REFERENCE

```bash
# SSH into EC2
ssh -i /path/to/key.pem ubuntu@54.123.45.67

# Start everything
docker compose --profile agents up -d

# Check status
docker compose ps

# View logs
docker compose logs -f 10x-server

# Update and restart
git pull && docker compose --profile agents restart

# Stop everything
docker compose --profile agents down
```

**Access URLs after deployment:**
```
Frontend:  http://54.123.45.67:3737
API:       http://54.123.45.67:8181
MCP:       http://54.123.45.67:8051
Agents:    http://54.123.45.67:8052
```

**Local .mcp.json for Claude Code:**
```json
{
  "mcpServers": {
    "10x": {
      "type": "sse",
      "url": "http://54.123.45.67:8051/sse"
    }
  }
}
```

---

*Replace `54.123.45.67` with your actual EC2 Public IP throughout this guide.*
