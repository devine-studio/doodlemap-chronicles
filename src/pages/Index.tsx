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
  text: string;
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
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["pins"],
      queryFn: async ({ pageParam = 0 }) => {
        const { data, error } = await supabase
          .from("pins")
          .select("*")
          .order("created_at", { ascending: false })
          .range(
            pageParam * PINS_PER_PAGE,
            (pageParam + 1) * PINS_PER_PAGE - 1
          );

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
    text: string;
    imageUrl?: string;
    author?: string;
    lat: number;
    lng: number;
  }) => {
    try {
      const { error } = await supabase.from("pins").insert({
        text: pinData.text,
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
    <div className="h-[100dvh] overflow-hidden flex flex-col relative">
      {/* Subtle gray background */}
      <div className="fixed inset-0 bg-blue-100 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col h-full max-w-[1600px] mx-auto w-full p-4 gap-4">
        {/* Header */}
        <header className="fade-in">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="">
                  <img
                    src="/win7world.png"
                    alt="logo"
                    className="w-14 h-14 drop-shadow-lg"
                  />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-blue-500 bg-clip-text text-transparent">
                    map.in
                  </h1>
                  <p className="text-sm text-gray-700 font-medium">
                    Qualquer um pode compartilhar.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 ">
                <Button
                  variant="default"
                  size="default"
                  onClick={handleUseMyLocation}
                  className="gap-2 hidden md:flex "
                >
                  <Navigation className="w-4 h-4" />
                  <span className="hidden sm:inline">Novo Pin</span>
                </Button>
                {/* <a
                  href="https://github.com/lemesvini"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
                  title="GitHub"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    className="w-6 h-6 text-gray-700"
                  >
                    <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.874 8.185 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.153-1.11-1.46-1.11-1.46-.908-.621.069-.609.069-.609 1.004.071 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.091-.647.35-1.088.635-1.34-2.221-.253-4.556-1.112-4.556-4.946 0-1.092.39-1.987 1.029-2.686-.104-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.52 9.52 0 0 1 2.504.336c1.91-1.296 2.748-1.026 2.748-1.026.545 1.378.203 2.397.1 2.65.64.699 1.028 1.594 1.028 2.686 0 3.842-2.338 4.69-4.566 4.938.359.309.678.92.678 1.857 0 1.34-.012 2.421-.012 2.75 0 .268.18.58.688.482C19.126 20.2 22 16.448 22 12.021 22 6.484 17.523 2 12 2z" />
                  </svg>
                </a> */}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Tabs */}
        <div className="lg:hidden flex-1 overflow-hidden fade-in">
          <Tabs defaultValue="map" className="h-full flex flex-col">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-1 mb-2">
              <TabsList className="grid w-full grid-cols-2 bg-transparent border-none w-full">
                <TabsTrigger value="map">Map</TabsTrigger>
                <TabsTrigger value="pins">Recent Pins</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="map" className="flex-1 mt-0 overflow-hidden">
              <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-5 h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-800">
                    World Map
                  </h2>
                </div>

                {isLoading ? (
                  <div className="w-full flex-1 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-sm text-gray-700 font-medium">
                      Loading map...
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-hidden rounded-2xl border border-gray-200">
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

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                  <span className="text-xs text-gray-600 font-medium">
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
              <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-5 h-full flex flex-col">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Recent Pins
                  </h2>
                  <span className="text-xs text-gray-600 font-medium">
                    {pins.length} total
                  </span>
                </div>

                <div className="flex-1 overflow-hidden rounded-2xl">
                  <div className="space-y-2 overflow-y-auto scrollbar-apple h-full">
                    {pins.map((pin) => (
                      <div
                        key={pin.id}
                        onClick={() => handlePinClick(pin.id)}
                        className="pin-card p-3 cursor-pointer bg-white"
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white font-semibold shadow-md">
                            {(pin.author || "A")[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-800 text-sm">
                                {pin.author || "Anonymous"}
                              </span>
                              <span className="text-xs text-gray-600">
                                ·{" "}
                                {new Date(pin.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 break-words whitespace-pre-wrap mb-2">
                              {pin.text}
                            </p>
                            {pin.image_url && (
                              <div className="text-xs text-blue-600 hover:text-blue-700 truncate">
                                📎 {pin.image_url}
                              </div>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                              <span className="flex items-center gap-1">
                                📍 {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {pins.length === 0 && !isLoading && (
                      <div className="text-sm text-gray-600 text-center py-8 font-medium">
                        No pins yet
                      </div>
                    )}
                    {isFetchingNextPage && (
                      <div className="text-sm text-gray-600 text-center py-4 font-medium">
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
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  World Map
                </h2>
                <span className="text-xs text-gray-600 font-medium">
                  {selectedLocation.lat.toFixed(4)},{" "}
                  {selectedLocation.lng.toFixed(4)}
                </span>
              </div>

              {isLoading ? (
                <div className="w-full flex-1 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-sm text-gray-700 font-medium">
                    Loading map...
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-hidden rounded-2xl border border-gray-200">
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

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <span className="text-xs text-gray-600 font-medium">
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
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">
                  Recent Pins
                </h2>
                <span className="text-sm text-gray-600 font-medium">
                  {pins.length} total
                </span>
              </div>
              <div className="flex-1 overflow-hidden rounded-2xl">
                <div className="space-y-3 overflow-y-auto scrollbar-apple h-full">
                  {pins.map((pin) => (
                    <div
                      key={pin.id}
                      onClick={() => handlePinClick(pin.id)}
                      className="pin-card p-4 cursor-pointer bg-white"
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                          {(pin.author || "A")[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="font-semibold text-gray-800">
                              {pin.author || "Anonymous"}
                            </span>
                            <span className="text-xs text-gray-600">
                              · {new Date(pin.created_at).toLocaleDateString()}{" "}
                              at{" "}
                              {new Date(pin.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 break-words whitespace-pre-wrap mb-2">
                            {pin.text}
                          </p>
                          {pin.image_url && (
                            <div className="text-xs text-blue-600 hover:text-blue-700 truncate">
                              📎 {pin.image_url}
                            </div>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              📍 {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {pins.length === 0 && !isLoading && (
                    <div className="text-sm text-gray-600 text-center py-8 font-medium">
                      No pins yet
                    </div>
                  )}
                  {isFetchingNextPage && (
                    <div className="text-sm text-gray-600 text-center py-4 font-medium">
                      Loading more...
                    </div>
                  )}
                  <div ref={observerTarget} className="h-4" />
                </div>
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
