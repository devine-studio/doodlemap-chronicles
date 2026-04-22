import { useState } from "react";
import { WorldMap } from "@/components/WorldMap";
import { usePinsQuery } from "@/hooks/usePinsQuery";

const MobileMap = () => {
  const { pins, isLoading } = usePinsQuery();
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);

  const handleMapClick = (lat: number, lng: number) => {
    console.log("Map clicked at:", lat, lng);
  };

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-white">
      {isLoading ? (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm text-[var(--foreground)] font-medium">
            Loading map...
          </p>
        </div>
      ) : (
        <div className="h-full w-full overflow-hidden">
          <WorldMap
            pins={pins.map((pin) => ({
              ...pin,
              imageUrl: pin.image_url,
              date: pin.created_at,
            }))}
            onMapClick={handleMapClick}
            selectedPinId={selectedPinId}
            onPinSelect={(pin) => setSelectedPinId(pin?.id || null)}
          />
        </div>
      )}
    </div>
  );
};

export default MobileMap;
