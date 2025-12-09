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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-[var(--foreground)]">
            Criar um novo pin
          </DialogTitle>
          <div className="text-xs text-[var(--muted-foreground)] mt-1 font-medium">
            <svg
              className="inline-block w-3 h-3 mr-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="text"
                className="text-sm font-medium text-[var(--foreground)]"
              >
                O que está acontecendo?
              </Label>
              <span
                className={`text-xs font-medium ${
                  text.length > 140
                    ? "text-red-600"
                    : text.length > 120
                    ? "text-orange-500"
                    : "text-[var(--muted-foreground)]"
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
              className="text-sm font-medium text-[var(--foreground)]"
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
              className="text-sm font-medium text-[var(--foreground)]"
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

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Publicar Pin</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
