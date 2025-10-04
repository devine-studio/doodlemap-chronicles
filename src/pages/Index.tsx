import { useState, useEffect } from "react";
import { WorldMap } from "@/components/WorldMap";
import { PinCard } from "@/components/PinCard";
import { CreatePinDialog } from "@/components/CreatePinDialog";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, Navigation } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Pin {
  id: string;
  lat: number;
  lng: number;
  title: string;
  message?: string;
  image_url?: string;
  created_at: string;
  author?: string;
}

const Index = () => {
  const [pins, setPins] = useState<Pin[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({ lat: 0, lng: 0 });
  const [loading, setLoading] = useState(true);

  // Fetch initial pins
  useEffect(() => {
    fetchPins();
  }, []);

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("pins-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pins",
        },
        (payload) => {
          const newPin = payload.new as Pin;
          setPins((current) => [newPin, ...current]);
          toast.success("Novo pin adicionado ao mapa!");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPins = async () => {
    try {
      const { data, error } = await supabase
        .from("pins")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPins(data || []);
    } catch (error) {
      console.error("Error fetching pins:", error);
      toast.error("Erro ao carregar pins");
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
      const { error } = await supabase.from("pins").insert({
        title: pinData.title,
        message: pinData.message,
        image_url: pinData.imageUrl,
        author: pinData.author,
        lat: pinData.lat,
        lng: pinData.lng,
      });

      if (error) throw error;

      toast.success("Pin criado com sucesso!");
    } catch (error) {
      console.error("Error creating pin:", error);
      toast.error("Erro ao criar pin");
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização não é suportada pelo seu navegador");
      return;
    }

    const loadingToast = toast.loading("Obtendo sua localização...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        toast.dismiss(loadingToast);
        const { latitude, longitude } = position.coords;
        setSelectedLocation({ lat: latitude, lng: longitude });
        setDialogOpen(true);
        toast.success("Localização obtida!");
      },
      (error) => {
        toast.dismiss(loadingToast);
        let errorMessage = "Não foi possível obter sua localização";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Permissão de localização negada. Por favor, habilite nas configurações do navegador.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Informação de localização indisponível";
            break;
          case error.TIMEOUT:
            errorMessage = "Tempo esgotado ao tentar obter localização";
            break;
        }

        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="h-[100dvh] bg-background tactical-grid-large scanline-effect overflow-hidden flex flex-col">
      {/* Tactical Grid Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent flicker"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent flicker"></div>
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-primary to-transparent flicker"></div>
        <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-primary to-transparent flicker"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full max-w-[2000px] mx-auto w-full">
        {/* Header */}
        <header className="hidden md:block p-4 md:p-6 pb-2 md:pb-3">
          <div className="tactical-panel p-4 md:p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-primary/20 p-3 tactical-border pulse-glow">
                  <MapPin className="w-8 h-8 text-primary" strokeWidth={2} />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black tracking-wider text-glow uppercase">
                    DOODLEMAP CHRONICLES
                  </h1>
                  <p className="text-xs md:text-sm text-muted-foreground font-mono mt-1">
                    [TACTICAL MAPPING INTERFACE v2.0]
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleUseMyLocation}
                  className="gap-2 tactical-border hover:bg-primary/10 glitch-hover"
                >
                  <Navigation className="w-5 h-5" />
                  <span className="hidden md:inline">LOCATE</span>
                </Button>
                {/* <Button
                  variant="default"
                  size="lg"
                  onClick={() => setDialogOpen(true)}
                  className="gap-2 bg-primary/20 hover:bg-primary/30 tactical-border text-primary glitch-hover"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden md:inline">NEW PIN</span>
                </Button> */}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 p-4 md:p-6 overflow-hidden">
          {/* Left Stats Panel */}
          <aside className="hidden md:block lg:col-span-3 flex flex-col overflow-hidden">
            <div className="flex flex-col gap-4 h-full overflow-hidden">
              {/* Status Panel */}
              <div className="tactical-panel p-4 flex-none">
                <h2 className="text-xs font-bold text-primary mb-4 uppercase tracking-wider border-b border-primary/30 pb-2">
                  [ System Status ]
                </h2>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-5xl font-black text-glow text-primary">
                      {pins.length}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                      Active Markers
                    </div>
                  </div>
                  {/* <div className="grid grid-cols-2 gap-3">
                    <div className="tactical-border p-2 text-center bg-primary/5">
                      <div className="text-2xl font-bold text-primary">
                        {loading ? "--" : "72"}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase">
                        Regions
                      </div>
                    </div>
                    <div className="tactical-border p-2 text-center bg-primary/5">
                      <div className="text-2xl font-bold text-primary">
                        {loading ? "--" : "45"}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase">
                        Countries
                      </div>
                    </div>
                  </div> */}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="tactical-panel  p-4 flex-1">
                <h2 className="text-xs font-bold text-primary mb-4 uppercase tracking-wider border-b border-primary/30 pb-2">
                  [ Recent Activity ]
                </h2>
                <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin">
                  {pins.slice(0, 10).map((pin, index) => (
                    <div
                      key={pin.id}
                      className="text-xs p-2 tactical-border bg-primary/5 hover:bg-primary/10 transition-colors"
                    >
                      <div className="text-primary font-mono truncate">
                        {String(index + 1).padStart(2, "0")}_ {pin.title}
                      </div>
                      <div className="text-muted-foreground text-[10px] mt-1">
                        {new Date(pin.created_at).toLocaleTimeString("pt-BR")}
                      </div>
                    </div>
                  ))}
                  {pins.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-4">
                      No activity detected
                    </div>
                  )}
                </div>
              </div>

              {/* Marker Database - Moved here */}
              {/* <div className="tactical-panel p-4 flex-1 flex flex-col overflow-hidden">
                <h2 className="text-xs font-bold text-primary mb-4 uppercase tracking-wider border-b border-primary/30 pb-2 flex items-center justify-between flex-none">
                  <span>[ Marker Database ]</span>
                  <span className="text-muted-foreground">
                    ENTRIES: {pins.length}
                  </span>
                </h2>
                {pins.length === 0 ? (
                  <div className="text-center py-8 tactical-border bg-primary/5 flex-1 flex flex-col items-center justify-center">
                    <div className="text-4xl mb-3 opacity-30">◈</div>
                    <p className="text-xs text-muted-foreground font-mono">
                      NO MARKERS DEPLOYED
                      <br />
                      <span className="text-[10px]">
                        INITIALIZE FIRST MARKER TO BEGIN_
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto flex-1 pr-2 scrollbar-thin">
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
              </div> */}
            </div>
          </aside>

          {/* Center Map */}
          <main className="lg:col-span-9 flex flex-col overflow-hidden">
            {/* Map Container */}
            <div className="tactical-panel p-2 flex-1 flex flex-col overflow-hidden">
              <div className="border-b border-primary/30 px-2 py-1 mb-2 flex items-center justify-between flex-none">
                <span className="text-xs text-primary font-mono uppercase">
                  [ Global Tactical Map ]
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  LAT: {selectedLocation.lat.toFixed(4)} | LNG:{" "}
                  {selectedLocation.lng.toFixed(4)}
                </span>
              </div>
              {loading ? (
                <div className="w-full flex-1 bg-background tactical-border flex flex-col items-center justify-center">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="font-mono text-sm text-primary">
                    INITIALIZING MAP...
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-hidden">
                  <WorldMap
                    pins={pins.map((pin) => ({
                      ...pin,
                      imageUrl: pin.image_url,
                      date: pin.created_at,
                    }))}
                    onMapClick={handleMapClick}
                  />
                </div>
              )}
              <div className="flex flex-row items-center justify-between mt-2 px-2 py-1 text-[10px] text-muted-foreground font-mono text-center flex-none">
                &gt; CLICK MAP TO DEPLOY NEW MARKER_
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleUseMyLocation}
                  className="gap-2 h-6 tactical-border hover:bg-primary/10 glitch-hover"
                >
                  <Navigation className="w-5 h-5" />
                  {/* <span className="hidden md:inline">LOCATE</span> */}
                </Button>
              </div>
            </div>
          </main>
        </div>

        {/* Create Pin Dialog */}
        <CreatePinDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={handleCreatePin}
          lat={selectedLocation.lat}
          lng={selectedLocation.lng}
        />
      </div>
    </div>
  );
};

export default Index;
