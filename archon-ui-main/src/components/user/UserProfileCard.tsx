/**
 * User Profile Card
 * Shows user's role, team, department, and organization
 */

import { Building, ChevronDown, LogOut, Shield, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../features/ui/primitives/button";
import { cn } from "../../features/ui/primitives/styles";

export function UserProfileCard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const roleColors: Record<string, string> = {
    owner: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
    admin: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300",
    manager: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
    lead: "bg-[#C0745F]/20 text-[#C0745F] dark:text-[#D4917A]",
    member: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
  };

  return (
    <div className="relative">
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
          "hover:bg-gray-100 dark:hover:bg-gray-800",
          isOpen && "bg-gray-100 dark:bg-gray-800"
        )}
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C0745F] to-[#D4917A] flex items-center justify-center text-white font-bold">
          {user.display_name?.charAt(0) || "U"}
        </div>

        {/* User Info */}
        <div className="text-left">
          <div className="font-medium text-gray-900 dark:text-white">
            {user.display_name}
          </div>
          <div className="text-xs text-gray-500">
            {user.org_name}
          </div>
        </div>

        <ChevronDown className={cn(
          "w-4 h-4 text-gray-400 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 z-50">
            {/* Profile Section */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C0745F] to-[#D4917A] flex items-center justify-center text-white text-lg font-bold">
                  {user.display_name?.charAt(0) || "U"}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {user.display_name}
                  </div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </div>

              {/* Role Badge */}
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-400" />
                <span className={cn("px-3 py-1 rounded-full text-sm font-medium", roleColors[user.role] || roleColors.member)}>
                  {user.role}
                </span>
              </div>
            </div>

            {/* Organization Context */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Building className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">Organization:</span>
                <span className="font-medium text-gray-900 dark:text-white">{user.org_name}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">Department:</span>
                <span className="font-medium text-gray-900 dark:text-white">General</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">Team:</span>
                <span className="font-medium text-gray-900 dark:text-white">General</span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
