import { useState, useEffect } from "react";
import { MessageCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface Comment {
  id: string;
  text: string;
  author: string | null;
  created_at: string;
}

interface PinCommentsProps {
  pinId: string;
  initialCommentCount: number;
}

export const PinComments = ({ pinId, initialCommentCount }: PinCommentsProps) => {
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [showComments, pinId]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("pin_id", pinId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("Error loading comments:", error);
      toast.error("Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          pin_id: pinId,
          text: newComment.trim(),
          author: authorName.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      setComments([...comments, data]);
      setCommentCount((prev) => prev + 1);
      setNewComment("");
      toast.success("Comment added!");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowComments(!showComments);
        }}
        className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600 transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="font-medium">{commentCount}</span>
      </button>

      {showComments && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-3 pt-3 border-t border-gray-200 space-y-3"
        >
          {/* Comments list */}
          {isLoading ? (
            <div className="text-xs text-gray-500 text-center py-2">
              Loading comments...
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-apple">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-800">
                      {comment.author || "Anonymous"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 break-words">
                    {comment.text}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-500 text-center py-2">
              No comments yet
            </div>
          )}

          {/* Add comment form */}
          <form onSubmit={handleSubmitComment} className="space-y-2">
            <Input
              placeholder="Your name (optional)"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="text-xs h-8"
              maxLength={50}
            />
            <div className="flex gap-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="text-xs min-h-[60px] resize-none"
                maxLength={500}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!newComment.trim() || isSubmitting}
                className="h-[60px] px-3"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
