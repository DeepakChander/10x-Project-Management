/**
 * Organization Tree Component
 * Visual hierarchy of organization structure
 */

import { Building, ChevronRight, ChevronDown, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "../../features/ui/primitives/styles";

interface OrgStructure {
  org: { id: string; name: string };
  departments: Array<{
    id: string;
    name: string;
    member_count: number;
    teams: Array<{
      id: string;
      name: string;
      member_count: number;
    }>;
  }>;
}

export function OrganizationTree({ orgId }: { orgId: string }) {
  const [structure, setStructure] = useState<OrgStructure | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchOrgStructure() {
      try {
        const userId = localStorage.getItem("10x-user-id");

        // Fetch org, departments, and teams
        const [orgRes, deptsRes, teamsRes, membersRes] = await Promise.all([
          fetch(`/api/organizations/${orgId}`, { headers: { "X-User-Id": userId || "" } }),
          fetch(`/api/organizations/${orgId}/departments`, { headers: { "X-User-Id": userId || "" } }),
          fetch(`/api/teams?org_id=${orgId}`, { headers: { "X-User-Id": userId || "" } }).catch(() => ({ ok: false })),
          fetch(`/api/admin/team/members`, { headers: { "X-User-Id": userId || "" } }),
        ]);

        if (!orgRes.ok) return;

        const org = await orgRes.json();
        const depts = deptsRes.ok ? await deptsRes.json() : [];
        const members = membersRes.ok ? await membersRes.json() : [];

        // Build structure
        const structure: OrgStructure = {
          org: { id: org.id, name: org.name },
          departments: depts.map((dept: any) => ({
            id: dept.id,
            name: dept.name,
            member_count: members.filter((m: any) => m.team_id && dept.teams?.includes(m.team_id)).length || 0,
            teams: [], // TODO: Fetch teams per dept
          })),
        };

        setStructure(structure);
        // Auto-expand first department
        if (depts.length > 0) {
          setExpanded(new Set([depts[0].id]));
        }
      } catch (error) {
        console.error("Failed to fetch org structure:", error);
      }
    }

    if (orgId) {
      fetchOrgStructure();
    }
  }, [orgId]);

  if (!structure) {
    return <div className="text-gray-500">Loading organization structure...</div>;
  }

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  const totalMembers = structure.departments.reduce((sum, d) => sum + d.member_count, 0);

  return (
    <div className="p-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-gray-200/50">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Building className="w-5 h-5 text-[#C0745F]" />
        Organization Structure
      </h3>

      {/* Root - Organization */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-3 bg-[#C0745F]/10 rounded-lg">
          <Building className="w-5 h-5 text-[#C0745F]" />
          <span className="font-semibold text-gray-900 dark:text-white">
            {structure.org.name}
          </span>
          <span className="text-sm text-gray-500">
            ({totalMembers} members)
          </span>
        </div>

        {/* Departments */}
        <div className="ml-8 space-y-2">
          {structure.departments.length === 0 ? (
            <div className="text-sm text-gray-500 italic">No departments yet</div>
          ) : (
            structure.departments.map((dept) => (
              <div key={dept.id}>
                <button
                  onClick={() => toggleExpand(dept.id)}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded w-full text-left"
                >
                  {dept.member_count > 0 ? (
                    expanded.has(dept.id) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )
                  ) : (
                    <div className="w-4" />
                  )}
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">{dept.name}</span>
                  <span className="text-sm text-gray-500">({dept.member_count})</span>
                </button>

                {/* Teams (if expanded) */}
                {expanded.has(dept.id) && dept.teams.length > 0 && (
                  <div className="ml-8 mt-1 space-y-1">
                    {dept.teams.map((team) => (
                      <div
                        key={team.id}
                        className="flex items-center gap-2 p-2 text-sm"
                      >
                        <Users className="w-3 h-3 text-green-600" />
                        <span>{team.name}</span>
                        <span className="text-xs text-gray-500">({team.member_count})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
