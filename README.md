<p align="center">
  <strong>10x Project Management</strong>
</p>

<p align="center">
  <em>AI-powered Project Management system with intelligent knowledge base, task management, and self-learning capabilities</em>
</p>

<p align="center">
  <a href="#what-is-10x-pm">What is 10x PM</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#whats-included">What's Included</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#troubleshooting">Troubleshooting</a>
</p>

---

## What is 10x PM?

10x PM is not just another project management tool. It's a complete **AI-powered ecosystem** that understands your team, learns from your patterns, and proactively helps you deliver projects faster and better.

For you, it's a sleek interface to manage knowledge, context, and tasks for your projects. For AI coding assistants, it's a **Model Context Protocol (MCP) server** to collaborate on and leverage the same knowledge, context, and tasks. Connect Claude Code, Kiro, Cursor, Windsurf, etc. to give your AI agents access to:

- **Your documentation** (crawled websites, uploaded PDFs/docs)
- **Smart search capabilities** with advanced RAG strategies
- **Task management** integrated with your knowledge base
- **AI self-learning** that improves suggestions over time
- **Role-based permissions** with 4-layer defense-in-depth security
- **Multi-channel notifications** with intelligent routing
- **Document review workflows** with multi-level approval chains
- **Real-time updates** as you add new content and collaborate with your coding assistant on tasks

> It doesn't matter what you're building or if it's a new/existing codebase - 10x PM's knowledge and task management capabilities will improve the output of **any** AI driven coding.

## Documentation

### Core Module Documentation

Detailed architecture, flow diagrams, and database schemas for every module:

| Module | Description |
|--------|-------------|
| [Task Management](docs/modules/01-task-management.md) | Complete task lifecycle with 6 stages (Backlog → Todo → Doing → Review → Done → Archived) |
| [Permission Management](docs/modules/02-permission-management.md) | 4-layer defense-in-depth security (UI → API → Service → Database) |
| [Role Management](docs/modules/03-role-management.md) | 7-level role hierarchy with org and project scoping |
| [Notification Management](docs/modules/04-notification-management.md) | Multi-channel intelligent notification routing with 5 priority levels |
| [Notification Acknowledgement](docs/modules/05-notification-acknowledgement.md) | Human and AI agent response handling with cross-channel sync |
| [AI Self-Learning](docs/modules/06-ai-self-learning.md) | Continuous learning system with 7 knowledge stores |
| [Document & Review System](docs/modules/07-document-review-system.md) | Structured document submission, review, and multi-level approval |

### Executive Summaries

Compact one-page summaries for quick reference and senior presentations:

- [Task Flow Summary](docs/executive-summaries/01-task-flow.md)
- [Permission Management Summary](docs/executive-summaries/02-permission-management.md)
- [Role Management Summary](docs/executive-summaries/03-role-management.md)
- [Notification Management Summary](docs/executive-summaries/04-notification-management.md)
- [Notification Acknowledgement Summary](docs/executive-summaries/05-notification-acknowledgement.md)
- [AI Self-Learning Summary](docs/executive-summaries/06-ai-self-learning.md)

## Key Highlights

### Intelligent Task Management
- **6-stage workflow**: Backlog → Todo → Doing → Review → Done → Archived
- **Sprint-based planning** with capacity management
- **AI-powered suggestions** for task priority, duration, and assignment
- **6 systems** working simultaneously on every task (Workflow, Permissions, Notifications, AI, Review, Automation)

### Smart Notifications
- **5 delivery channels**: In-App, Email, Slack/Teams, Mobile Push, SMS
- **Role-based defaults** with user preference overrides
- **Intelligent batching** and noise reduction
- **Escalation chains** for critical items (Human: 2h → 4h → 8h | Agent: 5s → 30s → 60s)

### AI That Learns
- **5-step learning cycle**: Observe → Extract → Store → Suggest → Improve
- **7 knowledge stores**: Project Templates, Task Blueprints, Dependency Maps, Duration Estimates, Team Intelligence, Quality Patterns, Feedback Loop
- **Confidence-based suggestions** (0-95%, never claims certainty)
- **Cold start handling** with general patterns until org-specific data exists

### Enterprise Security
- **4-layer permission check**: UI → API → Service → Database (all must agree)
- **7-role hierarchy**: Owner > Admin > Manager > Lead > Member > Viewer > Agent
- **Dual-role system**: Organization Role + Project Role (higher wins)
- **Human-only gates**: AI assists but only humans approve and make final decisions

### Document Management
- **Structured review workflows** with multi-level approval chains
- **Version history** with side-by-side diff comparison
- **3 document types**: Project Documents, Task Deliverables, Review Documents
- **Role-based access controls** at project, task, and comment levels

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 18+](https://nodejs.org/) (for hybrid development mode)
- [Supabase](https://supabase.com/) account (free tier or local Supabase both work)
- [OpenAI API key](https://platform.openai.com/api-keys) (Gemini and Ollama are supported too!)
- (OPTIONAL) [Make](https://www.gnu.org/software/make/) (see [Installing Make](#installing-make) below)

### Setup Instructions

1. **Clone Repository**:
   ```bash
   git clone https://github.com/DeepakChander/10x-Project-Management.git
   ```
   ```bash
   cd 10x-Project-Management
   ```

2. **Environment Configuration**:

   ```bash
   cp .env.example .env
   # Edit .env and add your Supabase credentials:
   # SUPABASE_URL=https://your-project.supabase.co
   # SUPABASE_SERVICE_KEY=your-service-key-here
   ```

   IMPORTANT NOTES:
   - For cloud Supabase: they recently introduced a new type of service role key but use the legacy one (the longer one).
   - For local Supabase: set SUPABASE_URL to http://host.docker.internal:8000 (unless you have an IP address set up).

3. **Database Setup**: In your [Supabase project](https://supabase.com/dashboard) SQL Editor, copy, paste, and execute the contents of `migration/complete_setup.sql`

4. **Start Services** (choose one):

   **Full Docker Mode (Recommended)**

   ```bash
   docker compose up --build -d
   ```

   This starts all core microservices in Docker:
   - **Server**: Core API and business logic (Port: 8181)
   - **MCP Server**: Protocol interface for AI clients (Port: 8051)
   - **UI**: Web interface (Port: 3737)

   Ports are configurable in your .env as well!

5. **Configure API Keys**:
   - Open http://localhost:3737
   - You'll automatically be brought through an onboarding flow to set your API key (OpenAI is default)

## Quick Test

Once everything is running:

1. **Test Web Crawling**: Go to http://localhost:3737 → Knowledge Base → "Crawl Website" → Enter a doc URL (such as https://ai.pydantic.dev/llms-full.txt)
2. **Test Document Upload**: Knowledge Base → Upload a PDF
3. **Test Projects**: Projects → Create a new project and add tasks
4. **Integrate with your AI coding assistant**: MCP Dashboard → Copy connection config for your AI coding assistant

## Installing Make

<details>
<summary><strong>Make installation (OPTIONAL - For Dev Workflows)</strong></summary>

### Windows

```bash
# Option 1: Using Chocolatey
choco install make

# Option 2: Using Scoop
scoop install make

# Option 3: Using WSL2
wsl --install
# Then in WSL: sudo apt-get install make
```

### macOS

```bash
# Make comes pre-installed on macOS
# If needed: brew install make
```

### Linux

```bash
# Debian/Ubuntu
sudo apt-get install make

# RHEL/CentOS/Fedora
sudo yum install make
```

</details>

<details>
<summary><strong>Quick Command Reference for Make</strong></summary>
<br/>

| Command           | Description                                             |
| ----------------- | ------------------------------------------------------- |
| `make dev`        | Start hybrid dev (backend in Docker, frontend local)    |
| `make dev-docker` | Everything in Docker                                    |
| `make stop`       | Stop all services                                       |
| `make test`       | Run all tests                                           |
| `make lint`       | Run linters                                             |
| `make install`    | Install dependencies                                    |
| `make check`      | Check environment setup                                 |
| `make clean`      | Remove containers and volumes (with confirmation)       |

</details>

## Database Reset (Start Fresh if Needed)

If you need to completely reset your database and start fresh:

<details>
<summary><strong>Reset Database - This will delete ALL data!</strong></summary>

1. **Run Reset Script**: In your Supabase SQL Editor, run the contents of `migration/RESET_DB.sql`

   WARNING: This will delete all 10x PM specific tables and data! Nothing else will be touched in your DB though.

2. **Rebuild Database**: After reset, run `migration/complete_setup.sql` to create all the tables again.

3. **Restart Services**:

   ```bash
   docker compose --profile full up -d
   ```

4. **Reconfigure**:
   - Select your LLM/embedding provider and set the API key again
   - Re-upload any documents or re-crawl websites

The reset script safely removes all tables, functions, triggers, and policies with proper dependency handling.

</details>

## Core Services

| Service            | Container Name | Default URL           | Purpose                           |
| ------------------ | -------------- | --------------------- | --------------------------------- |
| **Web Interface**  | 10x-ui         | http://localhost:3737 | Main dashboard and controls       |
| **API Service**    | 10x-server     | http://localhost:8181 | Web crawling, document processing |
| **MCP Server**     | 10x-mcp        | http://localhost:8051 | Model Context Protocol interface  |
| **Agents Service** | 10x-agents     | http://localhost:8052 | AI/ML operations, reranking       |

## Upgrading

To upgrade 10x PM to the latest version:

1. **Pull latest changes**:
   ```bash
   git pull
   ```

2. **Rebuild and restart containers**:
   ```bash
   docker compose up -d --build
   ```
   This rebuilds containers with the latest code and restarts all services.

3. **Check for database migrations**:
   - Open the 10x PM settings in your browser: [http://localhost:3737/settings](http://localhost:3737/settings)
   - Navigate to the **Database Migrations** section
   - If there are pending migrations, the UI will display them with clear instructions
   - Click on each migration to view and copy the SQL
   - Run the SQL scripts in your Supabase SQL editor in the order shown

## What's Included

### Knowledge Management

- **Smart Web Crawling**: Automatically detects and crawls entire documentation sites, sitemaps, and individual pages
- **Document Processing**: Upload and process PDFs, Word docs, markdown files, and text documents with intelligent chunking
- **Code Example Extraction**: Automatically identifies and indexes code examples from documentation for enhanced search
- **Vector Search**: Advanced semantic search with contextual embeddings for precise knowledge retrieval
- **Source Management**: Organize knowledge by source, type, and tags for easy filtering

### AI Integration

- **Model Context Protocol (MCP)**: Connect any MCP-compatible client (Claude Code, Cursor, even non-AI coding assistants like Claude Desktop)
- **MCP Tools**: Comprehensive yet simple set of tools for RAG queries, task management, and project operations
- **Multi-LLM Support**: Works with OpenAI, Ollama, and Google Gemini models
- **RAG Strategies**: Hybrid search, contextual embeddings, and result reranking for optimal AI responses
- **Real-time Streaming**: Live responses from AI agents with progress tracking

### Project & Task Management

- **Hierarchical Projects**: Organize work with projects, features, and tasks in a structured workflow
- **AI-Assisted Creation**: Generate project requirements and tasks using integrated AI agents
- **Document Management**: Version-controlled documents with collaborative editing capabilities
- **Progress Tracking**: Real-time updates and status management across all project activities

### Real-time Collaboration

- **WebSocket Updates**: Live progress tracking for crawling, processing, and AI operations
- **Multi-user Support**: Collaborative knowledge building and project management
- **Background Processing**: Asynchronous operations that don't block the user interface
- **Health Monitoring**: Built-in service health checks and automatic reconnection

## Architecture

### System Overview

```
+--------------------------------------------------+
|                 10x PM System                     |
+--------------------------------------------------+
|                                                   |
|  +------------+  +-------------+  +------------+  |
|  |   Task     |  | Permission  |  |   Role     |  |
|  | Management |  | Management  |  | Management |  |
|  +------------+  +-------------+  +------------+  |
|                                                   |
|  +------------+  +-------------+  +------------+  |
|  |Notification|  |   AI Self   |  |  Document  |  |
|  | Management |  |  Learning   |  |  & Review  |  |
|  +------------+  +-------------+  +------------+  |
|                                                   |
|  +--------------------------------------------+  |
|  |         Workflow & Automation Engine         |  |
|  +--------------------------------------------+  |
|                                                   |
|  +--------------------------------------------+  |
|  |             Database Layer                   |  |
|  |        (~30 tables across modules)           |  |
|  +--------------------------------------------+  |
+--------------------------------------------------+
```

### Microservices Structure

10x PM uses true microservices architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │  Server (API)   │    │   MCP Server    │    │ Agents Service  │
│                 │    │                 │    │                 │    │                 │
│  React + Vite   │◄──►│    FastAPI +    │◄──►│    Lightweight  │◄──►│   PydanticAI    │
│  Port 3737      │    │    SocketIO     │    │    HTTP Wrapper │    │   Port 8052     │
│                 │    │    Port 8181    │    │    Port 8051    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │                        │
         └────────────────────────┼────────────────────────┼────────────────────────┘
                                  │                        │
                         ┌─────────────────┐               │
                         │    Database     │               │
                         │                 │               │
                         │    Supabase     │◄──────────────┘
                         │    PostgreSQL   │
                         │    PGVector     │
                         └─────────────────┘
```

### Service Responsibilities

| Service        | Location             | Purpose                      | Key Features                                                       |
| -------------- | -------------------- | ---------------------------- | ------------------------------------------------------------------ |
| **Frontend**   | `archon-ui-main/`    | Web interface and dashboard  | React, TypeScript, TailwindCSS, Socket.IO client                   |
| **Server**     | `python/src/server/` | Core business logic and APIs | FastAPI, service layer, Socket.IO broadcasts, all ML/AI operations |
| **MCP Server** | `python/src/mcp/`    | MCP protocol interface       | Lightweight HTTP wrapper, MCP tools, session management            |
| **Agents**     | `python/src/agents/` | PydanticAI agent hosting     | Document and RAG agents, streaming responses                       |

### Communication Patterns

- **HTTP-based**: All inter-service communication uses HTTP APIs
- **Socket.IO**: Real-time updates from Server to Frontend
- **MCP Protocol**: AI clients connect to MCP Server via SSE or stdio
- **No Direct Imports**: Services are truly independent with no shared code dependencies

### Key Architectural Benefits

- **Lightweight Containers**: Each service contains only required dependencies
- **Independent Scaling**: Services can be scaled independently based on load
- **Development Flexibility**: Teams can work on different services without conflicts
- **Technology Diversity**: Each service uses the best tools for its specific purpose

## Configuring Custom Ports & Hostname

By default, 10x PM services run on the following ports:

- **10x-ui**: 3737
- **10x-server**: 8181
- **10x-mcp**: 8051
- **10x-agents**: 8052
- **10x-docs**: 3838 (optional)

### Changing Ports

To use custom ports, add these variables to your `.env` file:

```bash
# Service Ports Configuration
TEN_X_UI_PORT=3737
TEN_X_SERVER_PORT=8181
TEN_X_MCP_PORT=8051
TEN_X_AGENTS_PORT=8052
TEN_X_DOCS_PORT=3838
```

Example: Running on different ports:

```bash
TEN_X_SERVER_PORT=8282
TEN_X_MCP_PORT=8151
```

### Configuring Hostname

By default, 10x PM uses `localhost` as the hostname. You can configure a custom hostname or IP address by setting the `HOST` variable in your `.env` file:

```bash
# Hostname Configuration
HOST=localhost  # Default

# Examples of custom hostnames:
HOST=192.168.1.100     # Use specific IP address
HOST=10x.local         # Use custom domain
HOST=myserver.com      # Use public domain
```

This is useful when:

- Running 10x PM on a different machine and accessing it remotely
- Using a custom domain name for your installation
- Deploying in a network environment where `localhost` isn't accessible

After changing hostname or ports:

1. Restart Docker containers: `docker compose down && docker compose --profile full up -d`
2. Access the UI at: `http://${HOST}:${TEN_X_UI_PORT}`
3. Update your AI client configuration with the new hostname and MCP port

## Development

### Quick Start

```bash
# Install dependencies
make install

# Start development (recommended)
make dev        # Backend in Docker, frontend local with hot reload

# Alternative: Everything in Docker
make dev-docker # All services in Docker

# Stop everything (local FE needs to be stopped manually)
make stop
```

### Development Modes

#### Hybrid Mode (Recommended) - `make dev`

Best for active development with instant frontend updates:

- Backend services run in Docker (isolated, consistent)
- Frontend runs locally with hot module replacement
- Instant UI updates without Docker rebuilds

#### Full Docker Mode - `make dev-docker`

For all services in Docker environment:

- All services run in Docker containers
- Better for integration testing
- Slower frontend updates

### Testing & Code Quality

```bash
# Run tests
make test       # Run all tests
make test-fe    # Run frontend tests
make test-be    # Run backend tests

# Run linters
make lint       # Lint all code
make lint-fe    # Lint frontend code
make lint-be    # Lint backend code

# Check environment
make check      # Verify environment setup

# Clean up
make clean      # Remove containers and volumes (asks for confirmation)
```

### Viewing Logs

```bash
# View logs using Docker Compose directly
docker compose logs -f              # All services
docker compose logs -f 10x-server   # API server
docker compose logs -f 10x-mcp      # MCP server
docker compose logs -f 10x-ui       # Frontend
```

**Note**: The backend services are configured with `--reload` flag in their uvicorn commands and have source code mounted as volumes for automatic hot reloading when you make changes.

## Troubleshooting

### Common Issues and Solutions

#### Port Conflicts

If you see "Port already in use" errors:

```bash
# Check what's using a port (e.g., 3737)
lsof -i :3737

# Stop all containers and local services
make stop

# Change the port in .env
```

#### Docker Permission Issues (Linux)

If you encounter permission errors with Docker:

```bash
# Add your user to the docker group
sudo usermod -aG docker $USER

# Log out and back in, or run
newgrp docker
```

#### Windows-Specific Issues

- **Make not found**: Install Make via Chocolatey, Scoop, or WSL2 (see [Installing Make](#installing-make))
- **Line ending issues**: Configure Git to use LF endings:
  ```bash
  git config --global core.autocrlf false
  ```

#### Frontend Can't Connect to Backend

- Check backend is running: `curl http://localhost:8181/health`
- Verify port configuration in `.env`
- For custom ports, ensure both `TEN_X_SERVER_PORT` and `VITE_TEN_X_SERVER_PORT` are set

#### Docker Compose Hangs

If `docker compose` commands hang:

```bash
# Reset Docker Compose
docker compose down --remove-orphans
docker system prune -f

# Restart Docker Desktop (if applicable)
```

#### Hot Reload Not Working

- **Frontend**: Ensure you're running in hybrid mode (`make dev`) for best HMR experience
- **Backend**: Check that volumes are mounted correctly in `docker-compose.yml`
- **File permissions**: On some systems, mounted volumes may have permission issues

## Tech Stack

- **Frontend**: React 18, TypeScript 5, TanStack Query v5, Tailwind CSS v4, Vite
- **Backend**: Python 3.12, FastAPI, Supabase, PydanticAI
- **Infrastructure**: Docker, PostgreSQL + pgvector
- **AI**: OpenAI, Ollama, Google Gemini (multi-LLM support)

## Organization Structure

```
Organization (Company)
    |
    +-- Department (Engineering, Marketing, etc.)
            |
            +-- Team (Frontend Team, Backend Team, etc.)
                    |
                    +-- Members (with assigned roles)
```

## License

This project is proprietary. All rights reserved.
