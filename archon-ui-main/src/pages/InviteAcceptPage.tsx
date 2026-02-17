/**
 * Invite Accept Page
 */

import { CheckCircle, Lock, Mail, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../features/ui/primitives/button";
import { Input } from "../features/ui/primitives/input";

export function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [invitationData, setInvitationData] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch invitation details
  useEffect(() => {
    async function fetchInvitation() {
      try {
        const response = await fetch(`/api/invitations/token/${token}`);
        if (!response.ok) {
          throw new Error("Invitation not found or expired");
        }
        const data = await response.json();
        setInvitationData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid invitation");
      } finally {
        setIsLoading(false);
      }
    }

    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/invitations/accept/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to accept invitation");
      }

      const data = await response.json();

      // Save user session
      localStorage.setItem("10x-user-id", data.user.id);
      localStorage.setItem("10x-user-name", data.user.display_name);
      localStorage.setItem("10x-user-email", data.user.email);

      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-md w-full p-8 bg-white dark:bg-zinc-900 rounded-lg shadow-xl text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to 10x PM!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your account has been created. Redirecting...
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading invitation...</div>
      </div>
    );
  }

  if (error && !invitationData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-md w-full p-8 bg-white dark:bg-zinc-900 rounded-lg shadow-xl text-center">
          <div className="text-red-600 mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {error}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This invitation link may be invalid or expired.
          </p>
          <Button onClick={() => navigate("/login")} className="bg-[#C0745F]">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full p-8 bg-white dark:bg-zinc-900 rounded-lg shadow-xl">
        {success ? (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to 10x PM!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your account has been created. Redirecting to dashboard...
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <Mail className="w-12 h-12 text-[#C0745F] mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Accept Your Invitation
              </h1>
              {invitationData && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    You've been invited to join as <strong>{invitationData.role}</strong>
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Email: {invitationData.email}
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg text-sm text-red-800 dark:text-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleAccept} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Your Name
                </label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Create Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#C0745F] hover:bg-[#A85A45]"
                disabled={isSubmitting || !displayName.trim() || !password}
              >
                {isSubmitting ? "Creating Account..." : "Accept & Create Account"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
