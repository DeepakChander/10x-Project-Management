/**
 * Register Agent Modal
 */

import { Bot, Key, Link } from "lucide-react";
import { useState } from "react";
import { Button } from "../../ui/primitives/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/primitives/dialog";
import { Input } from "../../ui/primitives/input";

interface RegisterAgentModalProps {
  orgId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RegisterAgentModal({ orgId, isOpen, onClose }: RegisterAgentModalProps) {
  const [agentName, setAgentName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [step, setStep] = useState(1);

  const handleGenerate = async () => {
    // TODO: Call API to create agent user + generate key
    const mockKey = `10x_ag_${crypto.randomUUID().replace(/-/g, '')}`;
    setApiKey(mockKey);
    setStep(2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-600" />
            Register AI Agent
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-1 mb-2">
                <Bot className="w-3 h-3" />
                Agent Name
              </label>
              <Input
                placeholder="Claude Code"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-1 mb-2">
                <Link className="w-3 h-3" />
                Webhook URL
              </label>
              <Input
                placeholder="https://your-agent.com/webhooks/10x-pm"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Agent will receive task notifications here</p>
            </div>

            <Button onClick={handleGenerate} className="w-full">
              <Key className="w-4 h-4 mr-1" />
              Generate API Key
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
              <div className="font-medium text-green-800 dark:text-green-200 mb-2">
                ✅ Agent Registered Successfully!
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                Agent: {agentName}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">API Key (Save This!)</label>
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm break-all">
                {apiKey}
              </div>
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                ⚠️ Save this key now! You won't be able to see it again.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Webhook URL</label>
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded text-sm break-all">
                {webhookUrl}
              </div>
            </div>

            <Button onClick={onClose} className="w-full">Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
