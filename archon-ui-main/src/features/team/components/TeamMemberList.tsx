/**
 * Team Member List Component
 *
 * Shows all team members with role badges and actions
 */

import { Crown, Shield, Star, User, Users2, Eye, Bot } from "lucide-react";
import { Button } from "../../ui/primitives/button";
import { cn } from "../../ui/primitives/styles";

interface TeamMember {
  id: string;
  display_name: string;
  email: string;
  user_type: "human" | "agent";
  org_role: string;
  status: string;
}

interface TeamMemberListProps {
  members: TeamMember[];
  className?: string;
}

// Role icon and color mapping
const roleConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  owner: {
    icon: Crown,
    color: "text-yellow-700 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    label: "Owner",
  },
  admin: {
    icon: Shield,
    color: "text-purple-700 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    label: "Admin",
  },
  manager: {
    icon: Star,
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    label: "Manager",
  },
  lead: {
    icon: Users2,
    color: "text-[#C0745F] dark:text-[#D4917A]",
    bg: "bg-[#C0745F]/10 dark:bg-[#C0745F]/20",
    label: "Lead",
  },
  member: {
    icon: User,
    color: "text-green-700 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    label: "Member",
  },
  viewer: {
    icon: Eye,
    color: "text-gray-700 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-800",
    label: "Viewer",
  },
  agent: {
    icon: Bot,
    color: "text-pink-700 dark:text-pink-400",
    bg: "bg-pink-100 dark:bg-pink-900/30",
    label: "AI Agent",
  },
};

export function TeamMemberList({ members, className }: TeamMemberListProps) {
  if (members.length === 0) {
    return (
      <div className={cn("p-8 text-center bg-white/30 dark:bg-zinc-900/30 rounded-lg border border-gray-200/30 dark:border-gray-800/30", className)}>
        <Users2 className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400">No team members yet</p>
        <p className="text-sm text-gray-500 mt-1">Invite your first team member to get started</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {members.map((member) => {
        const config = roleConfig[member.org_role] || roleConfig.member;
        const RoleIcon = config.icon;

        return (
          <div
            key={member.id}
            className="p-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-800/50 hover:border-[#C0745F]/30 transition-colors"
          >
            <div className="flex items-center justify-between">
              {/* Member Info */}
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C0745F] to-[#D4917A] flex items-center justify-center text-white font-bold">
                  {member.display_name.charAt(0).toUpperCase()}
                </div>

                {/* Details */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {member.display_name}
                    </span>
                    {member.user_type === "agent" && (
                      <span className="text-xs px-2 py-0.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full">
                        AI
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">{member.email}</div>
                </div>
              </div>

              {/* Role Badge & Actions */}
              <div className="flex items-center gap-3">
                {/* Role Badge */}
                <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full", config.bg)}>
                  <RoleIcon className={cn("w-4 h-4", config.color)} />
                  <span className={cn("text-sm font-medium", config.color)}>
                    {config.label}
                  </span>
                </div>

                {/* Actions */}
                <Button variant="outline" size="sm" className="h-8">
                  Manage
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
