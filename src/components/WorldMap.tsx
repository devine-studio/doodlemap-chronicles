import { useState, useEffect } from "react";
import { Map, Marker } from "pigeon-maps";
import { Plus, Minus } from "lucide-react";

interface Pin {
  id: string;
  lat: number;
  lng: number;
  title: string;
  message?: string;
  image_url?: string;
  author?: string;
  created_at: string;
}

interface WorldMapProps {
  pins: Pin[];
  onMapClick: (lat: number, lng: number) => void;
  onPinSelect?: (pin: Pin | null) => void;
  selectedPinId?: string | null;
}

export const WorldMap = ({
  pins,
  onMapClick,
  onPinSelect,
  selectedPinId,
}: WorldMapProps) => {
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [zoom, setZoom] = useState(2);
  const [center, setCenter] = useState<[number, number]>([20, 0]);

  const handleClick = ({ latLng }: { latLng: [number, number] }) => {
    onMapClick(latLng[0], latLng[1]);
  };

  // Handle external pin selection
  useEffect(() => {
    if (selectedPinId) {
      const pin = pins.find((p) => p.id === selectedPinId);
      if (pin) {
        setSelectedPin(pin);
        setCenter([pin.lat, pin.lng]);
        setZoom(15);
      }
    }
  }, [selectedPinId, pins]);

  const handlePinClick = (pin: Pin) => {
    setSelectedPin(pin);
    if (onPinSelect) {
      onPinSelect(pin);
    }
  };

  const handleClosePin = () => {
    setSelectedPin(null);
    if (onPinSelect) {
      onPinSelect(null);
    }
  };

  return (
    <div className="w-full h-full bg-white overflow-hidden relative">
      <Map
        center={center}
        zoom={zoom}
        onBoundsChanged={({ center, zoom }) => {
          setCenter(center);
          setZoom(zoom);
        }}
        onClick={handleClick}
        dprs={[1, 2]}
        attribution={false}
        metaWheelZoom={true}
        twoFingerDrag={false}
      >
        {pins.map((pin) => {
          const isSelected = selectedPin?.id === pin.id;
          return (
            <Marker
              key={pin.id}
              anchor={[pin.lat, pin.lng]}
              color={isSelected ? "#EF4444" : "#0078D7"}
              width={40}
              onClick={() => handlePinClick(pin)}
            />
          );
        })}
      </Map>

      {/* Popup Card */}
      {selectedPin && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-md">
          <div className="aero-panel p-4 shadow-2xl">
            <button
              onClick={handleClosePin}
              className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center glass-button rounded hover:bg-red-100 text-gray-700"
              aria-label="Close"
            >
              <span className="text-lg font-semibold leading-none">×</span>
            </button>
            <div className="text-xs text-gray-600 mb-2 font-medium">
              Pin Details
            </div>
            <h3 className="font-semibold text-base mb-3 pr-8 text-gray-800">
              {selectedPin.title}
            </h3>
            {selectedPin.image_url && (
              <a
                href={selectedPin.image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block mb-3"
              >
                <div className="text-sm text-blue-600 hover:text-blue-700 underline truncate bg-blue-50 border border-blue-200 p-2 rounded">
                  {selectedPin.image_url}
                </div>
              </a>
            )}
            {selectedPin.message && (
              <p className="text-sm mb-3 text-gray-700">
                {selectedPin.message}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-200">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              {new Date(selectedPin.created_at).toLocaleDateString()}
              {selectedPin.author && ` • ${selectedPin.author}`}
            </div>
          </div>
        </div>
      )}

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={() => setZoom(Math.min(zoom + 1, 18))}
          className="w-10 h-10 flex items-center justify-center aero-panel glass-button hover:bg-blue-50 text-gray-700 shadow-lg"
          aria-label="Zoom in"
        >
          <Plus className="w-5 h-5" />
        </button>
        <button
          onClick={() => setZoom(Math.max(zoom - 1, 1))}
          className="w-10 h-10 flex items-center justify-center aero-panel glass-button hover:bg-blue-50 text-gray-700 shadow-lg"
          aria-label="Zoom out"
        >
          <Minus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
