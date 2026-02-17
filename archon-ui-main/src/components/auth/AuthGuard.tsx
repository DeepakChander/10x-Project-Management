/**
 * Auth Guard Component
 *
 * Redirects to signup if no user exists
 */

import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is authenticated
    const userId = localStorage.getItem("10x-user-id");

    // Public routes that don't need auth
    const publicRoutes = ["/signup", "/invite"];

    const isPublicRoute = publicRoutes.some((route) =>
      location.pathname.startsWith(route)
    );

    // If no user and not on public route, redirect to signup
    if (!userId && !isPublicRoute) {
      navigate("/signup");
    }
  }, [navigate, location.pathname]);

  return <>{children}</>;
}
