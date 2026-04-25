import { useState, useRef, TouchEvent as ReactTouchEvent } from "react";
import { Pin } from "@/hooks/usePinsQuery";
import { PinLikeButton } from "@/components/PinLikeButton";
import { PinComments } from "@/components/PinComments";
import { PinShareButton } from "@/components/PinShareButton";
import { Input } from "@/components/ui/input";
import { Search, X, ExternalLink } from "lucide-react";

const getUrlType = (url: string): "image" | "spotify" | "link" => {
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;
  const imageHosts = /\.(supabase\.co|cloudinary|imgur|unsplash)/i;

  if (imageExtensions.test(url) || imageHosts.test(url)) {
    return "image";
  }
  if (url.includes("spotify.com") || url.includes("open.spotify")) {
    return "spotify";
  }
  return "link";
};

const SpotifyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
  </svg>
);

interface PinsFeedProps {
  pins: Pin[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  lastPinElementRef: (node: HTMLDivElement | null) => void;
  onPinClick?: (pinId: string) => void;
  onImageClick?: (imageUrl: string) => void;
  onCommentAdded: (pinId: string) => void;
  onLikeAdded: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const PinsFeed = ({
  pins,
  isLoading,
  isFetchingNextPage,
  lastPinElementRef,
  onPinClick,
  onImageClick,
  onCommentAdded,
  onLikeAdded,
  searchQuery,
  onSearchChange,
}: PinsFeedProps) => {
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set()
  );
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const filteredPins = pins.filter((pin) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      pin.text.toLowerCase().includes(query) ||
      (pin.author && pin.author.toLowerCase().includes(query))
    );
  });

  const toggleComments = (pinId: string) => {
    setExpandedComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pinId)) {
        newSet.delete(pinId);
      } else {
        newSet.add(pinId);
      }
      return newSet;
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar pins..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="divide-y divide-[var(--border)] overflow-y-auto scrollbar-apple h-full">
          {filteredPins.map((pin, index) => (
            <div
              key={pin.id}
              ref={filteredPins.length === index + 1 ? lastPinElementRef : null}
              onClick={() => onPinClick?.(pin.id)}
              onTouchStart={(e) => {
                const touch = e.touches[0];
                touchStartRef.current = {
                  x: touch.clientX,
                  y: touch.clientY,
                };
              }}
              onTouchEnd={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest("button")) return;

                if (touchStartRef.current) {
                  const touch = e.changedTouches[0];
                  const dx = Math.abs(touch.clientX - touchStartRef.current.x);
                  const dy = Math.abs(touch.clientY - touchStartRef.current.y);
                  if (dx < 10 && dy < 10) {
                    e.preventDefault();
                    onPinClick?.(pin.id);
                  }
                }
                touchStartRef.current = null;
              }}
              className="px-4 py-3 cursor-pointer hover:bg-[var(--muted)]/30 active:bg-[var(--muted)]/50 transition-colors"
              role="button"
              tabIndex={0}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold shadow-md">
                  {(pin.author || "A")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground text-sm">
                      {pin.author || "Anonymous"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      · {new Date(pin.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-foreground break-words whitespace-pre-wrap mb-2">
                    {pin.text}
                  </p>
                  {pin.image_url &&
                    (() => {
                      const urlType = getUrlType(pin.image_url);

                      if (urlType === "image") {
                        return (
                          <div
                            className="mt-2 rounded-xl overflow-hidden border border-[var(--border)] cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              onImageClick?.(pin.image_url!);
                            }}
                          >
                            <img
                              src={pin.image_url}
                              alt="Pin image"
                              className="w-full h-40 object-cover"
                              loading="lazy"
                            />
                          </div>
                        );
                      }

                      if (urlType === "spotify") {
                        return (
                          <a
                            href={pin.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="mt-2 flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[#1DB954]/10 hover:bg-[#1DB954]/20 transition-colors"
                          >
                            <SpotifyIcon className="w-8 h-8 text-[#1DB954] flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[var(--foreground)] truncate">
                                Spotify Link
                              </p>
                              <p className="text-xs text-[var(--muted-foreground)] truncate">
                                {pin.image_url}
                              </p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
                          </a>
                        );
                      }

                      return (
                        <a
                          href={pin.image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="mt-2 flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--accent)]/5 hover:bg-[var(--accent)]/10 transition-colors"
                        >
                          <ExternalLink className="w-6 h-6 text-[var(--accent)] flex-shrink-0" />
                          <p className="text-sm text-[var(--accent)] truncate flex-1">
                            {pin.image_url}
                          </p>
                        </a>
                      );
                    })()}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <svg
                        className="inline-block w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                      </svg>
                      {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center gap-4">
                      <PinLikeButton
                        pinId={pin.id}
                        initialLikeCount={pin.like_count || 0}
                        onLikeAdded={onLikeAdded}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleComments(pin.id);
                        }}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <span className="font-medium">
                          {pin.comment_count || 0}
                        </span>
                      </button>
                      <div className="ml-auto">
                        <PinShareButton pin={pin} variant="icon" />
                      </div>
                    </div>
                    <PinComments
                      pinId={pin.id}
                      initialCommentCount={pin.comment_count || 0}
                      showComments={expandedComments.has(pin.id)}
                      onToggleComments={() => toggleComments(pin.id)}
                      onCommentAdded={() => onCommentAdded(pin.id)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredPins.length === 0 && !isLoading && (
            <div className="text-sm text-muted-foreground text-center py-8 font-medium">
              {searchQuery ? "Nenhum pin encontrado" : "No pins yet"}
            </div>
          )}
          {isFetchingNextPage && (
            <div className="text-sm text-[var(--muted-foreground)] text-center py-4 font-medium">
              Loading more...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
