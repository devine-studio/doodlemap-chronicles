import { useState } from "react";
import { Map, Marker } from "pigeon-maps";

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

// Dark tactical map provider with Stadia Maps API key
const darkMapProvider = (x: number, y: number, z: number) => {
  const apiKey = "2994038f-c0cf-4396-9944-8a50ef7eb90c";
  return `https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/${z}/${x}/${y}.png?api_key=${apiKey}`;
};

export const WorldMap = ({ pins, onMapClick }: WorldMapProps) => {
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);

  const handleClick = ({ latLng }: { latLng: [number, number] }) => {
    onMapClick(latLng[0], latLng[1]);
  };

  return (
    <div className="w-full h-full tactical-border bg-black overflow-hidden relative">
      {/* Dark themed map */}
      <Map
        defaultCenter={[20, 0]}
        defaultZoom={2}
        onClick={handleClick}
        dprs={[1, 2]}
        attribution={false}
        metaWheelZoom={true}
        twoFingerDrag={false}
        provider={darkMapProvider}
      >
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            anchor={[pin.lat, pin.lng]}
            color="#5EEAD4"
            onClick={() => setSelectedPin(pin)}
          />
        ))}
      </Map>

      {/* Tactical overlay corners */}
      <div className="absolute top-2 left-2 w-8 h-8 border-l-2 border-t-2 border-primary pointer-events-none"></div>
      <div className="absolute top-2 right-2 w-8 h-8 border-r-2 border-t-2 border-primary pointer-events-none"></div>
      <div className="absolute bottom-2 left-2 w-8 h-8 border-l-2 border-b-2 border-primary pointer-events-none"></div>
      <div className="absolute bottom-2 right-2 w-8 h-8 border-r-2 border-b-2 border-primary pointer-events-none"></div>

      {/* Crosshair center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="w-12 h-12 border border-primary/30 rounded-full"></div>
        <div className="absolute top-1/2 left-0 w-full h-px bg-primary/30"></div>
        <div className="absolute top-0 left-1/2 w-px h-full bg-primary/30"></div>
      </div>

      {/* Popup Card */}
      {selectedPin && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-md">
          <div className="tactical-panel p-4">
            <button
              onClick={() => setSelectedPin(null)}
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center hover:bg-primary/20 tactical-border rounded text-primary"
              aria-label="Fechar"
            >
              <span className="text-xl font-bold leading-none">×</span>
            </button>
            <div className="text-[10px] text-muted-foreground font-mono mb-2 uppercase">
              [ MARKER DATA ]
            </div>
            <h3 className="font-black text-lg mb-3 pr-8 text-primary uppercase">
              {selectedPin.title}
            </h3>
            {selectedPin.image_url && (
              // <img
              //   src={selectedPin.image_url}
              //   alt={selectedPin.title}
              //   className="w-full h-48 object-cover mb-3 tactical-border"
              // />
              <a
                href={selectedPin.image_url}
                target="_blank"
                rel="noopener noreferrer"
                className=""
              >
                <div className="text-sm mb-3 text-foreground truncate border border-primary/30 p-2">
                  <span className="text-primary">URL:</span>
                  <span className="text-primary underline">
                    {selectedPin.image_url}
                  </span>
                </div>
              </a>
            )}
            {selectedPin.message && (
              <p className="text-sm mb-3 text-foreground">
                {selectedPin.message}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono pt-2 border-t border-primary/30">
              <span className="text-primary">●</span>
              {new Date(selectedPin.created_at).toLocaleDateString("pt-BR")}
              {selectedPin.author && ` | ${selectedPin.author}`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
