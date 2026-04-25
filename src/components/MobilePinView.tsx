import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { X, ExternalLink, Navigation } from "lucide-react";
import { Pin } from "@/hooks/usePinsQuery";
import { PinLikeButton } from "@/components/PinLikeButton";
import { PinComments } from "@/components/PinComments";
import { PinShareButton } from "@/components/PinShareButton";
import { ImageLightbox } from "@/components/ImageLightbox";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface MobilePinViewProps {
  pin: Pin | null;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded?: (pinId: string) => void;
  onLikeAdded?: () => void;
}

export const MobilePinView = ({
  pin,
  isOpen,
  onClose,
  onCommentAdded,
  onLikeAdded,
}: MobilePinViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapToken, setMapToken] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const fetchToken = async () => {
      try {
        const { data, error } =
          await supabase.functions.invoke("get-mapbox-token");
        if (error) throw error;
        if (!cancelled) setMapToken(data.token);
      } catch (error) {
        console.error("Error fetching Mapbox token:", error);
      }
    };

    if (!mapToken) {
      fetchToken();
    }

    return () => {
      cancelled = true;
    };
  }, [isOpen, mapToken]);

  useEffect(() => {
    if (!isOpen || !mapContainer.current || !mapToken || !pin) return;

    mapboxgl.accessToken = mapToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [pin.lng, pin.lat],
      zoom: 15,
      interactive: false,
      attributionControl: false,
    });

    new mapboxgl.Marker({ color: "#ff4444" })
      .setLngLat([pin.lng, pin.lat])
      .addTo(map.current);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [isOpen, mapToken, pin]);

  useEffect(() => {
    if (!isOpen) {
      setShowComments(false);
      setLightboxOpen(false);
    }
  }, [isOpen]);

  if (!isOpen || !pin) return null;

  const urlType = pin.image_url ? getUrlType(pin.image_url) : null;

  return (
    <div
      className="fixed inset-0 z-[1000] pb-32 bg-white overflow-y-auto overscroll-y-contain scrollbar-apple animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="top-0 z-10 flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur border-b border-[var(--border)]">
        <h2 className="text-base font-semibold text-[var(--foreground)]">
          Pin
        </h2>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--muted)]/50 hover:bg-[var(--muted)] transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-[var(--foreground)]" />
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-4 pb-8">
        <div className="mb-5 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--muted)]/20">
          <div
            ref={mapContainer}
            className="w-full h-[220px] relative"
            style={{ backgroundColor: "#f0f0f0" }}
          >
            {!mapToken && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          <div className="px-3 py-2 bg-white border-t border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
              <Navigation className="w-3 h-3" />
              <span>
                {pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}
              </span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="text-xs text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                  aria-label="Open in maps"
                >
                  <ExternalLink className="w-3 h-3" />
                  Abrir
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="min-w-[180px] bg-white border border-gray-200 shadow-lg"
              >
                <DropdownMenuItem
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps?q=${pin.lat},${pin.lng}`,
                      "_blank",
                    )
                  }
                  className="cursor-pointer"
                >
                  Abrir no Google Maps
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    window.open(
                      `https://maps.apple.com/?q=${pin.lat},${pin.lng}`,
                      "_blank",
                    )
                  }
                  className="cursor-pointer"
                >
                  Abrir no Apple Maps
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold shadow-md">
            {(pin.author || "A")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[var(--foreground)] text-sm truncate">
              {pin.author || "Anonymous"}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {new Date(pin.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}{" "}
              at{" "}
              {new Date(pin.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <p className="text-sm text-[var(--foreground)] leading-relaxed break-words whitespace-pre-wrap mb-4">
          {pin.text}
        </p>

        {pin.image_url && urlType === "image" && (
          <div
            className="mb-4 rounded-xl overflow-hidden border border-[var(--border)] cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setLightboxOpen(true)}
          >
            <img
              src={pin.image_url}
              alt="Pin image"
              className="w-full max-h-[60vh] object-cover"
              loading="lazy"
            />
          </div>
        )}

        {pin.image_url && urlType === "spotify" && (
          <a
            href={pin.image_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[#1DB954]/10 hover:bg-[#1DB954]/20 transition-colors"
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
        )}

        {pin.image_url && urlType === "link" && (
          <a
            href={pin.image_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--accent)]/5 hover:bg-[var(--accent)]/10 transition-colors"
          >
            <ExternalLink className="w-6 h-6 text-[var(--accent)] flex-shrink-0" />
            <p className="text-sm text-[var(--accent)] truncate flex-1">
              {pin.image_url}
            </p>
          </a>
        )}

        <div className="pt-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-4">
            <PinLikeButton
              pinId={pin.id}
              initialLikeCount={pin.like_count || 0}
              onLikeAdded={onLikeAdded}
            />
            <button
              onClick={() => setShowComments((prev) => !prev)}
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
              <span className="font-medium">{pin.comment_count || 0}</span>
            </button>
            <PinShareButton pin={pin} variant="inline" />
          </div>
          <PinComments
            pinId={pin.id}
            initialCommentCount={pin.comment_count || 0}
            showComments={showComments}
            onToggleComments={() => setShowComments((prev) => !prev)}
            onCommentAdded={() => onCommentAdded?.(pin.id)}
          />
        </div>
      </div>

      {pin.image_url && urlType === "image" && (
        <ImageLightbox
          imageUrl={pin.image_url}
          alt="Pin image"
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
};
