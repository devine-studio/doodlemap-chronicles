import { useState, useEffect } from "react";
import { Map, Marker } from "pigeon-maps";
import { Plus, Minus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface Pin {
  id: string;
  lat: number;
  lng: number;
  text: string;
  image_url?: string;
  created_at: string;
  author?: string;
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
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [zoom, setZoom] = useState(2);
  const [center, setCenter] = useState<[number, number]>([20, 0]);
  const isMobile = useIsMobile();

  const handleClick = ({ latLng }: { latLng: [number, number] }) => {
    onMapClick(latLng[0], latLng[1]);
  };

  const handleMarkerClick = (pin: Pin) => {
    setSelectedPin(pin);
    onPinSelect?.(pin);
  };

  const handleClosePin = () => {
    setSelectedPin(null);
    onPinSelect?.(null);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 1, 18));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 1, 1));
  };

  useEffect(() => {
    if (selectedPinId) {
      const pin = pins.find((p) => p.id === selectedPinId);
      if (pin) {
        setSelectedPin(pin);
        setCenter([pin.lat, pin.lng]);
        setZoom(10);
      }
    }
  }, [selectedPinId, pins]);

  return (
    <div className="relative w-full h-full">
      <Map
        center={center}
        zoom={zoom}
        onBoundsChanged={({ center, zoom }) => {
          setCenter(center);
          setZoom(zoom);
        }}
        onClick={handleClick}
        attribution={false}
      >
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            anchor={[pin.lat, pin.lng]}
            color={selectedPinId === pin.id ? "#0078d4" : "#ff4444"}
            onClick={() => handleMarkerClick(pin)}
          />
        ))}
      </Map>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 z-[999] flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="aero-panel glass-button p-2 hover:scale-105 transition-transform"
          aria-label="Zoom in"
        >
          <Plus className="w-5 h-5 text-gray-700" />
        </button>
        <button
          onClick={handleZoomOut}
          className="aero-panel glass-button p-2 hover:scale-105 transition-transform"
          aria-label="Zoom out"
        >
          <Minus className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Mobile Dialog */}
      {isMobile && selectedPin && (
        <Dialog
          open={!!selectedPin}
          onOpenChange={(open) => !open && handleClosePin()}
        >
          <DialogContent className="sm:max-w-[425px] max-w-[90%] aero-panel">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-base font-semibold text-gray-800 break-words pr-6">
                Pin Details
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                  {(selectedPin.author || "A")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800">
                    {selectedPin.author || "Anonymous"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(selectedPin.created_at).toLocaleDateString()} at{" "}
                    {new Date(selectedPin.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
                {selectedPin.text}
              </p>
              {selectedPin.image_url && (
                <a
                  href={selectedPin.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="text-sm text-blue-600 hover:text-blue-700 underline break-all bg-blue-50 border border-blue-200 p-2 rounded">
                    📎 {selectedPin.image_url}
                  </div>
                </a>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500 pt-3 border-t border-gray-200">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>
                  📍 {selectedPin.lat.toFixed(4)}, {selectedPin.lng.toFixed(4)}
                </span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Desktop Popup Card */}
      {!isMobile && selectedPin && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-md">
          <div className="aero-panel p-4 shadow-2xl">
            <button
              onClick={handleClosePin}
              className="absolute top-2 right-2 p-1 glass-button rounded-full hover:bg-gray-100"
              aria-label="Close"
            >
              <span className="text-lg font-semibold leading-none text-gray-600">
                ×
              </span>
            </button>

            <div className="flex gap-3 mb-3">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                {(selectedPin.author || "A")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800">
                  {selectedPin.author || "Anonymous"}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(selectedPin.created_at).toLocaleDateString()} at{" "}
                  {new Date(selectedPin.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed mb-3 break-words whitespace-pre-wrap">
              {selectedPin.text}
            </p>

            {selectedPin.image_url && (
              <a
                href={selectedPin.image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block mb-3"
              >
                <div className="text-sm text-blue-600 hover:text-blue-700 underline break-all bg-blue-50 border border-blue-200 p-2 rounded">
                  📎 {selectedPin.image_url}
                </div>
              </a>
            )}

            <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-200">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>
                📍 {selectedPin.lat.toFixed(4)}, {selectedPin.lng.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
