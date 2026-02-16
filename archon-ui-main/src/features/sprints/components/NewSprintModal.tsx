/**
 * New Sprint Modal Component
 *
 * Modal for creating a new sprint
 */

import { useState } from "react";
import { Button } from "../../ui/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/primitives/dialog";
import { Input } from "../../ui/primitives/input";
import { useCreateSprint } from "../hooks/useSprintQueries";

interface NewSprintModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function NewSprintModal({ projectId, isOpen, onClose }: NewSprintModalProps) {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [capacityHours, setCapacityHours] = useState("0");

  const createSprintMutation = useCreateSprint();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    createSprintMutation.mutate(
      {
        projectId,
        data: {
          name: name.trim(),
          goal: goal.trim() || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          capacity_hours: parseInt(capacityHours) || 0,
        },
      },
      {
        onSuccess: () => {
          // Reset form
          setName("");
          setGoal("");
          setStartDate("");
          setEndDate("");
          setCapacityHours("0");
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Sprint</DialogTitle>
            <DialogDescription>
              Create a new sprint to organize tasks into time-boxed iterations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Sprint Name */}
            <div className="space-y-2">
              <label htmlFor="sprint-name" className="text-sm font-medium">
                Sprint Name *
              </label>
              <Input
                id="sprint-name"
                placeholder="Sprint 1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Sprint Goal */}
            <div className="space-y-2">
              <label htmlFor="sprint-goal" className="text-sm font-medium">
                Sprint Goal
              </label>
              <Input
                id="sprint-goal"
                placeholder="Complete user authentication feature"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="start-date" className="text-sm font-medium">
                  Start Date
                </label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="end-date" className="text-sm font-medium">
                  End Date
                </label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Capacity */}
            <div className="space-y-2">
              <label htmlFor="capacity" className="text-sm font-medium">
                Team Capacity (hours)
              </label>
              <Input
                id="capacity"
                type="number"
                min="0"
                placeholder="160"
                value={capacityHours}
                onChange={(e) => setCapacityHours(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Total team capacity for this sprint (e.g., 5 people × 2 weeks × 16 hours = 160)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || createSprintMutation.isPending}
            >
              {createSprintMutation.isPending ? "Creating..." : "Create Sprint"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
