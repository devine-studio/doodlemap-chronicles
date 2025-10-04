import { useState, useEffect } from 'react';
import { WorldMap } from '@/components/WorldMap';
import { PinCard } from '@/components/PinCard';
import { CreatePinDialog } from '@/components/CreatePinDialog';
import { Button } from '@/components/ui/button';
import { MapPin, Plus, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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

const Index = () => {
  const [pins, setPins] = useState<Pin[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({ lat: 0, lng: 0 });
  const [loading, setLoading] = useState(true);

  // Load pins from database
  useEffect(() => {
    loadPins();
  }, []);

  // Setup realtime subscription for live updates
  useEffect(() => {
    const channel = supabase
      .channel('pins-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pins'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPins(current => [payload.new as Pin, ...current]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadPins = async () => {
    try {
      const { data, error } = await supabase
        .from('pins')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setPins(data || []);
    } catch (error) {
      console.error('Error loading pins:', error);
      toast.error('Erro ao carregar pins');
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    setDialogOpen(true);
  };

  const handleCreatePin = async (pinData: {
    title: string;
    message?: string;
    imageUrl?: string;
    author?: string;
    lat: number;
    lng: number;
  }) => {
    try {
      const { error } = await supabase
        .from('pins')
        .insert({
          lat: pinData.lat,
          lng: pinData.lng,
          title: pinData.title,
          message: pinData.message,
          image_url: pinData.imageUrl,
          author: pinData.author,
        });

      if (error) throw error;

      // Pin will be added via realtime subscription
      toast.success('Pin criado com sucesso!');
    } catch (error) {
      console.error('Error creating pin:', error);
      toast.error('Erro ao criar pin');
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não é suportada pelo seu navegador');
      return;
    }

    const loadingToast = toast.loading('Obtendo sua localização...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        toast.dismiss(loadingToast);
        const { latitude, longitude } = position.coords;
        setSelectedLocation({ lat: latitude, lng: longitude });
        setDialogOpen(true);
        toast.success('Localização obtida!');
      },
      (error) => {
        toast.dismiss(loadingToast);
        let errorMessage = 'Não foi possível obter sua localização';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permissão de localização negada. Por favor, habilite nas configurações do navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Informação de localização indisponível';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tempo esgotado ao tentar obter localização';
            break;
        }
        
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
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
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              size="lg"
              onClick={handleUseMyLocation}
              className="gap-2"
            >
              <Navigation className="w-5 h-5" strokeWidth={3} />
              Minha Localização
            </Button>
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
        
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground font-bold">Carregando pins...</p>
          </div>
        ) : pins.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground font-bold">
              Nenhum pin ainda. Seja o primeiro a marcar o mapa! 🗺️
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pins.map((pin) => (
              <PinCard
                key={pin.id}
                title={pin.title}
                message={pin.message}
                imageUrl={pin.image_url}
                date={pin.created_at}
                author={pin.author}
              />
            ))}
          </div>
        )}
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