/**
 * Auth Context
 *
 * Manages user authentication state and organization data
 */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface AuthUser {
  id: string;
  email: string;
  display_name: string;
  org_id: string | null;
  org_name: string;
  role: string | null;
  email_verified: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (userData: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage and fetch membership data
  useEffect(() => {
    async function loadUser() {
      const userId = localStorage.getItem("10x-user-id");
      const userName = localStorage.getItem("10x-user-name");
      const userEmail = localStorage.getItem("10x-user-email");
      const orgId = localStorage.getItem("10x-org-id");
      const orgName = localStorage.getItem("10x-org-name");
      const emailVerified = localStorage.getItem("10x-email-verified") === "true";

      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch org membership to get actual role
        const response = await fetch(`/api/memberships?user_id=${userId}`, {
          headers: { "X-User-Id": userId },
        });

        if (response.ok) {
          const membership = await response.json();
          setUser({
            id: userId,
            email: userEmail || "",
            display_name: userName || "",
            org_id: membership.org_id || orgId || null,
            org_name: orgName || "",
            role: membership.org_role || null,
            email_verified: emailVerified,
          });
          if (membership.org_id) {
            localStorage.setItem("10x-org-id", membership.org_id);
          }
        } else {
          // Fallback: use cached values without role
          setUser({
            id: userId,
            email: userEmail || "",
            display_name: userName || "",
            org_id: orgId || null,
            org_name: orgName || "",
            role: null,
            email_verified: emailVerified,
          });
        }
      } catch (error) {
        console.error("Failed to load user membership:", error);
        setUser({
          id: userId,
          email: userEmail || "",
          display_name: userName || "",
          org_id: orgId || null,
          org_name: orgName || "",
          role: null,
          email_verified: emailVerified,
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = (userData: AuthUser) => {
    setUser(userData);
    localStorage.setItem("10x-user-id", userData.id);
    localStorage.setItem("10x-user-name", userData.display_name);
    localStorage.setItem("10x-user-email", userData.email);
    localStorage.setItem("10x-email-verified", String(userData.email_verified));
    if (userData.org_id) localStorage.setItem("10x-org-id", userData.org_id);
    if (userData.org_name) localStorage.setItem("10x-org-name", userData.org_name);
  };

  const logout = () => {
    const sessionToken = localStorage.getItem("10x-session-token");
    if (sessionToken) {
      // Fire and forget — clear local state regardless of server response
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_token: sessionToken }),
      }).catch((e) => console.warn("Logout API call failed:", e));
    }
    setUser(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
