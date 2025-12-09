import { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Plus, Minus } from "lucide-react";
import { PinLikeButton } from "@/components/PinLikeButton";
import { PinComments } from "@/components/PinComments";
import { supabase } from "@/integrations/supabase/client";

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

  // Fetch Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-mapbox-token");
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
      style: "mapbox://styles/mapbox/dark-v11",
      center: [0, 20],
      zoom: 2,
      projection: "mercator",
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
        el.style.backgroundColor = selectedPinId === pin.id ? "#0078d4" : "#ff4444";
      } else {
        // Create new marker
        const el = document.createElement("div");
        el.className = "mapbox-marker";
        el.style.width = "24px";
        el.style.height = "24px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = selectedPinId === pin.id ? "#0078d4" : "#ff4444";
        el.style.border = "3px solid white";
        el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
        el.style.cursor = "pointer";
        el.style.transition = "transform 0.2s, background-color 0.2s";

        el.addEventListener("mouseenter", () => {
          el.style.transform = "scale(1.2)";
        });
        el.addEventListener("mouseleave", () => {
          el.style.transform = "scale(1)";
        });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([pin.lng, pin.lat])
          .addTo(map.current!);

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          setSelectedPin(pin);
          onPinSelect?.(pin);
        });

        markersRef.current.set(pin.id, marker);
      }
    });
  }, [pins, mapLoaded, selectedPinId, onPinSelect]);

  // Handle selected pin from props
  useEffect(() => {
    if (selectedPinId && map.current) {
      const pin = pins.find((p) => p.id === selectedPinId);
      if (pin) {
        setSelectedPin(pin);
        map.current.flyTo({
          center: [pin.lng, pin.lat],
          zoom: 15,
          duration: 1000,
        });
      }
    } else {
      setSelectedPin(null);
    }
  }, [selectedPinId, pins]);

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

  const handleZoomIn = () => {
    map.current?.zoomIn();
  };

  const handleZoomOut = () => {
    map.current?.zoomOut();
  };

  if (!mapToken) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/50 rounded-2xl">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 z-[999] flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="w-11 h-11 flex items-center justify-center bg-card rounded-xl shadow-lg border border-border hover:shadow-xl hover:scale-105 transition-all"
          aria-label="Zoom in"
        >
          <Plus className="w-5 h-5 text-foreground" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-11 h-11 flex items-center justify-center bg-card rounded-xl shadow-lg border border-border hover:shadow-xl hover:scale-105 transition-all"
          aria-label="Zoom out"
        >
          <Minus className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Popup Card */}
      {selectedPin && (
        <div className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-[95%] md:w-[90%] max-w-md">
          <div className="bg-card rounded-2xl shadow-2xl border border-border p-4 md:p-5">
            <button
              onClick={handleClosePin}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <span className="text-2xl font-semibold leading-none text-muted-foreground">
                ×
              </span>
            </button>

            <div className="flex gap-3 mb-3">
              <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold text-base md:text-lg shadow-lg">
                {(selectedPin.author || "A")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground text-sm md:text-base">
                  {selectedPin.author || "Anonymous"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(selectedPin.created_at).toLocaleDateString()} at{" "}
                  {new Date(selectedPin.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>

            <p className="text-xs md:text-sm text-foreground leading-relaxed mb-3 break-words whitespace-pre-wrap">
              {selectedPin.text}
            </p>

            {selectedPin.image_url && (
              <a
                href={selectedPin.image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block mb-3"
              >
                <div className="text-xs md:text-sm text-primary hover:text-accent underline bg-primary/10 border border-primary/20 p-2 rounded-xl flex items-center gap-1">
                  <svg
                    className="inline-block w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span className="break-all">{selectedPin.image_url}</span>
                </div>
              </a>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
              <span className="flex items-center">
                <svg
                  className="inline-block w-3 h-3 mr-1"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                {selectedPin.lat.toFixed(4)}, {selectedPin.lng.toFixed(4)}
              </span>
            </div>

            <div className="flex items-center gap-4 mt-3 pt-2 border-t border-border">
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
    </div>
  );
};
