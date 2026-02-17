/**
 * Team Management View - Production Version
 */

import { Mail, Plus, Shield, Users, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../ui/primitives/button";
import { cn } from "../../ui/primitives/styles";
import { InviteUserModal } from "../components/InviteUserModal";
import { TeamMemberList } from "../components/TeamMemberList";

interface TeamManagementViewProps {
  orgId: string;
  className?: string;
}

interface TeamMember {
  user_id: string;
  org_role: string;
  status: string;
  archon_users_profile: {
    id: string;
    display_name: string;
    email: string;
    user_type: string;
  };
}

export function TeamManagementView({ orgId, className }: TeamManagementViewProps) {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch team data
  useEffect(() => {
    let mounted = true;

    async function fetchTeamData() {
      try {
        const userId = localStorage.getItem("10x-user-id");
        const headers = { "X-User-Id": userId || "" };

        const [membersRes, invitesRes] = await Promise.all([
          fetch("/api/admin/team/members", { headers }),
          fetch(`/api/invitations/${orgId}`, { headers }).catch(() => ({ ok: false })),
        ]);

        if (!mounted) return;

        if (membersRes.ok) {
          const data = await membersRes.json();
          setMembers(data);
        }

        if (invitesRes.ok) {
          const data = await invitesRes.json();
          setInvitations(data.filter((inv: any) => inv.status === "pending"));
        }
      } catch (error) {
        console.error("Failed to fetch team data:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchTeamData();
    const interval = setInterval(fetchTeamData, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [orgId]);

  const roleCount = members.reduce((acc, m) => {
    acc[m.org_role] = (acc[m.org_role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#C0745F] animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-[#C0745F]" />
          <h2 className="text-2xl font-bold">Team Management</h2>
        </div>
        <Button onClick={() => setIsInviteModalOpen(true)} className="bg-[#C0745F]">
          <Plus className="w-4 h-4 mr-1" />
          Invite Team Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatBox icon={Users} label="Total Members" value={members.length} color="blue" />
        <StatBox icon={Mail} label="Pending Invites" value={invitations.length} color="orange" />
        <StatBox icon={Shield} label="Admins" value={roleCount.admin || roleCount.owner || 0} color="purple" />
        <StatBox icon={Users} label="Active" value={members.filter(m => m.status === "active").length} color="green" />
      </div>

      {/* Team List */}
      <TeamMemberList members={members.map(m => ({
        id: m.archon_users_profile.id,
        display_name: m.archon_users_profile.display_name,
        email: m.archon_users_profile.email,
        user_type: m.archon_users_profile.user_type as "human" | "agent",
        org_role: m.org_role,
        status: m.status,
      }))} />

      <InviteUserModal
        orgId={orgId}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInviteSent={() => {
          setIsInviteModalOpen(false);
          setTimeout(() => window.location.reload(), 1000);
        }}
      />
    </div>
  );
}

function StatBox({ icon: Icon, label, value, color }: any) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
  };

  return (
    <div className={cn("p-4 rounded-lg", colors[color])}>
      <Icon className="w-5 h-5 mb-2" />
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm">{label}</div>
    </div>
  );
}

