import { useState } from 'react';
import { Map, Marker } from 'pigeon-maps';

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
}

export const WorldMap = ({ pins, onMapClick }: WorldMapProps) => {
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);

  const handleClick = ({ latLng }: { latLng: [number, number] }) => {
    onMapClick(latLng[0], latLng[1]);
  };

  return (
    <div className="w-full h-[600px] brutalist-border brutalist-shadow bg-background overflow-hidden relative">
      <Map
        height={600}
        defaultCenter={[20, 0]}
        defaultZoom={2}
        onClick={handleClick}
      >
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            anchor={[pin.lat, pin.lng]}
            color="#FFEE00"
            onClick={() => setSelectedPin(pin)}
          />
        ))}
      </Map>

      {/* Popup Card */}
      {selectedPin && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-md">
          <div className="bg-background brutalist-border brutalist-shadow p-4">
            <button
              onClick={() => setSelectedPin(null)}
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center hover:bg-muted rounded"
              aria-label="Fechar"
            >
              <span className="text-2xl font-black leading-none">×</span>
            </button>
            <h3 className="font-black text-xl mb-2 pr-8">{selectedPin.title}</h3>
            {selectedPin.image_url && (
              <img
                src={selectedPin.image_url}
                alt={selectedPin.title}
                className="w-full h-48 object-cover mb-3 brutalist-border"
              />
            )}
            {selectedPin.message && (
              <p className="text-sm mb-3">{selectedPin.message}</p>
            )}
            <p className="text-xs text-muted-foreground font-bold">
              {new Date(selectedPin.created_at).toLocaleDateString('pt-BR')}
              {selectedPin.author && ` • ${selectedPin.author}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};