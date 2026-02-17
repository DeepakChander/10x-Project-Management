/**
 * Team Management View
 *
 * Dashboard for managing team members and invitations
 */

import { Mail, Plus, Shield, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "../../ui/primitives/button";
import { cn } from "../../ui/primitives/styles";
import { InviteUserModal } from "../components/InviteUserModal";

interface TeamManagementViewProps {
  orgId: string;
  projectId?: string;
  className?: string;
}

export function TeamManagementView({ orgId, projectId, className }: TeamManagementViewProps) {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-[#C0745F] dark:text-[#D4917A]" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Team Management</h2>
        </div>

        {/* Invite Button */}
        <Button
          onClick={() => setIsInviteModalOpen(true)}
          className="bg-[#C0745F] hover:bg-[#A85A45]"
        >
          <Plus className="w-4 h-4 mr-1" />
          Invite Team Member
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-800/50">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Total Members</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">0</div>
        </div>

        <div className="p-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-800/50">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-orange-600" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Pending Invites</span>
          </div>
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">0</div>
        </div>

        <div className="p-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-800/50">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Admins</span>
          </div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">0</div>
        </div>

        <div className="p-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-800/50">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-green-600" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Active</span>
          </div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">1</div>
        </div>
      </div>

      {/* Coming Soon Message */}
      <div className="p-12 text-center bg-white/30 dark:bg-zinc-900/30 backdrop-blur-sm rounded-lg border border-gray-200/30 dark:border-gray-800/30">
        <Users className="w-16 h-16 text-[#C0745F] dark:text-[#D4917A] mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Team Management UI
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          User list, role assignments, and team dashboard coming soon!
        </p>
        <p className="text-sm text-gray-500">
          Backend is ready - click "Invite Team Member" to test the invitation system!
        </p>
      </div>

      {/* Invite Modal */}
      <InviteUserModal
        orgId={orgId}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInviteSent={() => {
          console.log("Invitation sent!");
        }}
      />
    </div>
  );
}
