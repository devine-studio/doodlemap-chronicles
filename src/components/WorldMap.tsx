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
          className="w-11 h-11 flex items-center justify-center bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl hover:scale-105 transition-all"
          aria-label="Zoom in"
        >
          <Plus className="w-5 h-5 text-gray-800" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-11 h-11 flex items-center justify-center bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl hover:scale-105 transition-all"
          aria-label="Zoom out"
        >
          <Minus className="w-5 h-5 text-gray-800" />
        </button>
      </div>

      {/* Mobile Dialog */}
      {isMobile && selectedPin && (
        <Dialog
          open={!!selectedPin}
          onOpenChange={(open) => !open && handleClosePin()}
        >
          <DialogContent className="sm:max-w-[425px] max-w-[90%] glass-card">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-base font-semibold text-gray-800 break-words pr-6">
                Pin Details
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-md">
                  {(selectedPin.author || "A")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800">
                    {selectedPin.author || "Anonymous"}
                  </div>
                  <div className="text-xs text-gray-600">
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
                  <div className="text-sm text-blue-600 hover:text-blue-700 underline break-all bg-blue-50 border border-blue-200 p-2 rounded-xl flex items-center gap-1">
                    <svg
                      className="inline-block w-3.5 h-3.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span>{selectedPin.image_url}</span>
                  </div>
                </a>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-600 pt-3 border-t border-gray-200">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
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
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Desktop Popup Card */}
      {!isMobile && selectedPin && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-5">
            <button
              onClick={handleClosePin}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <span className="text-2xl font-semibold leading-none text-gray-600">
                ×
              </span>
            </button>

            <div className="flex gap-3 mb-3">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg shadow-lg">
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
                <div className="text-sm text-blue-600 hover:text-blue-700 underline break-all bg-blue-50 border border-blue-200 p-2 rounded-xl flex items-center gap-1">
                  <svg
                    className="inline-block w-3.5 h-3.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span>{selectedPin.image_url}</span>
                </div>
              </a>
            )}

            <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-200">
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
          </div>
        </div>
      )}
    </div>
  );
};
