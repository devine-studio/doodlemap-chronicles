import { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { PinLikeButton } from "@/components/PinLikeButton";
import { PinComments } from "@/components/PinComments";
import { ImageLightbox } from "@/components/ImageLightbox";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";

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

interface Pin {
  id: string;
  lat: number;
  lng: number;
  text: string;
  image_url?: string;
  created_at: string;
  author?: string;
  like_count?: number;
  comment_count?: number;
}

interface WorldMapProps {
  pins: (Pin & { imageUrl?: string; date?: string })[];
  onMapClick: (lat: number, lng: number) => void;
  selectedPinId?: string | null;
  onPinSelect?: (pin: Pin | null) => void;
}

export const WorldMap = ({
  pins,
  onMapClick,
  selectedPinId,
  onPinSelect,
}: WorldMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapToken, setMapToken] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          "get-mapbox-token"
        );
        if (error) throw error;
        setMapToken(data.token);
      } catch (error) {
        console.error("Error fetching Mapbox token:", error);
      }
    };
    fetchToken();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapToken) return;

    mapboxgl.accessToken = mapToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/standard?optimize=true",
      center: [-52.6167, -27.1], // Chapecó, SC, Brazil
      zoom: 1.5, // Start zoomed out to show globe
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      projection: "globe",
      fadeDuration: 0, // Disable fade animations for better performance
      antialias: false, // Disable antialiasing for performance
    });

    // Use 'idle' event - fires when map is fully rendered and all tiles loaded
    map.current.once("idle", () => {
      // Fly to Chapecó with optimized animation curve
      map.current?.flyTo({
        center: [-52.6167, -27.1],
        zoom: 15,
        pitch: 80,
        bearing: -17,
        duration: 2500,
        essential: true,
        curve: 1.5, // Smoother animation curve
        speed: 1.2, // Slightly faster
        easing: (t) => t, // Linear easing for consistent speed
      });
    });

    map.current.on("load", () => {
      setMapLoaded(true);
    });

    map.current.on("click", (e) => {
      onMapClick(e.lngLat.lat, e.lngLat.lng);
    });
    return () => {
      map.current?.remove();
    };
  }, [mapToken]);

  // Handle markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove old markers that are no longer in pins
    const currentPinIds = new Set(pins.map((p) => p.id));
    markersRef.current.forEach((marker, id) => {
      if (!currentPinIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add or update markers
    pins.forEach((pin) => {
      if (markersRef.current.has(pin.id)) {
        // Update existing marker color if needed
        const marker = markersRef.current.get(pin.id)!;
        const el = marker.getElement();
        el.style.backgroundColor =
          selectedPinId === pin.id ? "#0078d4" : "#ff4444";
      } else {
        // Create new marker
        const el = document.createElement("div");
        el.className = "mapbox-marker";
        el.style.width = "24px";
        el.style.height = "24px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor =
          selectedPinId === pin.id ? "#0078d4" : "#ff4444";
        el.style.border = "2px solid white";
        el.style.cursor = "pointer";
        el.style.touchAction = "manipulation";
        el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";

        const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([pin.lng, pin.lat])
          .addTo(map.current!);

        // Handle both click and touch events for mobile compatibility
        const handlePinClick = (e: Event) => {
          e.stopPropagation();
          e.preventDefault();
          setSelectedPin(pin);
          onPinSelect?.(pin);
        };

        el.addEventListener("click", handlePinClick);
        el.addEventListener("touchend", handlePinClick, { passive: false });

        markersRef.current.set(pin.id, marker);
      }
    });
  }, [pins, mapLoaded, selectedPinId, onPinSelect]);

  // Handle selected pin from props
  useEffect(() => {
    if (selectedPinId && map.current && mapLoaded) {
      const pin = pins.find((p) => p.id === selectedPinId);
      if (pin) {
        setSelectedPin(pin);
        // Small delay to ensure map is ready after tab switch
        setTimeout(() => {
          map.current?.flyTo({
            center: [pin.lng, pin.lat],
            zoom: 17,
            pitch: 60,
            bearing: -17,
            duration: 1000,
          });
        }, 100);
      }
    } else if (!selectedPinId) {
      setSelectedPin(null);
    }
  }, [selectedPinId, pins, mapLoaded]);

  // Update marker colors when selection changes
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement();
      el.style.backgroundColor = selectedPinId === id ? "#0078d4" : "#ff4444";
    });
  }, [selectedPinId]);

  const handleClosePin = () => {
    setSelectedPin(null);
    onPinSelect?.(null);
  };

  if (!mapToken) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/50 rounded-2xl">
        <div className="w-8 h-8 rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleTilt3D = () => {
    map.current?.easeTo({
      pitch: 80,
      bearing: -17,
      duration: 500,
    });
  };

  const handleTilt2D = () => {
    map.current?.easeTo({
      pitch: 0,
      bearing: 0,
      duration: 500,
    });
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Tilt Controls - Middle Right */}
      <div className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-[999] flex-col gap-2">
        <button
          onClick={handleTilt3D}
          className="w-10 h-10 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          title="3D View"
        >
          <svg
            className="w-5 h-5 text-gray-700"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 3L2 8l10 5 10-5-10-5z" />
            <path d="M2 13l10 5 10-5" />
            <path d="M2 18l10 5 10-5" />
          </svg>
        </button>
        <button
          onClick={handleTilt2D}
          className="w-10 h-10 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          title="2D View"
        >
          <svg
            className="w-5 h-5 text-gray-700"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        </button>
      </div>

      {/* Watermark Logo */}
      <div className="absolute bg-white rounded-full px-3 py-2 bottom-6 md:bottom-auto md:top-6 left-4 z-[999] flex items-center gap-1.5 opacity-70 pointer-events-none">
        <img src="/win7world.png" alt="mapin" className="w-6 h-6 drop-shadow" />
        <span className="text-xs font-semibold text-[var(--foreground)] drop-shadow-sm">
          mapin
        </span>
      </div>

      {/* Popup Card */}
      {selectedPin && (
        <div className="absolute bottom-3 md:bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[92%] md:w-[85%] max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="bg-white overflow-hidden">
            {/* Header */}
            <div className="relative px-4 py-3">
              <button
                onClick={handleClosePin}
                className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-[var(--muted)]/50 hover:bg-[var(--muted)] transition-colors"
                aria-label="Close"
              >
                <svg
                  className="w-3.5 h-3.5 text-[var(--muted-foreground)]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <div className="flex items-center gap-3 pr-8">
                <div className="w-9 h-9 rounded-full bg-[var(--accent)]/15 flex items-center justify-center text-[var(--accent)] font-semibold text-sm">
                  {(selectedPin.author || "A")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--foreground)] text-sm truncate">
                    {selectedPin.author || "Anonymous"}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {new Date(selectedPin.created_at).toLocaleDateString(
                      undefined,
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}{" "}
                    at{" "}
                    {new Date(selectedPin.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 pb-3 space-y-3">
              <p className="text-sm text-[var(--foreground)] leading-relaxed break-words whitespace-pre-wrap">
                {selectedPin.text}
              </p>

              {selectedPin.image_url &&
                (() => {
                  const urlType = getUrlType(selectedPin.image_url);

                  if (urlType === "image") {
                    return (
                      <div
                        className="rounded-xl overflow-hidden border border-[var(--border)] cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setLightboxOpen(true)}
                      >
                        <img
                          src={selectedPin.image_url}
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
                        href={selectedPin.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[#1DB954]/10 hover:bg-[#1DB954]/20 transition-colors"
                      >
                        <SpotifyIcon className="w-8 h-8 text-[#1DB954] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--foreground)] truncate">
                            Spotify Link
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)] truncate">
                            {selectedPin.image_url}
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
                      </a>
                    );
                  }

                  // Generic link
                  return (
                    <a
                      href={selectedPin.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--accent)]/5 hover:bg-[var(--accent)]/10 transition-colors"
                    >
                      <ExternalLink className="w-6 h-6 text-[var(--accent)] flex-shrink-0" />
                      <p className="text-sm text-[var(--accent)] truncate flex-1">
                        {selectedPin.image_url}
                      </p>
                    </a>
                  );
                })()}

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
                  {selectedPin.lat.toFixed(4)}, {selectedPin.lng.toFixed(4)}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 flex items-center gap-4 border-t border-[var(--border)]">
              <PinLikeButton
                pinId={selectedPin.id}
                initialLikeCount={selectedPin.like_count || 0}
              />
              <PinComments
                pinId={selectedPin.id}
                initialCommentCount={selectedPin.comment_count || 0}
                showComments={false}
                onToggleComments={() => {}}
              />
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {selectedPin?.image_url &&
        getUrlType(selectedPin.image_url) === "image" && (
          <ImageLightbox
            imageUrl={selectedPin.image_url}
            alt="Pin image"
            isOpen={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
          />
        )}
    </div>
  );
};
