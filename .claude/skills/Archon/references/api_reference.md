# Archon API Reference

> **Base URL:** `http://localhost:3737`
> **All API routes use `/api` prefix** unless noted otherwise.

---

## Table of Contents

1. [Settings & Credentials](#1-settings--credentials-api)
2. [Knowledge Base](#2-knowledge-api)
3. [RAG Search](#3-rag-search-api)
4. [Projects](#4-projects-api)
5. [Tasks](#5-tasks-api)
6. [Documents](#6-documents-api)
7. [Versions](#7-versions-api)
8. [Progress](#8-progress-api)
9. [Pages](#9-pages-api)
10. [MCP Server](#10-mcp-api)
11. [Ollama](#11-ollama-api)
12. [Agent Chat](#12-agent-chat-api)
13. [Providers](#13-providers-api)
14. [Version Check](#14-version-api)
15. [Bug Reports](#15-bug-report-api)
16. [Migrations](#16-migrations-api)
17. [Internal](#17-internal-api)
18. [Health Checks](#18-health-checks)
19. [Common Patterns](#19-common-patterns)

---

## 1. Settings & Credentials API

### List Credentials

```
GET /api/credentials
```

| Query Param | Type   | Required | Description              |
|-------------|--------|----------|--------------------------|
| `category`  | string | No       | Filter by category       |

**Response:** Array of credential objects (`key`, `value`, `is_encrypted`, `category`, `description`)

### Get Credential

```
GET /api/credentials/{key}
```

Returns single credential or 404. Built-in defaults for `DISCONNECT_SCREEN_ENABLED`, `PROJECTS_ENABLED`, `LOGFIRE_ENABLED`.

### Get Credentials by Category

```
GET /api/credentials/categories/{category}
```

**Response:** `{ credentials: [] }`

### Create/Update Credential

```
POST /api/credentials
```

```json
{
  "key": "OPENAI_API_KEY",
  "value": "sk-...",
  "is_encrypted": true,
  "category": "api_keys",
  "description": "OpenAI API key"
}
```

**Response:** `{ success, message }`

### Update Credential

```
PUT /api/credentials/{key}
```

```json
{
  "value": "new-value",
  "is_encrypted": true,
  "category": "api_keys",
  "description": "Updated description"
}
```

### Delete Credential

```
DELETE /api/credentials/{key}
```

### Reload Credentials

```
POST /api/credentials/initialize
```

Reloads all credentials from database.

### Check Credential Status

```
POST /api/credentials/status-check
```

```json
{ "keys": ["OPENAI_API_KEY", "SUPABASE_URL"] }
```

**Response:** `{ "OPENAI_API_KEY": { key, value, has_value, error? } }`

### Database Metrics

```
GET /api/database/metrics
```

**Response:** `{ status, database, tables: { projects, tasks, crawled_pages, settings }, total_records, timestamp }`

### Settings Health

```
GET /api/settings/health
```

**Response:** `{ status, service }`

---

## 2. Knowledge API

### List Knowledge Items

```
GET /api/knowledge-items
```

| Query Param      | Type   | Default | Description               |
|-------------------|--------|---------|---------------------------|
| `page`            | int    | 1       | Page number               |
| `per_page`        | int    | 20      | Items per page            |
| `knowledge_type`  | string | -       | Filter by type            |
| `search`          | string | -       | Text search filter        |

### Get Knowledge Summaries (Polling-optimized)

```
GET /api/knowledge-items/summary
```

Same params as above. Returns minimal data with counts, no full content.

### Get Knowledge Sources

```
GET /api/knowledge-items/sources
```

Returns available knowledge sources.

### Get Document Chunks

```
GET /api/knowledge-items/{source_id}/chunks
```

| Query Param     | Type   | Default | Max | Description            |
|-----------------|--------|---------|-----|------------------------|
| `domain_filter` | string | -       | -   | Filter by domain       |
| `limit`         | int    | 20      | 100 | Results per page       |
| `offset`        | int    | 0       | -   | Pagination offset      |

**Response:** `{ success, source_id, domain_filter, chunks, total, limit, offset, has_more }`

### Get Code Examples

```
GET /api/knowledge-items/{source_id}/code-examples
```

| Query Param | Type | Default | Max | Description      |
|-------------|------|---------|-----|------------------|
| `limit`     | int  | 20      | 100 | Results per page |
| `offset`    | int  | 0       | -   | Pagination offset|

**Response:** `{ success, source_id, code_examples, total, limit, offset, has_more }`

### Update Knowledge Item

```
PUT /api/knowledge-items/{source_id}
```

```json
{ "updates": { "title": "New Title", "tags": ["api", "docs"] } }
```

### Delete Knowledge Item

```
DELETE /api/knowledge-items/{source_id}
```

**Response:** `{ success, message, ...result_data }`

### Refresh Knowledge Item (Re-crawl)

```
POST /api/knowledge-items/{source_id}/refresh
```

Validates API key. Returns `{ progressId, message }`.

### Stop Crawl

```
POST /api/knowledge-items/stop/{progress_id}
```

**Response:** `{ success, message, progressId }`

### Crawl Website

```
POST /api/knowledge-items/crawl
```

```json
{
  "url": "https://docs.example.com",
  "knowledge_type": "technical",
  "tags": ["docs"],
  "update_frequency": "weekly",
  "max_depth": 3,
  "extract_code_examples": true
}
```

**Response:** `{ success, progressId, message, estimatedDuration }`

Max concurrent crawls: 3 (enforced by semaphore).

### Upload Document

```
POST /api/documents/upload
```

**Content-Type:** `multipart/form-data`

| Field                   | Type        | Default      | Description                |
|-------------------------|-------------|--------------|----------------------------|
| `file`                  | File        | required     | PDF, DOCX, MD, or TXT      |
| `tags`                  | string/JSON | `[]`         | JSON array of tag strings   |
| `knowledge_type`        | string      | `"technical"`| Knowledge category          |
| `extract_code_examples` | boolean     | `true`       | Extract code blocks         |

**Response:** `{ success, progressId, message, filename }`

### Get Crawl Progress

```
GET /api/crawl-progress/{progress_id}
```

**Response:** Progress object (see [Progress Tracking Pattern](#progress-tracking-pattern)).

---

## 3. RAG Search API

### Search Knowledge Items

```
POST /api/knowledge-items/search
```

```json
{
  "query": "authentication implementation",
  "source": "source-uuid",
  "match_count": 5,
  "return_mode": "chunks"
}
```

### RAG Query

```
POST /api/rag/query
```

```json
{
  "query": "vector search pgvector",
  "source": "source-uuid",
  "match_count": 5,
  "return_mode": "chunks"
}
```

| Field         | Type   | Default    | Description                          |
|---------------|--------|------------|--------------------------------------|
| `query`       | string | required   | Search query (2-5 keywords best)     |
| `source`      | string | -          | Filter by source UUID                |
| `match_count` | int    | 5          | Max results                          |
| `return_mode` | string | `"chunks"` | `"chunks"` or `"pages"`             |

**Response:** `{ success, results: [], reranked, error? }`

### Search Code Examples

```
POST /api/rag/code-examples
```

```json
{
  "query": "React useState",
  "source": "source-uuid",
  "match_count": 5
}
```

Alias: `POST /api/code-examples` (same request/response)

### Get RAG Sources

```
GET /api/rag/sources
```

Returns all available sources for RAG queries.

### Delete Source

```
DELETE /api/sources/{source_id}
```

Deletes source and all associated documents/chunks.

---

## 4. Projects API

### List Projects

```
GET /api/projects
```

| Query Param       | Type    | Default | Description                    |
|--------------------|---------|---------|--------------------------------|
| `include_content`  | boolean | true    | Include full content fields    |

**Headers:** `If-None-Match` for ETag caching.
**Response:** `{ projects: [], timestamp, count }`

### Create Project

```
POST /api/projects
```

```json
{
  "title": "Auth System",
  "description": "Implement OAuth2",
  "github_repo": "https://github.com/org/repo",
  "docs": {},
  "features": [],
  "data": {},
  "technical_sources": [],
  "business_sources": [],
  "pinned": false
}
```

Only `title` is required.
**Response:** `{ project_id, project?, status: "completed", message }`

### Get Project

```
GET /api/projects/{project_id}
```

### Update Project

```
PUT /api/projects/{project_id}
```

All fields optional. Automatically creates version snapshots for JSONB fields.

### Delete Project

```
DELETE /api/projects/{project_id}
```

Cascading delete: removes all associated tasks.
**Response:** `{ message, deleted_tasks }`

### Get Project Features

```
GET /api/projects/{project_id}/features
```

**Response:** `{ features: [], count }`

### Projects Health

```
GET /api/projects/health
```

**Response:** `{ status, service: "projects", schema: { projects_table, tasks_table, valid } }`

---

## 5. Tasks API

### List Tasks (Global)

```
GET /api/tasks
```

| Query Param           | Type    | Default | Description                     |
|------------------------|---------|---------|----------------------------------|
| `status`              | string  | -       | Filter: todo, doing, review, done|
| `project_id`          | string  | -       | Filter by project                |
| `include_closed`      | boolean | true    | Include done tasks               |
| `page`                | int     | 1       | Page number                      |
| `per_page`            | int     | 10      | Items per page                   |
| `exclude_large_fields`| boolean | false   | Exclude description etc.         |
| `q`                   | string  | -       | Search query                     |

**Response:** `{ tasks: [], pagination: { total, page, per_page, pages } }`

### List Tasks by Project

```
GET /api/projects/{project_id}/tasks
```

| Query Param           | Type    | Default | Description                |
|------------------------|---------|---------|----------------------------|
| `include_archived`    | boolean | false   | Include archived tasks      |
| `exclude_large_fields`| boolean | false   | Exclude description etc.    |

**Headers:** `If-None-Match` for ETag caching.

### Get Task Counts (Batch)

```
GET /api/projects/task-counts
```

**Headers:** `If-None-Match` for ETag caching.
**Response:** Counts grouped by `project_id` with `todo`, `doing`, `done` counts.

### Get Task

```
GET /api/tasks/{task_id}
```

### Create Task

```
POST /api/tasks
```

```json
{
  "project_id": "uuid",
  "title": "Implement OAuth2",
  "description": "Add OAuth2 flow with JWT",
  "status": "todo",
  "assignee": "User",
  "task_order": 50,
  "priority": "high",
  "feature": "authentication"
}
```

`project_id` and `title` are required.

### Update Task

```
PUT /api/tasks/{task_id}
```

All fields optional.

### Delete (Archive) Task

```
DELETE /api/tasks/{task_id}
```

Soft delete (archiving).

### Update Task Status (MCP)

```
PUT /api/mcp/tasks/{task_id}/status?status=doing
```

Dedicated endpoint for MCP tool status updates.

---

## 6. Documents API

### List Project Documents

```
GET /api/projects/{project_id}/docs
```

| Query Param       | Type    | Default | Description             |
|--------------------|---------|---------|--------------------------|
| `include_content`  | boolean | false   | Include full content     |

**Response:** `{ documents: [], total_count }`

### Create Document

```
POST /api/projects/{project_id}/docs
```

```json
{
  "document_type": "spec",
  "title": "API Specification",
  "content": { "sections": [] },
  "tags": ["backend", "api"],
  "author": "Claude"
}
```

`document_type` and `title` are required.
Types: `spec`, `design`, `note`, `prp`, `api`, `guide`

### Get Document

```
GET /api/projects/{project_id}/docs/{doc_id}
```

### Update Document

```
PUT /api/projects/{project_id}/docs/{doc_id}
```

```json
{
  "title": "Updated Title",
  "content": { "sections": [] },
  "tags": ["updated"],
  "author": "Claude"
}
```

### Delete Document

```
DELETE /api/projects/{project_id}/docs/{doc_id}
```

---

## 7. Versions API

### List Versions

```
GET /api/projects/{project_id}/versions
```

| Query Param  | Type   | Description               |
|--------------|--------|---------------------------|
| `field_name` | string | Filter: docs/features/data/prd |

**Response:** `{ versions: [], total_count }`

### Create Version Snapshot

```
POST /api/projects/{project_id}/versions
```

```json
{
  "field_name": "docs",
  "content": { "data": "snapshot" },
  "change_summary": "Updated API section",
  "change_type": "update",
  "document_id": "doc-uuid",
  "created_by": "Claude"
}
```

`field_name` and `content` are required.

### Get Specific Version

```
GET /api/projects/{project_id}/versions/{field_name}/{version_number}
```

### Restore Version

```
POST /api/projects/{project_id}/versions/{field_name}/{version_number}/restore
```

```json
{ "restored_by": "User" }
```

---

## 8. Progress API

**Prefix:** `/api/progress`

### Get Operation Progress

```
GET /api/progress/{operation_id}
```

**Headers:** `If-None-Match` for ETag caching.
**Response Header:** `X-Poll-Interval` (recommended polling interval in ms).

Returns 304 Not Modified if unchanged.

### List Active Operations

```
GET /api/progress/
```

**Response:** `{ operations: [], count, timestamp }`

Automatically filters out terminal states (completed, failed, error, cancelled).

---

## 9. Pages API

### List Pages for Source

```
GET /api/pages
```

| Query Param | Type   | Required | Description                   |
|-------------|--------|----------|-------------------------------|
| `source_id` | string | Yes      | Source UUID                    |
| `section`   | string | No       | Filter by section title        |

**Response:** `{ pages: [{ id, url, section_title, section_order, word_count, char_count, chunk_count }], total, source_id }`

### Get Page by ID

```
GET /api/pages/{page_id}
```

Returns full page with `full_content`. Handles large pages (>20k chars).

### Get Page by URL

```
GET /api/pages/by-url?url=https://docs.example.com/page
```

---

## 10. MCP API

**Prefix:** `/api/mcp`

### MCP Status

```
GET /api/mcp/status
```

**Response:** `{ status: "running"|"stopped"|"not_found"|"error", uptime?, logs, container_status, message? }`

### MCP Config

```
GET /api/mcp/config
```

**Response:** `{ host, port, transport: "streamable-http", model_choice }`

### MCP Clients

```
GET /api/mcp/clients
```

**Response:** `{ clients: [], total }`

### MCP Sessions

```
GET /api/mcp/sessions
```

**Response:** `{ active_sessions, session_timeout, server_uptime_seconds? }`

### MCP Health

```
GET /api/mcp/health
```

---

## 11. Ollama API

**Prefix:** `/api/ollama`

### Discover Models

```
GET /api/ollama/models?instance_urls=http://localhost:11434&include_capabilities=true&fetch_details=false
```

### Discover and Store Models

```
POST /api/ollama/models/discover-and-store
```

```json
{
  "instance_urls": ["http://localhost:11434"],
  "force_refresh": false
}
```

### Get Stored Models

```
GET /api/ollama/models/stored
```

### Discover with Full Details

```
POST /api/ollama/models/discover-with-details
```

```json
{
  "instance_urls": ["http://localhost:11434"],
  "force_refresh": false
}
```

### Test Model Capabilities

```
POST /api/ollama/models/test-capabilities
```

```json
{
  "model_name": "llama3",
  "instance_url": "http://localhost:11434",
  "test_function_calling": true,
  "test_structured_output": true,
  "timeout_seconds": 30
}
```

### Instance Health

```
GET /api/ollama/instances/health?instance_urls=http://localhost:11434&include_models=false
```

### Validate Instance

```
POST /api/ollama/validate
```

```json
{
  "instance_url": "http://localhost:11434",
  "instance_type": "primary",
  "timeout_seconds": 10
}
```

### Embedding Route Analysis

```
POST /api/ollama/embedding/route
```

```json
{
  "model_name": "nomic-embed-text",
  "instance_url": "http://localhost:11434",
  "text_sample": "Sample text for testing"
}
```

### List Embedding Routes

```
GET /api/ollama/embedding/routes?instance_urls=http://localhost:11434&sort_by_performance=true
```

### Clear Cache

```
DELETE /api/ollama/cache
```

---

## 12. Agent Chat API

**Prefix:** `/api/agent-chat`

### Create Session

```
POST /api/agent-chat/sessions
```

```json
{
  "project_id": "uuid",
  "agent_type": "default"
}
```

**Response:** `{ session_id }`

### Get Session

```
GET /api/agent-chat/sessions/{session_id}
```

### Get Messages

```
GET /api/agent-chat/sessions/{session_id}/messages
```

### Send Message

```
POST /api/agent-chat/sessions/{session_id}/messages
```

```json
{ "message": "Help me design the auth flow" }
```

---

## 13. Providers API

**Prefix:** `/api/providers`

### Test Provider Status

```
GET /api/providers/{provider}/status
```

**Allowed providers:** `openai`, `ollama`, `google`, `openrouter`, `anthropic`, `grok`

**Response:** `{ ok: boolean, reason: string, provider }`

---

## 14. Version API

**Prefix:** `/api/version`

### Check for Updates

```
GET /api/version/check
```

**Headers:** `If-None-Match` for ETag (1 hour cache).
**Response:** `{ current, latest?, update_available, release_url?, release_notes?, published_at?, assets?, author? }`

### Get Current Version

```
GET /api/version/current
```

**Response:** `{ version, timestamp }`

### Clear Version Cache

```
POST /api/version/clear-cache
```

---

## 15. Bug Report API

**Prefix:** `/api/bug-report`

### Submit Bug Report

```
POST /api/bug-report/github
```

```json
{
  "title": "Login fails on mobile",
  "description": "Detailed description...",
  "stepsToReproduce": "1. Open app\n2. Click login",
  "expectedBehavior": "Should log in",
  "actualBehavior": "Shows error",
  "severity": "high",
  "component": "auth",
  "context": {}
}
```

`title` and `description` required. If `GITHUB_TOKEN` is configured, creates issue directly; otherwise returns pre-filled URL.

### Bug Report Health

```
GET /api/bug-report/health
```

---

## 16. Migrations API

**Prefix:** `/api/migrations`

### Migration Status

```
GET /api/migrations/status
```

**Headers:** `If-None-Match` for ETag.
**Response:** `{ pending_migrations, applied_migrations, has_pending, bootstrap_required, current_version, pending_count, applied_count }`

### Migration History

```
GET /api/migrations/history
```

**Headers:** `If-None-Match` for ETag.
**Response:** `{ migrations: [], total_count, current_version }`

### Pending Migrations

```
GET /api/migrations/pending
```

---

## 17. Internal API

**Prefix:** `/internal` (NOT `/api`)

Access restricted to localhost (`127.0.0.1`, `::1`) and Docker network (`172.16.0.0/12`).

### Internal Health

```
GET /internal/health
```

### Agent Credentials

```
GET /internal/credentials/agents
```

Returns: `OPENAI_API_KEY`, `OPENAI_MODEL`, `DOCUMENT_AGENT_MODEL`, `RAG_AGENT_MODEL`, `TASK_AGENT_MODEL`, `AGENT_RATE_LIMIT_ENABLED`, `AGENT_MAX_RETRIES`, `MCP_SERVICE_URL`, `LOG_LEVEL`

### MCP Credentials

```
GET /internal/credentials/mcp
```

---

## 18. Health Checks

### Root

```
GET /
```

**Response:** `{ name, version, description, status, modules }`

### Global Health

```
GET /health
GET /api/health
```

**Response:** `{ status: "healthy"|"initializing"|"migration_required", service, timestamp, ready, credentials_loaded?, schema_valid?, migration_required?, message? }`

### Service-Specific Health

| Endpoint                  | Service    |
|---------------------------|------------|
| `GET /api/settings/health`| Settings   |
| `GET /api/health`         | Knowledge  |
| `GET /api/projects/health`| Projects   |
| `GET /api/mcp/health`     | MCP        |
| `GET /api/bug-report/health`| Bug Report|
| `GET /internal/health`    | Internal   |

---

## 19. Common Patterns

### ETag Caching

Used on: Projects list, Task lists, Task counts, Progress, Version check, Migration status.

```
Request:  If-None-Match: "etag-value"
Response: ETag: "new-etag-value"
          Cache-Control: no-cache, must-revalidate
```

304 Not Modified returned when data unchanged.

### Pagination

```json
{
  "items": [],
  "pagination": {
    "total": 100,
    "page": 1,
    "per_page": 10,
    "pages": 10
  }
}
```

### Progress Tracking Pattern

Long-running operations (crawl, upload) return a `progressId`. Poll for status:

```
GET /api/progress/{progressId}
```

```json
{
  "progressId": "uuid",
  "status": "starting|processing|storing|code_extraction|completed|failed|cancelled",
  "progress": 45,
  "log": "Processing page 5 of 10...",
  "currentUrl": "https://docs.example.com/page5",
  "processedPages": 5,
  "totalPages": 10,
  "completedSummaries": 3,
  "totalSummaries": 10,
  "codeBlocksFound": 15
}
```

### Task Status Values

```
todo -> doing -> review -> done
```

### Error Responses

```json
{ "error": "Error message" }
{ "detail": "Validation error detail" }
```

### Common HTTP Status Codes

| Code | Meaning                          |
|------|----------------------------------|
| 200  | Success                          |
| 304  | Not Modified (ETag match)        |
| 400  | Bad Request / Validation Error   |
| 404  | Not Found                        |
| 409  | Conflict (duplicate, etc.)       |
| 500  | Internal Server Error            |
