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
            Criar um novo pin
          </DialogTitle>
          <div className="text-xs text-gray-600 mt-1 font-medium">
            📍 Location: {lat.toFixed(4)}, {lng.toFixed(4)}
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="text"
                className="text-sm font-medium text-gray-700"
              >
                O que está acontecendo?
              </Label>
              <span
                className={`text-xs font-medium ${
                  text.length > 140
                    ? "text-red-600"
                    : text.length > 120
                    ? "text-orange-500"
                    : "text-gray-500"
                }`}
              >
                {text.length}/140
              </span>
            </div>
            <Textarea
              id="text"
              placeholder="Compartilhe memórias em lugares incríveis..."
              value={text}
              onChange={(e) => {
                if (e.target.value.length <= 140) {
                  setText(e.target.value);
                }
              }}
              className="min-h-[120px] resize-none"
              required
              maxLength={140}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="author"
              className="text-sm font-medium text-gray-700"
            >
              Seu nome (opcional)
            </Label>
            <Input
              id="author"
              placeholder="Anônimo"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="imageUrl"
              className="text-sm font-medium text-gray-700"
            >
              Link (opcional)
            </Label>
            <Input
              id="imageUrl"
              type="url"
              placeholder="compartilhe um link do spotify, youtube, etc..."
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
