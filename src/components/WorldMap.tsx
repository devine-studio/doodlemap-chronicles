import { useMapEvents } from 'react-leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Pin {
  id: string;
  lat: number;
  lng: number;
  title: string;
  message?: string;
  imageUrl?: string;
  date: string;
  author?: string;
}

interface WorldMapProps {
  pins: Pin[];
  onMapClick: (lat: number, lng: number) => void;
}

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  
  return null;
}

export const WorldMap = ({ pins, onMapClick }: WorldMapProps) => {
  const center: [number, number] = [20, 0];
  
  return (
    <div className="w-full h-[600px] brutalist-border brutalist-shadow bg-background overflow-hidden">
      <MapContainer
        center={center}
        zoom={2}
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{ background: '#ffffff' }}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
        <MapClickHandler onClick={onMapClick} />
        {pins.map((pin) => {
          const position: [number, number] = [pin.lat, pin.lng];
          return (
            <Marker key={pin.id} position={position}>
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-bold text-lg mb-2">{pin.title}</h3>
                  {pin.message && <p className="mb-2 text-sm">{pin.message}</p>}
                  {pin.imageUrl && (
                    <img 
                      src={pin.imageUrl} 
                      alt={pin.title}
                      className="w-full h-32 object-cover mb-2 brutalist-border"
                    />
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(pin.date).toLocaleDateString()}
                    {pin.author && ` • ${pin.author}`}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};