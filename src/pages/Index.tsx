import { useState } from 'react';
import { WorldMap } from '@/components/WorldMap';
import { PinCard } from '@/components/PinCard';
import { CreatePinDialog } from '@/components/CreatePinDialog';
import { Button } from '@/components/ui/button';
import { MapPin, Plus } from 'lucide-react';

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

const Index = () => {
  const [pins, setPins] = useState<Pin[]>([
    {
      id: '1',
      lat: 40.7128,
      lng: -74.0060,
      title: 'Nova York é incrível!',
      message: 'Acabei de visitar a Estátua da Liberdade. Experiência única!',
      date: new Date().toISOString(),
      author: 'Maria',
    },
    {
      id: '2',
      lat: 48.8566,
      lng: 2.3522,
      title: 'Paris no outono',
      message: 'As folhas amarelas e a Torre Eiffel criando uma vista perfeita.',
      date: new Date().toISOString(),
    },
    {
      id: '3',
      lat: 35.6762,
      lng: 139.6503,
      title: 'Tóquio tech',
      message: 'A cidade mais futurista que já visitei!',
      date: new Date().toISOString(),
      author: 'João',
    },
  ]);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({ lat: 0, lng: 0 });

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    setDialogOpen(true);
  };

  const handleCreatePin = (pinData: Omit<Pin, 'id' | 'date'>) => {
    const newPin: Pin = {
      ...pinData,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    setPins([...pins, newPin]);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-3 brutalist-border brutalist-shadow">
              <MapPin className="w-8 h-8" strokeWidth={3} />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                PinMap World
              </h1>
              <p className="text-sm md:text-base text-muted-foreground font-bold mt-1">
                Marque sua história no mapa!
              </p>
            </div>
          </div>
          <Button 
            variant="accent" 
            size="lg"
            onClick={() => setDialogOpen(true)}
            className="gap-2"
          >
            <Plus className="w-5 h-5" strokeWidth={3} />
            Criar Pin
          </Button>
        </div>
      </header>

      {/* Map Section */}
      <section className="mb-8">
        <WorldMap pins={pins} onMapClick={handleMapClick} />
        <p className="text-sm text-muted-foreground mt-3 font-bold text-center">
          Clique no mapa para adicionar um novo pin!
        </p>
      </section>

      {/* Pins Gallery */}
      <section>
        <h2 className="text-3xl font-black mb-6 flex items-center gap-3">
          <div className="h-2 w-12 bg-secondary brutalist-border"></div>
          Pins Recentes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pins.slice().reverse().map((pin) => (
            <PinCard
              key={pin.id}
              title={pin.title}
              message={pin.message}
              imageUrl={pin.imageUrl}
              date={pin.date}
              author={pin.author}
            />
          ))}
        </div>
      </section>

      {/* Create Pin Dialog */}
      <CreatePinDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreatePin}
        lat={selectedLocation.lat}
        lng={selectedLocation.lng}
      />

      {/* Footer */}
      <footer className="mt-16 text-center">
        <div className="inline-block bg-primary px-6 py-3 brutalist-border brutalist-shadow">
          <p className="font-black text-sm">
            Feito com ❤️ para o mundo todo
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;