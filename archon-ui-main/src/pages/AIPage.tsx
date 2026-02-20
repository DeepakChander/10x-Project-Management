/**
 * AI Intelligence Page
 *
 * Shows the state of the AI self-learning system:
 * - Learning status (pending observations, knowledge store sizes)
 * - Team intelligence profiles (skills, approval rates)
 * - Quality patterns (high rejection rates, prevention tips)
 * - Model accuracy trend
 */

import {
  AlertTriangle,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Database,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { AIProjectSetupModal } from "../features/ai/components/AIProjectSetupModal";
import {
  useLearningStatus,
  useModelAccuracy,
  useQualityPatterns,
  useTeamProfiles,
  useTriggerLearning,
} from "../features/ai/hooks/useAIQueries";
import { useCreateProject, useProjects } from "../features/projects/hooks/useProjectQueries";
import { Button } from "../features/ui/primitives/button";
import { cn } from "../features/ui/primitives/styles";

// ── Helpers ─────────────────────────────────────────────────────

function confidenceBar(confidence: number) {
  const pct = Math.round(confidence * 100);
  const color =
    pct >= 80
      ? "bg-emerald-500"
      : pct >= 60
        ? "bg-blue-500"
        : pct >= 30
          ? "bg-yellow-500"
          : "bg-gray-400";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
      <Icon className="w-4 h-4 text-[#C0745F] shrink-0" />
      <div className="min-w-0">
        <div className="text-lg font-semibold text-white leading-none">{value.toLocaleString()}</div>
        <div className="text-xs text-gray-400 mt-0.5 truncate">{label}</div>
      </div>
    </div>
  );
}

// ── New-user hero — shown when the user has no projects yet ──────

function NewProjectAIHero() {
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const createProject = useCreateProject();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [setupModal, setSetupModal] = useState<{ open: boolean; projectId: string; projectTitle: string; projectDescription: string } | null>(null);

  // Only show this hero when the user has zero projects
  if (projectsLoading || (projects && projects.length > 0)) return null;

  const handleCreate = () => {
    if (!title.trim()) return;
    createProject.mutate(
      { title: title.trim(), description: description.trim() },
      {
        onSuccess: (project) => {
          setSetupModal({
            open: true,
            projectId: project.id,
            projectTitle: project.title,
            projectDescription: project.description ?? "",
          });
        },
      }
    );
  };

  return (
    <>
      <div className="rounded-xl border border-[#C0745F]/40 bg-gradient-to-br from-[#C0745F]/10 to-transparent p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#C0745F]/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-[#C0745F]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Create your first project with AI</h2>
            <p className="text-sm text-gray-400">Describe what you want to build — AI will generate a full task breakdown instantly.</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">Project name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Customer Portal Redesign"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#C0745F]/60 focus:ring-1 focus:ring-[#C0745F]/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">What are you building? <span className="text-gray-500">(the more detail, the better the AI suggestions)</span></label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. A self-service portal for enterprise customers to manage subscriptions, view invoices, and submit support tickets. Needs SSO, role-based access, and a dashboard with usage analytics."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#C0745F]/60 focus:ring-1 focus:ring-[#C0745F]/30 resize-none"
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || createProject.isPending}
            className="w-full bg-[#C0745F] hover:bg-[#A85A45] text-white"
          >
            {createProject.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating project…
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create project & get AI suggestions
              </>
            )}
          </Button>
        </div>
      </div>

      {setupModal && (
        <AIProjectSetupModal
          open={setupModal.open}
          onOpenChange={(open) => setSetupModal(open ? setupModal : null)}
          projectId={setupModal.projectId}
          projectTitle={setupModal.projectTitle}
          projectDescription={setupModal.projectDescription}
        />
      )}
    </>
  );
}

// ── Sections ─────────────────────────────────────────────────────

function LearningStatusSection() {
  const { data, isLoading } = useLearningStatus();
  const triggerLearning = useTriggerLearning();

  const stores = data?.knowledge_stores ?? {};
  const pending = data?.pending_observations ?? 0;

  const storeEntries: Array<{ key: string; label: string }> = [
    { key: "project_templates", label: "Project Templates" },
    { key: "task_blueprints", label: "Task Blueprints" },
    { key: "duration_estimates", label: "Duration Estimates" },
    { key: "team_profiles", label: "Team Profiles" },
    { key: "quality_patterns", label: "Quality Patterns" },
    { key: "total_observations", label: "Total Observations" },
    { key: "feedback_records", label: "Feedback Records" },
  ];

  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-[#C0745F]" />
          <h2 className="text-base font-semibold text-white">Learning Status</h2>
        </div>
        <div className="flex items-center gap-2">
          {pending > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
              {pending} pending
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => triggerLearning.mutate(50)}
            disabled={triggerLearning.isPending || pending === 0}
            className="text-xs"
          >
            {triggerLearning.isPending ? (
              <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3 mr-1.5" />
            )}
            Process Now
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {storeEntries.map(({ key, label }) => (
            <StatCard key={key} label={label} value={(stores as Record<string, number>)[key] ?? 0} icon={BookOpen} />
          ))}
        </div>
      )}

      {pending === 0 && !isLoading && (
        <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          All observations processed — knowledge stores are up to date.
        </p>
      )}
    </section>
  );
}

function TeamProfilesSection() {
  const { data: profiles, isLoading } = useTeamProfiles();

  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-[#C0745F]" />
        <h2 className="text-base font-semibold text-white">Team Intelligence</h2>
        {profiles && profiles.length > 0 && (
          <span className="text-xs text-gray-400 ml-1">({profiles.length} profiles)</span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      ) : !profiles || profiles.length === 0 ? (
        <p className="text-sm text-gray-500 py-2">
          No team profiles yet. Profiles are built automatically as team members complete tasks.
        </p>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile: Record<string, unknown>) => {
            const skills = (profile.skills_strong as string[]) ?? [];
            const preferred = (profile.preferred_task_types as string[]) ?? [];
            const approval = (profile.approval_rate as number) ?? 0;
            const dataPoints = (profile.data_points as number) ?? 0;

            return (
              <div
                key={profile.id as string}
                className="p-3 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">
                    {(profile.person_name as string) || (profile.person_id as string)}
                  </span>
                  <span className="text-xs text-gray-400">{dataPoints} tasks observed</span>
                </div>

                {confidenceBar(approval)}

                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {skills.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                      >
                        {s}
                      </span>
                    ))}
                    {preferred.slice(0, 2).map((p) => (
                      <span
                        key={p}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/20"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function QualityPatternsSection() {
  const { data: patterns, isLoading } = useQualityPatterns();

  const high = patterns?.filter((p: Record<string, unknown>) => (p.rejection_rate as number) >= 0.3) ?? [];

  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-[#C0745F]" />
        <h2 className="text-base font-semibold text-white">Quality Patterns</h2>
        {high.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
            {high.length} high-risk
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      ) : !patterns || patterns.length === 0 ? (
        <p className="text-sm text-gray-500 py-2">
          No quality patterns learned yet. Patterns emerge after tasks go through review cycles.
        </p>
      ) : (
        <div className="space-y-2">
          {(patterns as Array<Record<string, unknown>>).slice(0, 10).map((p) => {
            const rate = (p.rejection_rate as number) ?? 0;
            const pct = Math.round(rate * 100);
            const isHigh = pct >= 30;

            return (
              <div
                key={p.id as string}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-lg border",
                  isHigh
                    ? "bg-red-500/10 border-red-500/20"
                    : "bg-white/5 border-white/10"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white">{p.task_type as string}</span>
                    <span className="text-xs text-gray-400">{p.category as string}</span>
                  </div>
                  {(p.prevention_tips as string[])?.length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {(p.prevention_tips as string[])[0]}
                    </p>
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-semibold shrink-0",
                    isHigh ? "text-red-300" : "text-yellow-300"
                  )}
                >
                  {pct}% rejected
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ModelAccuracySection() {
  const { data: accuracy, isLoading } = useModelAccuracy();

  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-[#C0745F]" />
        <h2 className="text-base font-semibold text-white">Model Accuracy</h2>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      ) : !accuracy || accuracy.length === 0 ? (
        <p className="text-sm text-gray-500 py-2">
          No accuracy data yet. Accuracy is computed monthly after users interact with AI suggestions.
        </p>
      ) : (
        <div className="space-y-2">
          {(accuracy as Array<Record<string, unknown>>).slice(0, 6).map((record) => {
            const score = (record.avg_accuracy_score as number) ?? 0;
            const total = (record.total_suggestions as number) ?? 0;
            const accepted = (record.accepted_all_count as number) ?? 0;

            return (
              <div
                key={`${record.period_label}-${record.suggestion_type}`}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-white">{record.period_label as string}</span>
                    <span className="text-xs text-gray-400">{record.suggestion_type as string}</span>
                  </div>
                  {confidenceBar(score / 100)}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold text-white">{Math.round(score)}%</div>
                  <div className="text-xs text-gray-400">{accepted}/{total}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ── Page ─────────────────────────────────────────────────────────

export function AIPage() {
  return (
    <div className="flex flex-col h-full overflow-y-auto px-6 py-6 space-y-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BrainCircuit className="w-7 h-7 text-[#C0745F]" />
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#C0745F] to-[#A85A45] text-transparent bg-clip-text">
            AI Intelligence
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Self-learning insights — grows smarter with every project you complete.
          </p>
        </div>
      </div>

      {/* New-user hero — only visible when no projects exist */}
      <NewProjectAIHero />

      {/* Confidence legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          Expert (80%+)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
          Confident (60-80%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
          Learning (30-60%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
          Exploring (&lt;30%)
        </span>
        <span className="flex items-center gap-1.5 ml-auto text-gray-500">
          <Sparkles className="w-3 h-3" />
          Magic Moment triggers when you create a new project with a description
        </span>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <LearningStatusSection />
        <ModelAccuracySection />
        <TeamProfilesSection />
        <QualityPatternsSection />
      </div>

      {/* Footer note */}
      <p className="text-xs text-gray-500 pb-2 flex items-center gap-1.5">
        <Clock className="w-3 h-3" />
        Knowledge stores update automatically after each task is completed, reviewed, or approved.
        Use "Process Now" to apply pending observations immediately.
      </p>
    </div>
  );
}
