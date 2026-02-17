/**
 * Task Comments Panel
 */

import { MessageCircle, Send } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "../../ui/primitives/button";
import { Input } from "../../ui/primitives/input";
import { cn } from "../../ui/primitives/styles";

interface Comment {
  id: string;
  comment_text: string;
  created_at: string;
  archon_users_profile: { display_name: string };
}

export function TaskCommentsPanel({ taskId }: { taskId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  async function fetchComments() {
    try {
      const userId = localStorage.getItem("10x-user-id");
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        headers: { "X-User-Id": userId || "" },
      });

      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);

    try {
      const userId = localStorage.getItem("10x-user-id");
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userId || "",
        },
        body: JSON.stringify({ comment_text: newComment }),
      });

      if (response.ok) {
        setNewComment("");
        fetchComments();
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <MessageCircle className="w-4 h-4" />
        Comments ({comments.length})
      </h3>

      {/* Comments List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-[#C0745F] text-white text-xs flex items-center justify-center">
                  {comment.archon_users_profile?.display_name?.charAt(0) || "U"}
                </div>
                <span className="font-medium text-sm">{comment.archon_users_profile?.display_name}</span>
                <span className="text-xs text-gray-500">
                  {new Date(comment.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 ml-8">
                {comment.comment_text}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Add Comment */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={isSubmitting}
        />
        <Button type="submit" size="sm" disabled={isSubmitting || !newComment.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
