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
      toast.error("O título é obrigatório!");
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
      <DialogContent className="sm:max-w-[500px] tactical-panel border-2 border-primary">
        <DialogHeader>
          <div className="text-[10px] text-muted-foreground font-mono mb-2 uppercase flex items-center gap-2">
            <span className="text-primary">●</span>[ NEW MARKER DEPLOYMENT ]
          </div>
          <DialogTitle className="text-2xl font-black text-primary uppercase tracking-wider">
            CREATE PIN
          </DialogTitle>
          <DialogDescription className="text-sm font-mono text-muted-foreground">
            &gt; Initialize marker data on global map_
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold mb-2 block text-primary uppercase tracking-wider font-mono">
              [ Title ] *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter marker title..."
              required
              className="tactical-border bg-background/50 text-foreground placeholder:text-muted-foreground font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-bold mb-2 block text-primary uppercase tracking-wider font-mono">
              [ Message ]
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter marker description..."
              className="tactical-border bg-background/50 text-foreground placeholder:text-muted-foreground font-mono min-h-[100px]"
            />
          </div>
          <div>
            <label className="text-xs font-bold mb-2 block text-primary uppercase tracking-wider font-mono">
              [ Image URL ]
            </label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              type="url"
              className="tactical-border bg-background/50 text-foreground placeholder:text-muted-foreground font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-bold mb-2 block text-primary uppercase tracking-wider font-mono">
              [ User ID ] (Optional)
            </label>
            <Input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Anonymous"
              className="tactical-border bg-background/50 text-foreground placeholder:text-muted-foreground font-mono"
            />
          </div>

          {/* Coordinates display */}
          <div className="tactical-border p-3 bg-primary/5">
            <div className="text-[10px] text-muted-foreground font-mono uppercase mb-1">
              [ Deployment Coordinates ]
            </div>
            <div className="text-xs font-mono text-primary">
              LAT: {lat.toFixed(6)} | LNG: {lng.toFixed(6)}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              variant="default"
              size="lg"
              className="w-full bg-primary/20 hover:bg-primary/30 tactical-border text-primary font-bold uppercase tracking-wider glitch-hover"
            >
              &gt; DEPLOY MARKER_
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
