/**
 * Email Verification Page
 *
 * Handles the /verify-email?token=... link from verification emails.
 */

import { CheckCircle, Loader, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "../features/ui/primitives/button";

type Status = "loading" | "success" | "error";

export function EmailVerifyPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found in the URL.");
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (res.ok) {
          // Mark as verified in localStorage so the banner disappears
          localStorage.setItem("10x-email-verified", "true");
          setStatus("success");
          setMessage("Your email has been verified successfully!");
        } else {
          const data = await res.json();
          setStatus("error");
          setMessage(data.detail || "Verification failed. The link may have expired.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Unable to reach the server. Please try again later.");
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full p-8 bg-white dark:bg-zinc-900 rounded-lg shadow-xl text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Email Verification
        </h1>

        {status === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <Loader className="w-12 h-12 text-[#C0745F] animate-spin" />
            <p className="text-gray-600 dark:text-gray-400">Verifying your email...</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
            <p className="text-gray-700 dark:text-gray-300">{message}</p>
            <Button asChild className="mt-2 bg-[#C0745F] hover:bg-[#A85A45]">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="w-12 h-12 text-red-500" />
            <p className="text-gray-700 dark:text-gray-300">{message}</p>
            <Button asChild variant="outline" className="mt-2">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
