import { useState, MouseEvent } from "react";
import { Share2, Loader2, X } from "lucide-react";
import type { Pin } from "@/hooks/usePinsQuery";
import { sharePin } from "@/lib/pinShare";

interface PinShareButtonProps {
  pin: Pin;
  variant?: "icon" | "inline";
  className?: string;
}

export const PinShareButton = ({
  pin,
  variant = "inline",
  className,
}: PinShareButtonProps) => {
  const [pending, setPending] = useState(false);
  const [fallbackImageUrl, setFallbackImageUrl] = useState<string | null>(null);

  const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      const dataUrl = await sharePin(pin);
      if (dataUrl) {
        setFallbackImageUrl(dataUrl);
      }
    } catch {
      // toast already surfaced by sharePin
    } finally {
      setPending(false);
    }
  };

  const closeFallback = () => setFallbackImageUrl(null);

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={handleClick}
          disabled={pending}
          aria-label="Share pin"
          className={
            className ??
            "flex items-center justify-center w-7 h-7 rounded-full text-[var(--muted-foreground)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 disabled:opacity-60 transition-colors"
          }
        >
          {pending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Share2 className="w-3.5 h-3.5" />
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={pending}
          aria-label="Share pin"
          className={
            className ??
            "flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-60"
          }
        >
          {pending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
          <span className="font-medium">Share</span>
        </button>
      )}

      {fallbackImageUrl && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center p-6"
          onClick={closeFallback}
        >
          <p className="text-white text-sm font-medium mb-4 text-center">
            Press and hold the image to save it
          </p>
          <img
            src={fallbackImageUrl}
            alt="Share card"
            className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={closeFallback}
            className="mt-5 flex items-center gap-1.5 text-white/70 text-sm"
          >
            <X className="w-4 h-4" />
            Close
          </button>
        </div>
      )}
    </>
  );
};
