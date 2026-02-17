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
  org_id: string;
  org_name: string;
  role: string;
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

  // Load user from localStorage and fetch org data
  useEffect(() => {
    async function loadUser() {
      const userId = localStorage.getItem("10x-user-id");
      const userName = localStorage.getItem("10x-user-name");
      const userEmail = localStorage.getItem("10x-user-email");

      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch user's organization
        const response = await fetch(`/api/organizations?user_id=${userId}`, {
          headers: { "X-User-Id": userId },
        });

        if (response.ok) {
          const orgs = await response.json();
          const userOrg = orgs[0]; // First org user belongs to

          if (userOrg) {
            const authUser: AuthUser = {
              id: userId,
              email: userEmail || "",
              display_name: userName || "",
              org_id: userOrg.id,
              org_name: userOrg.name,
              role: "owner", // TODO: Fetch from membership
            };

            setUser(authUser);
            // Save org to localStorage for quick access
            localStorage.setItem("10x-org-id", userOrg.id);
            localStorage.setItem("10x-org-name", userOrg.name);
          }
        }
      } catch (error) {
        console.error("Failed to load user org:", error);
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
    localStorage.setItem("10x-org-id", userData.org_id);
    localStorage.setItem("10x-org-name", userData.org_name);
  };

  const logout = () => {
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
