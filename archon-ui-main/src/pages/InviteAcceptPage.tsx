/**
 * Invite Accept Page
 *
 * Page for accepting team invitations
 */

import { CheckCircle, Mail } from "lucide-react";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../features/ui/primitives/button";
import { Input } from "../features/ui/primitives/input";

export function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/invitations/accept/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName }),
      });

      if (!response.ok) {
        throw new Error("Failed to accept invitation");
      }

      setSuccess(true);
      setTimeout(() => navigate("/"), 3000);
    } catch (error) {
      alert("Failed to accept invitation");
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full p-8 bg-white dark:bg-zinc-900 rounded-lg shadow-xl">
        <div className="text-center mb-8">
          <Mail className="w-12 h-12 text-[#C0745F] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Accept Your Invitation
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You've been invited to join 10x PM
          </p>
        </div>

        <form onSubmit={handleAccept} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Your Name
            </label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#C0745F] hover:bg-[#A85A45]"
            disabled={isSubmitting || !displayName.trim()}
          >
            {isSubmitting ? "Creating Account..." : "Accept Invitation"}
          </Button>
        </form>
      </div>
    </div>
  );
}
