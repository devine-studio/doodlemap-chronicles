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
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);

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
          toast.success("New pin added to map!");
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
      toast.error("Error loading pins");
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

      toast.success("Pin created successfully!");
    } catch (error) {
      console.error("Error creating pin:", error);
      toast.error("Error creating pin");
    }
  };

  const handlePinClick = (pinId: string) => {
    setSelectedPinId(pinId);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    const loadingToast = toast.loading("Getting your location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        toast.dismiss(loadingToast);
        const { latitude, longitude } = position.coords;
        setSelectedLocation({ lat: latitude, lng: longitude });
        setDialogOpen(true);
        toast.success("Location obtained!");
      },
      (error) => {
        toast.dismiss(loadingToast);
        let errorMessage = "Could not get your location";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Location permission denied. Please enable it in browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
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
    <div className="h-[100dvh] bg-gradient-to-b from-blue-100 to-blue-50 overflow-hidden flex flex-col">
      {/* Windows 7 desktop background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-400/20 via-blue-300/10 to-blue-200/20 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col h-full max-w-[1600px] mx-auto w-full p-4 gap-4">
        {/* Header Window */}
        <header className="fade-in">
          <div className="aero-glass p-4 shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="">
                  {/* <MapPin className="w-7 h-7 text-white" strokeWidth={2.5} />
                   */}
                  <img src="/win7world.png" alt="logo" className="w-16 h-16" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold font-sans italic text-blue-800">
                    mapin
                  </h1>
                  <p className="text-xs text-blue-500">
                    Qualquer um pode compartilhar.{" "}
                    {/* <a
                      href="https://lemesvini.com"
                      target="_blank"
                      className="text-blue-600 underline"
                    >
                      lemesvini.
                    </a> */}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 hidden sm:inline">
                <Button
                  variant="secondary"
                  size="default"
                  onClick={handleUseMyLocation}
                  className="gap-2 "
                >
                  <Navigation className="w-4 h-4" />
                  <span className="hidden sm:inline">Minha Localização</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-4 overflow-hidden">
          {/* Mobile Recent Pins - Top Half */}
          <div className="lg:hidden flex flex-col h-[40%] overflow-hidden fade-in">
            <div className="aero-panel p-3 flex-1 flex flex-col overflow-hidden shadow-md">
              {/* Window title bar */}
              <div className="window-chrome px-3 py-2 mb-2 flex items-center justify-between -mt-3 -mx-3 rounded-t-md">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400 border border-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400 border border-green-500"></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-800 ml-2">
                    Recent Pins
                  </span>
                </div>
                <span className="text-xs text-gray-600">
                  {pins.length} total
                </span>
              </div>

              <div className="flex-1 overflow-hidden rounded-md border border-gray-300 bg-white">
                <div className="space-y-2 overflow-y-auto scrollbar-win7 h-full p-2">
                  {pins.slice(0, 10).map((pin) => (
                    <button
                      key={pin.id}
                      onClick={() => handlePinClick(pin.id)}
                      className="w-full text-xs p-2 bg-white rounded border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer text-left"
                    >
                      <div className="text-gray-700 font-bold truncate">
                        {pin.title}
                      </div>
                      <div className="text-gray-500 text-[10px] mt-1">
                        {new Date(pin.created_at).toLocaleString()}
                      </div>
                      <div className="text-gray-400 font-medium truncate">
                        by: {pin.author ? pin.author : "Anonymous"}
                      </div>
                    </button>
                  ))}
                  {pins.length === 0 && (
                    <div className="text-xs text-gray-500 text-center py-8">
                      No pins yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Left Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 flex flex-col overflow-hidden fade-in">
            <div className="flex flex-col gap-4 h-full overflow-hidden">
              {/* Stats Panel */}
              <div className="aero-panel p-4 shadow-md">
                <h2 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-300">
                  Statistics
                </h2>
                <div className="space-y-3">
                  <div className="text-center bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="text-4xl font-bold text-blue-600">
                      {pins.length}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Total Pins</div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="aero-panel p-4 flex-1 overflow-hidden shadow-md">
                <h2 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-300">
                  Recent Pins
                </h2>
                <div className="space-y-2 overflow-y-auto scrollbar-win7 h-full pr-2">
                  {pins.slice(0, 10).map((pin, index) => (
                    <button
                      key={pin.id}
                      onClick={() => handlePinClick(pin.id)}
                      className="w-full text-xs p-2 bg-white rounded border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer text-left"
                    >
                      <div className="text-gray-700 font-bold truncate">
                        {pin.title}
                      </div>
                      <div className="text-gray-500 text-[10px] mt-1">
                        {new Date(pin.created_at).toLocaleString()}
                      </div>
                      <div className="text-gray-400 font-medium truncate">
                        by: {pin.author ? pin.author : "Anonymous"}
                      </div>
                    </button>
                  ))}
                  {pins.length === 0 && (
                    <div className="text-xs text-gray-500 text-center py-8">
                      No pins yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Map Window - Mobile Bottom Half, Desktop Right Side */}
          <main className="flex-1 lg:col-span-9 flex flex-col overflow-hidden fade-in">
            <div className="aero-panel p-3 flex-1 flex flex-col overflow-hidden shadow-lg">
              {/* Window title bar */}
              <div className="window-chrome px-3 py-2 mb-2 flex items-center justify-between -mt-3 -mx-3 rounded-t-md">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400 border border-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400 border border-green-500"></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-800 ml-2">
                    World Map
                  </span>
                </div>
                <span className="text-xs text-gray-600">
                  {selectedLocation.lat.toFixed(4)},{" "}
                  {selectedLocation.lng.toFixed(4)}
                </span>
              </div>

              {loading ? (
                <div className="w-full flex-1 bg-white rounded-md border border-gray-300 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-sm text-gray-600">Loading map...</p>
                </div>
              ) : (
                <div className="flex-1 overflow-hidden rounded-md border border-gray-300">
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

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-600">
                  {/* <span className="sm:hidden">
                    Memories. Pinned. By{" "}
                    <a
                      href="https://lemesvini.com"
                      target="_blank"
                      className="text-blue-600 underline"
                    >
                      lemesvini
                    </a>
                  </span> */}
                  <span className="">Click on the map to add a new pin</span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUseMyLocation}
                  className="gap-1"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Minha Localização</span>
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
