# Phase 6: Real AI Setup Guide 🧠

Complete guide to activate real AI with Claude, OpenAI, and Ollama.

---

## Prerequisites

You need to install the `anthropic` Python package.

**Add to `python/pyproject.toml`** in the dependencies section:

```toml
[project]
dependencies = [
    # ... existing packages ...
    "anthropic>=0.18.0",
]
```

Or if using Docker, add to `python/requirements.txt`:
```
anthropic>=0.18.0
```

Then rebuild:
```bash
docker compose build server
docker compose restart server
```

---

## Configuration

### Option 1: Ollama (Local, Free) ✅ Ready Now!

**No setup needed!** Ollama is already configured in your project.

**Set environment variable:**
```bash
# In .env file or docker-compose.yml
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
```

**Make sure Ollama is running:**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Pull a model if needed
ollama pull llama3.1:8b
```

**✅ Works immediately with no API costs!**

---

### Option 2: Anthropic Claude (Best Quality)

**1. Get API Key:**
- Go to https://console.anthropic.com
- Create account
- Go to API Keys
- Create new key

**2. Add to environment:**
```bash
# In .env file
AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-api03-...your-key...
```

**3. Restart services:**
```bash
docker compose restart server
```

**Cost:** ~$3 per million tokens (very affordable!)

---

### Option 3: OpenAI GPT-4

**1. Get API Key:**
- Go to https://platform.openai.com
- Create account
- Go to API Keys
- Create new key

**2. Add to environment:**
```bash
# In .env file
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-...your-key...
```

**3. Restart services:**
```bash
docker compose restart server
```

**Cost:** ~$10 per million tokens

---

## Testing Each Provider

### Test 1: Check Available Providers

```bash
curl http://localhost:8181/api/ai/providers
```

**Expected:**
```json
[
  {
    "name": "claude",
    "display_name": "Anthropic Claude",
    "available": true,  ← true if API key set
    "default_model": "claude-3-5-sonnet-20241022",
    "status": "Ready"
  },
  {
    "name": "openai",
    "display_name": "OpenAI GPT-4",
    "available": false,  ← false until key added
    "default_model": "gpt-4o",
    "status": "API key required"
  },
  {
    "name": "ollama",
    "display_name": "Ollama (Local)",
    "available": true,  ← always true
    "default_model": "llama3.1:8b",
    "status": "Ready (local)"
  }
]
```

---

### Test 2: Task Estimation with Each Provider

**With Ollama (default):**
```bash
curl -X POST "http://localhost:8181/api/ai/tasks/TASK_ID/estimate?project_id=PROJECT_ID" \
  -H "X-User-Id: 00000000-0000-0000-0000-000000000001"
```

**With Claude:**
```bash
# Set AI_PROVIDER=claude in .env first
# Then same curl command as above
```

**Check logs to see which provider was used:**
```bash
docker compose logs server | grep "AI estimation complete"
```

Should show: `provider=ollama` or `provider=claude` or `provider=openai`

---

## Switch Providers

### Method 1: Environment Variable (Global)

Edit `.env`:
```bash
# Use Ollama (free, local)
AI_PROVIDER=ollama

# Or use Claude (best quality)
AI_PROVIDER=claude

# Or use OpenAI
AI_PROVIDER=openai
```

Then restart:
```bash
docker compose restart server
```

### Method 2: Per-Request (Future Feature)

We can add this later - allow UI to choose provider per request.

---

## Provider Comparison

| Feature | Ollama | Claude | OpenAI |
|---------|--------|--------|---------|
| **Cost** | Free | $3/M tokens | $10/M tokens |
| **Speed** | Fast (local) | Fast | Medium |
| **Quality** | Good | Excellent | Very Good |
| **Privacy** | 100% local | API call | API call |
| **Setup** | Easy | API key needed | API key needed |
| **Best For** | Development | Production | Alternative |

---

## Recommended Setup

### For Development:
```bash
AI_PROVIDER=ollama
```
- Free, fast, private
- Good enough for testing
- No API costs

### For Production:
```bash
AI_PROVIDER=claude
```
- Best reasoning quality
- Most accurate estimations
- Affordable pricing
- Reliable API

---

## Verify Setup

**Run this test script:**

```bash
# 1. Check providers
curl http://localhost:8181/api/ai/providers

# 2. Get a task ID
curl -s "http://localhost:8181/api/projects" \
  -H "X-User-Id: 00000000-0000-0000-0000-000000000001" \
  | python -c "import sys, json; tasks = json.load(sys.stdin)[0].get('docs', [{}]); print(tasks[0].get('id', 'NO_TASK'))"

# 3. Test estimation
curl -X POST "http://localhost:8181/api/ai/tasks/TASK_ID/estimate?project_id=PROJECT_ID" \
  -H "X-User-Id: 00000000-0000-0000-0000-000000000001"

# 4. Check logs
docker compose logs server --tail=10 | grep "AI estimation"
```

---

## Next Steps

1. **Add `anthropic` package** to dependencies
2. **Choose your provider** (start with Ollama - it's free!)
3. **Set environment variable** (`AI_PROVIDER=ollama`)
4. **Restart services**
5. **Test AI features**

**Ready to set this up?** Let me know which provider you want to start with! 🚀
