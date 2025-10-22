import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PinLikeButtonProps {
  pinId: string;
  initialLikeCount: number;
}

export const PinLikeButton = ({ pinId, initialLikeCount }: PinLikeButtonProps) => {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user has liked this pin (using localStorage)
    const likedPins = JSON.parse(localStorage.getItem("likedPins") || "[]");
    setIsLiked(likedPins.includes(pinId));
  }, [pinId]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;

    setIsLoading(true);
    try {
      const likedPins = JSON.parse(localStorage.getItem("likedPins") || "[]");

      if (isLiked) {
        // Unlike: delete the most recent like for this pin
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("pin_id", pinId)
          .order("created_at", { ascending: false })
          .limit(1);

        if (error) throw error;

        // Update localStorage
        const updatedLikes = likedPins.filter((id: string) => id !== pinId);
        localStorage.setItem("likedPins", JSON.stringify(updatedLikes));
        setIsLiked(false);
        setLikeCount((prev) => prev - 1);
      } else {
        // Like: insert new like
        const { error } = await supabase
          .from("likes")
          .insert({ pin_id: pinId });

        if (error) throw error;

        // Update localStorage
        localStorage.setItem("likedPins", JSON.stringify([...likedPins, pinId]));
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update like");
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
      <Heart
        className={`w-4 h-4 transition-all ${
          isLiked
            ? "fill-red-500 text-red-500"
            : "fill-none group-hover:fill-red-100"
        }`}
      />
      <span className="font-medium">{likeCount}</span>
    </button>
  );
};
