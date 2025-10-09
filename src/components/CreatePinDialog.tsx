import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface CreatePinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (pin: {
    title: string;
    message?: string;
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
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [author, setAuthor] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required!");
      return;
    }

    onSubmit({
      title: title.trim(),
      message: message.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      author: author.trim() || undefined,
      lat,
      lng,
    });

    // Reset form
    setTitle("");
    setMessage("");
    setImageUrl("");
    setAuthor("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Create New Pin
          </DialogTitle>
          <DialogDescription className="text-sm">
            Add a new pin to the map with your information
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-sm font-medium">
              Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter pin title..."
              required
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="message" className="text-sm font-medium">
              Message
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter a description..."
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="imageUrl" className="text-sm font-medium">
              Image URL
            </Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              type="url"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="author" className="text-sm font-medium">
              Author (Optional)
            </Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Anonymous"
              className="mt-1.5"
            />
          </div>

          {/* Coordinates display */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="text-xs text-gray-600 mb-1">
              Pin Coordinates
            </div>
            <div className="text-sm font-medium text-gray-800">
              Latitude: {lat.toFixed(6)}, Longitude: {lng.toFixed(6)}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="shine-effect">
              Create Pin
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
