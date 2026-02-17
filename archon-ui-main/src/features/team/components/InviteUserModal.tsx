/**
 * Invite User Modal Component
 *
 * Modal for inviting new team members
 */

import { Mail, UserPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "../../ui/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/primitives/dialog";
import { Input } from "../../ui/primitives/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/primitives/select";
import { useToast } from "../../shared/hooks/useToast";
import { teamService } from "../services/teamService";

interface InviteUserModalProps {
  orgId: string;
  isOpen: boolean;
  onClose: () => void;
  onInviteSent?: () => void;
}

const ROLES = [
  { value: "member", label: "Member", description: "Regular team member" },
  { value: "lead", label: "Lead", description: "Team lead" },
  { value: "manager", label: "Manager", description: "Department manager" },
  { value: "admin", label: "Admin", description: "Organization admin" },
  { value: "viewer", label: "Viewer", description: "Read-only access" },
];

export function InviteUserModal({ orgId, isOpen, onClose, onInviteSent }: InviteUserModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) return;

    setIsSubmitting(true);

    try {
      await teamService.createInvitation(orgId, {
        email: email.trim(),
        role,
        personal_message: message.trim() || undefined,
      });

      showToast(`Invitation sent to ${email}`, "success");

      // Reset form
      setEmail("");
      setRole("member");
      setMessage("");

      onInviteSent?.();
      onClose();
    } catch (error) {
      showToast(
        `Failed to send invitation: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#C0745F]" />
              Invite Team Member
            </DialogTitle>
            <DialogDescription>
              Send an invitation to join your organization. They'll receive an email with a signup link.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium flex items-center gap-1">
                <Mail className="w-3 h-3" />
                Email Address *
              </label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">
                Role *
              </label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{r.label}</span>
                        <span className="text-xs text-gray-500">{r.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Personal Message */}
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">
                Personal Message (Optional)
              </label>
              <textarea
                id="message"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#C0745F]"
                rows={3}
                placeholder="Welcome to the team! Looking forward to working with you."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            {/* Info Box */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <div className="font-medium mb-1">ℹ️ Invitation Details</div>
                <ul className="text-xs space-y-1 text-blue-700 dark:text-blue-300">
                  <li>• Invite link valid for 7 days</li>
                  <li>• Email will be sent with signup link</li>
                  <li>• User will have {role} permissions</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!email.trim() || isSubmitting}
              className="bg-[#C0745F] hover:bg-[#A85A45]"
            >
              {isSubmitting ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
