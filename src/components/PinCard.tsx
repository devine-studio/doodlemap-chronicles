import { useState } from "react";
import { ImageLightbox } from "./ImageLightbox";

interface PinCardProps {
  title: string;
  message?: string;
  imageUrl?: string;
  date: string;
  author?: string;
  coordinates?: { lat: number; lng: number };
  likeCount?: number;
  commentCount?: number;
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

          {/* Image */}
          {imageUrl && (
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
          )}

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
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {imageUrl && (
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
