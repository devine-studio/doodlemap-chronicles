import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CreatePinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    text: string;
    imageUrl?: string;
    author?: string;
    lat: number;
    lng: number;
  }) => void;
  lat: number;
  lng: number;
}

export const CreatePinDialog = ({
  open,
  onOpenChange,
  onSubmit,
  lat,
  lng,
}: CreatePinDialogProps) => {
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [author, setAuthor] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    onSubmit({
      text: text.trim(),
      imageUrl: imageUrl.trim() || undefined,
      author: author.trim() || undefined,
      lat,
      lng,
    });

    // Reset form
    setText("");
    setImageUrl("");
    setAuthor("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-800">
            Create a new pin
          </DialogTitle>
          <div className="text-xs text-gray-600 mt-1 font-medium">
            📍 Location: {lat.toFixed(4)}, {lng.toFixed(4)}
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="text" className="text-sm font-medium text-gray-700">
              What's happening?
            </Label>
            <Textarea
              id="text"
              placeholder="Share your thoughts, memories, or anything you'd like..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[120px] resize-none"
              required
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="author"
              className="text-sm font-medium text-gray-700"
            >
              Your name (optional)
            </Label>
            <Input
              id="author"
              placeholder="Anonymous"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="imageUrl"
              className="text-sm font-medium text-gray-700"
            >
              Image URL (optional)
            </Label>
            <Input
              id="imageUrl"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!text.trim()}>
              Post Pin
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
