import { useState, useEffect, useRef, useCallback } from "react";
import { WorldMap } from "@/components/WorldMap";
import { PinCard } from "@/components/PinCard";
import { CreatePinDialog } from "@/components/CreatePinDialog";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, Navigation } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const PINS_PER_PAGE = 20;

const Index = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({ lat: 0, lng: 0 });
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Infinite query for pins
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["pins"],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase
        .from("pins")
        .select("*")
        .order("created_at", { ascending: false })
        .range(pageParam * PINS_PER_PAGE, (pageParam + 1) * PINS_PER_PAGE - 1);

      if (error) throw error;
      return data || [];
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === PINS_PER_PAGE ? allPages.length : undefined;
    },
    initialPageParam: 0,
  });

  const pins = data?.pages.flat() || [];

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
          toast.success("New pin added to map!");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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
                  <img src="/win7world.png" alt="logo" className="w-16 h-16" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold font-sans italic text-blue-800">
                    mapin
                  </h1>
                  <p className="text-xs text-blue-500">
                    Qualquer um pode compartilhar.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 hidden sm:inline">
                <Button
                  variant="secondary"
                  size="default"
                  onClick={handleUseMyLocation}
                  className="gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  <span className="hidden sm:inline">Minha Localização</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Tabs */}
        <div className="lg:hidden flex-1 overflow-hidden fade-in">
          <Tabs defaultValue="map" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mb-2">
              <TabsTrigger value="map">Map</TabsTrigger>
              <TabsTrigger value="pins">Recent Pins</TabsTrigger>
            </TabsList>
            
            <TabsContent value="map" className="flex-1 mt-0 overflow-hidden">
              <div className="aero-panel p-3 h-full flex flex-col overflow-hidden shadow-lg">
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
                </div>

                {isLoading ? (
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
                    Click to add a pin
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUseMyLocation}
                    className="gap-1"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>My Location</span>
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pins" className="flex-1 mt-0 overflow-hidden">
              <div className="aero-panel p-3 h-full flex flex-col overflow-hidden shadow-md">
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
                    {pins.map((pin) => (
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
                    {pins.length === 0 && !isLoading && (
                      <div className="text-xs text-gray-500 text-center py-8">
                        No pins yet
                      </div>
                    )}
                    {isFetchingNextPage && (
                      <div className="text-xs text-gray-500 text-center py-4">
                        Loading more...
                      </div>
                    )}
                    <div ref={observerTarget} className="h-4" />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex flex-1 gap-4 overflow-hidden fade-in">
          {/* Map - Left 1/3 */}
          <div className="w-1/3 flex flex-col overflow-hidden">
            <div className="aero-panel p-3 flex-1 flex flex-col overflow-hidden shadow-lg">
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

              {isLoading ? (
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
                  Click on the map to add a new pin
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
          </div>

          {/* Recent Pins - Right 2/3 */}
          <div className="w-2/3 flex flex-col overflow-hidden">
            <div className="aero-panel p-4 flex-1 overflow-hidden shadow-md">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-300">
                Recent Pins ({pins.length} total)
              </h2>
              <div className="space-y-2 overflow-y-auto scrollbar-win7 h-full pr-2">
                {pins.map((pin) => (
                  <button
                    key={pin.id}
                    onClick={() => handlePinClick(pin.id)}
                    className="w-full text-sm p-3 bg-white rounded border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer text-left"
                  >
                    <div className="text-gray-700 font-bold truncate">
                      {pin.title}
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      {new Date(pin.created_at).toLocaleString()}
                    </div>
                    <div className="text-gray-400 font-medium truncate text-xs">
                      by: {pin.author ? pin.author : "Anonymous"}
                    </div>
                  </button>
                ))}
                {pins.length === 0 && !isLoading && (
                  <div className="text-sm text-gray-500 text-center py-8">
                    No pins yet
                  </div>
                )}
                {isFetchingNextPage && (
                  <div className="text-sm text-gray-500 text-center py-4">
                    Loading more...
                  </div>
                )}
                <div ref={observerTarget} className="h-4" />
              </div>
            </div>
          </div>
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
