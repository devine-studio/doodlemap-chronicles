import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PinLikeButtonProps {
  pinId: string;
  initialLikeCount: number;
  onLikeAdded?: () => void;
}

export const PinLikeButton = ({
  pinId,
  initialLikeCount,
  onLikeAdded,
}: PinLikeButtonProps) => {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;

    setIsLoading(true);
    try {
      // Always add a new like (no unlike functionality)
      const { error } = await supabase.from("likes").insert({ pin_id: pinId });

      if (error) throw error;

      setLikeCount((prev) => prev + 1);
      toast.success("Liked!");

      // Notify parent component that a like was added
      if (onLikeAdded) {
        onLikeAdded();
      }
    } catch (error) {
      console.error("Error adding like:", error);
      toast.error("Failed to add like");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={isLoading}
      className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-500 transition-colors group"
    >
      <Heart className="w-4 h-4 transition-all fill-none group-hover:fill-red-100" />
      <span className="font-medium">{likeCount}</span>
    </button>
  );
};
