import { useState } from "react";
import { ImageLightbox } from "./ImageLightbox";
import { PinShareButton } from "./PinShareButton";
import { ExternalLink } from "lucide-react";
import type { Pin } from "@/hooks/usePinsQuery";

// Helper function to detect URL type
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

// Spotify icon component
const SpotifyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
  </svg>
);

interface PinCardProps {
  title: string;
  message?: string;
  imageUrl?: string;
  date: string;
  author?: string;
  coordinates?: { lat: number; lng: number };
  likeCount?: number;
  commentCount?: number;
  pin?: Pin;
}

export const PinCard = ({
  title,
  message,
  imageUrl,
  date,
  author,
  coordinates,
  likeCount = 0,
  commentCount = 0,
  pin,
}: PinCardProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const formattedDate = new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = new Date(date).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <div className="bg-[var(--background)] rounded-2xl overflow-hidden shadow-[var(--shadow-neu-flat)] hover:shadow-[var(--shadow-neu-raised)] transition-shadow duration-200">
        <div className="p-4 space-y-3">
          {/* Author & Date Row */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--accent)]/15 flex items-center justify-center text-[var(--accent)] font-semibold text-sm">
              {(author || "A")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)] truncate">
                {author || "Anonymous"}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {formattedDate} at {formattedTime}
              </p>
            </div>
          </div>

          {/* Message */}
          {message && (
            <p className="text-sm text-[var(--foreground)] leading-relaxed line-clamp-3">
              {message}
            </p>
          )}

          {/* Image/Link */}
          {imageUrl &&
            (() => {
              const urlType = getUrlType(imageUrl);

              if (urlType === "image") {
                return (
                  <div
                    className="mt-2 rounded-xl overflow-hidden border border-[var(--border)] cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setLightboxOpen(true)}
                  >
                    <img
                      src={imageUrl}
                      alt={title}
                      className="w-full h-40 object-cover"
                      loading="lazy"
                    />
                  </div>
                );
              }

              if (urlType === "spotify") {
                return (
                  <a
                    href={imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[#1DB954]/10 hover:bg-[#1DB954]/20 transition-colors"
                  >
                    <SpotifyIcon className="w-8 h-8 text-[#1DB954] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)] truncate">
                        Spotify Link
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)] truncate">
                        {imageUrl}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
                  </a>
                );
              }

              // Generic link
              return (
                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--accent)]/5 hover:bg-[var(--accent)]/10 transition-colors"
                >
                  <ExternalLink className="w-6 h-6 text-[var(--accent)] flex-shrink-0" />
                  <p className="text-sm text-[var(--accent)] truncate flex-1">
                    {imageUrl}
                  </p>
                </a>
              );
            })()}

          {/* Coordinates */}
          {coordinates && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>
                {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
              </span>
            </div>
          )}

          {/* Stats Row */}
          <div className="flex items-center gap-4 pt-2 border-t border-[var(--border)]">
            <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </svg>
              <span>{likeCount}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
                />
              </svg>
              <span>{commentCount}</span>
            </div>
            {pin && (
              <div className="ml-auto">
                <PinShareButton pin={pin} variant="icon" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {imageUrl && getUrlType(imageUrl) === "image" && (
        <ImageLightbox
          imageUrl={imageUrl}
          alt={title}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
};
