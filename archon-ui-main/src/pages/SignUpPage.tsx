/**
 * Sign Up Page - First User Flow
 */

import { Building, Lock, Mail, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../features/ui/primitives/button";
import { Input } from "../features/ui/primitives/input";

export function SignUpPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1: User Info
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");

  // Step 2: Organization Info
  const [orgName, setOrgName] = useState("");
  const [domain, setDomain] = useState("");

  const handleUserInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleOrgSetup = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Call signup API
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          display_name: displayName,
          password,
          org_name: orgName,
          company_domain: domain,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Signup failed");
      }

      const data = await response.json();

      // Save user session
      localStorage.setItem("10x-user-id", data.user.id);
      localStorage.setItem("10x-user-name", data.user.display_name);
      localStorage.setItem("10x-user-email", data.user.email);
      localStorage.setItem("10x-user-role", "owner");
      if (data.organization) {
        localStorage.setItem("10x-org-id", data.organization.id);
        localStorage.setItem("10x-org-name", data.organization.name);
      }

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Signup failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full p-8 bg-white dark:bg-zinc-900 rounded-lg shadow-xl">
        {step === 1 ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to 10x PM
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Create your account to get started
              </p>
            </div>

            <form onSubmit={handleUserInfoSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Full Name
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
                  <Mail className="w-3 h-3" />
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="john@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Password
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

              <Button type="submit" className="w-full bg-[#C0745F] hover:bg-[#A85A45]">
                Continue
              </Button>
            </form>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <Building className="w-12 h-12 text-[#C0745F] mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Create Your Organization
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                You'll be the owner with full access
              </p>
            </div>

            <form onSubmit={handleOrgSetup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Organization Name</label>
                <Input
                  type="text"
                  placeholder="Acme Corp"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Company Domain</label>
                <Input
                  type="text"
                  placeholder="acme.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-1/3">
                  Back
                </Button>
                <Button type="submit" className="w-2/3 bg-[#C0745F] hover:bg-[#A85A45]">
                  Create Organization
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
