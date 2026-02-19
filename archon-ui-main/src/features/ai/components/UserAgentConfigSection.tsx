/**
 * User Agent Config Section
 *
 * Settings UI for configuring the user's personal LLM API key
 * used by the "10x Agent" task assignee.
 */

import { CheckCircle2, Eye, EyeOff, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../ui/primitives/button";
import { Input } from "../../ui/primitives/input";

interface AgentConfig {
  configured: boolean;
  llm_provider?: string;
  api_key_masked?: string | null;
  model?: string;
  enabled?: boolean;
}

const PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "openrouter", label: "OpenRouter" },
];

export function UserAgentConfigSection() {
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("openai:gpt-4o-mini");
  const [enabled, setEnabled] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const userId = localStorage.getItem("10x-user-id");

  useEffect(() => {
    if (!userId) return;
    fetch("/api/user/agent-config", {
      headers: { "X-User-Id": userId },
    })
      .then((r) => r.json())
      .then((data: AgentConfig) => {
        setConfig(data);
        if (data.configured) {
          setProvider(data.llm_provider || "openai");
          setModel(data.model || "openai:gpt-4o-mini");
          setEnabled(data.enabled ?? true);
        }
      })
      .catch(console.error);
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/user/agent-config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userId,
        },
        body: JSON.stringify({
          llm_provider: provider,
          api_key: apiKey || undefined,
          model,
          enabled,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to save");
      }
      setSaved(true);
      setApiKey(""); // Clear after save
      // Refresh masked key
      const updated = await fetch("/api/user/agent-config", {
        headers: { "X-User-Id": userId },
      }).then((r) => r.json());
      setConfig(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save agent config");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Configure your personal LLM API key to use the{" "}
        <strong>10x Agent</strong> task assignee. Assign any task to "10x Agent"
        and it will run using your key.
      </p>

      {/* Provider */}
      <div>
        <label className="block text-sm font-medium mb-1">LLM Provider</label>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm dark:border-zinc-700 dark:bg-zinc-800"
        >
          {PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* API Key */}
      <div>
        <label className="block text-sm font-medium mb-1">
          API Key{" "}
          {config?.configured && config.api_key_masked && (
            <span className="text-gray-400 font-normal text-xs ml-1">
              (current: {config.api_key_masked})
            </span>
          )}
        </label>
        <div className="relative">
          <Input
            type={showKey ? "text" : "password"}
            placeholder={
              config?.configured
                ? "Enter new key to replace existing"
                : "sk-..."
            }
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Model */}
      <div>
        <label className="block text-sm font-medium mb-1">Model</label>
        <Input
          type="text"
          placeholder="openai:gpt-4o-mini"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        />
        <p className="text-xs text-gray-400 mt-1">
          Format: provider:model-name (e.g. openai:gpt-4o, anthropic:claude-haiku-4-5-20251001)
        </p>
      </div>

      {/* Enabled toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="agent-enabled"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="w-4 h-4 accent-[#C0745F]"
        />
        <label htmlFor="agent-enabled" className="text-sm">
          Enable 10x Agent
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <Button
        onClick={handleSave}
        disabled={saving}
        className="bg-[#C0745F] hover:bg-[#A85A45] flex items-center gap-2"
      >
        {saved ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            Saved
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Config"}
          </>
        )}
      </Button>
    </div>
  );
}
