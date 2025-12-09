import {
  useState,
  useEffect,
  useRef,
  useCallback,
  TouchEvent as ReactTouchEvent,
} from "react";
import { WorldMap } from "@/components/WorldMap";
import { PinCard } from "@/components/PinCard";
import { CreatePinDialog } from "@/components/CreatePinDialog";
import { PinLikeButton } from "@/components/PinLikeButton";
import { PinComments } from "@/components/PinComments";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { NeuCard } from "@/components/ui/NeuCard";
import { NeuCardReversed } from "@/components/ui/NeuCardReversed";
import {
  MapPin,
  Plus,
  Navigation,
  Eye,
  ArrowBigLeftDashIcon,
  ArrowBigRightDashIcon,
} from "lucide-react";
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
  like_count?: number;
  comment_count?: number;
}

const PINS_PER_PAGE = 100;

const Index = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({ lat: 0, lng: 0 });
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("map");
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set()
  );
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [showPins, setShowPins] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Infinite query for pins with likes and comments counts
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["pins"],
    queryFn: async ({ pageParam = 0 }) => {
      const { data: pinsData, error } = await supabase
        .from("pins")
        .select("*")
        .order("created_at", { ascending: false })
        .range(pageParam * PINS_PER_PAGE, (pageParam + 1) * PINS_PER_PAGE - 1);

      if (error) throw error;

      // Fetch like and comment counts for each pin
      const pinsWithCounts = await Promise.all(
        (pinsData || []).map(async (pin) => {
          const [{ count: likeCount }, { count: commentCount }] =
            await Promise.all([
              supabase
                .from("likes")
                .select("*", { count: "exact", head: true })
                .eq("pin_id", pin.id),
              supabase
                .from("comments")
                .select("*", { count: "exact", head: true })
                .eq("pin_id", pin.id),
            ]);

          return {
            ...pin,
            like_count: likeCount || 0,
            comment_count: commentCount || 0,
          };
        })
      );

      return pinsWithCounts;
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

  // Callback ref for intersection observer
  const lastPinElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading) return;
      if (isFetchingNextPage) return;

      // Disconnect previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      // Create new observer
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage) {
            console.log("Intersection detected, fetching next page...");
            fetchNextPage();
          }
        },
        {
          threshold: 0.1,
          rootMargin: "200px",
        }
      );

      // Observe the new node
      if (node) {
        observerRef.current.observe(node);
        console.log("Observer attached to last pin element");
      }
    },
    [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]
  );

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
    setActiveTab("map");
  };

  const toggleComments = (pinId: string) => {
    setExpandedComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pinId)) {
        newSet.delete(pinId);
      } else {
        newSet.add(pinId);
      }
      return newSet;
    });
  };

  const handleCommentAdded = (pinId: string) => {
    // Refetch the pins data to update comment counts
    refetch();
  };

  const handleLikeAdded = () => {
    // Refetch the pins data to update like counts
    refetch();
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
      {/* Subtle background */}
      <div className="fixed inset-0 bg-background pointer-events-none"></div>

      <div className="relative z-10 flex flex-col h-full w-full">
        {/* Mobile Layout - Full screen map */}
        <div className="lg:hidden flex-1 flex flex-col h-full">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="h-full flex flex-col"
          >
            {/* Floating tab switcher */}
            <div className="absolute top-4 left-4 right-4 z-20">
              <div className="bg-white/80 rounded-2xl p-1">
                <TabsList className="grid w-full grid-cols-2 bg-transparent border-none gap-2">
                  <TabsTrigger
                    value="map"
                    className="neu-button rounded-xl data-[state=active]:neu-pressed"
                  >
                    Mapa
                  </TabsTrigger>
                  <TabsTrigger
                    value="pins"
                    className="neu-button rounded-xl data-[state=active]:neu-pressed"
                  >
                    Pins Recentes
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent
              value="map"
              className="flex-1 mt-0 h-full"
              forceMount
              style={{ display: activeTab === "map" ? "block" : "none" }}
            >
              {/* Map takes full screen with neu-card styling */}
              <div className="h-full relative">
                {isLoading ? (
                  <div className="w-full h-full neu-raised flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-sm text-[var(--foreground)] font-medium">
                      Loading map...
                    </p>
                  </div>
                ) : (
                  <div className="h-full neu-raised rounded-none overflow-hidden">
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

                {/* Floating action button for location */}
                <div className="absolute bottom-6 right-4 z-20">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUseMyLocation}
                    className="neu-card rounded-full p-3 h-auto"
                  >
                    <Navigation className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="pins"
              className="flex-1 mt-0 overflow-hidden p-4 pt-20"
            >
              <NeuCard className="p-4 h-full flex flex-col">
                <div className="flex-1 overflow-hidden rounded-2xl">
                  <div className="space-y-2 overflow-y-auto scrollbar-apple h-full">
                    {pins.map((pin, index) => (
                      <div
                        key={pin.id}
                        ref={
                          pins.length === index + 1 ? lastPinElementRef : null
                        }
                        onClick={() => handlePinClick(pin.id)}
                        onTouchStart={(e) => {
                          const touch = e.touches[0];
                          touchStartRef.current = {
                            x: touch.clientX,
                            y: touch.clientY,
                          };
                        }}
                        onTouchEnd={(e) => {
                          // Ignore if clicking on a button
                          const target = e.target as HTMLElement;
                          if (target.closest("button")) return;

                          // Check if this was a tap (not a scroll)
                          if (touchStartRef.current) {
                            const touch = e.changedTouches[0];
                            const dx = Math.abs(
                              touch.clientX - touchStartRef.current.x
                            );
                            const dy = Math.abs(
                              touch.clientY - touchStartRef.current.y
                            );
                            // If movement is less than 10px, treat as tap
                            if (dx < 10 && dy < 10) {
                              e.preventDefault();
                              handlePinClick(pin.id);
                            }
                          }
                          touchStartRef.current = null;
                        }}
                        className="pin-card p-3 cursor-pointer active:bg-muted/50"
                        role="button"
                        tabIndex={0}
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold shadow-md">
                            {(pin.author || "A")[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-foreground text-sm">
                                {pin.author || "Anonymous"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ·{" "}
                                {new Date(pin.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-foreground break-words whitespace-pre-wrap mb-2">
                              {pin.text}
                            </p>
                            {pin.image_url && (
                              <div className="mt-2 rounded-xl overflow-hidden border border-[var(--border)]">
                                <img
                                  src={pin.image_url}
                                  alt="Pin image"
                                  className="w-full h-40 object-cover"
                                  loading="lazy"
                                />
                              </div>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <svg
                                  className="inline-block w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                </svg>
                                {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
                              </span>
                            </div>
                            <div className="mt-2">
                              <div className="flex items-center gap-4">
                                <PinLikeButton
                                  pinId={pin.id}
                                  initialLikeCount={pin.like_count || 0}
                                  onLikeAdded={handleLikeAdded}
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleComments(pin.id);
                                  }}
                                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                  </svg>
                                  <span className="font-medium">
                                    {pin.comment_count || 0}
                                  </span>
                                </button>
                              </div>
                              <PinComments
                                pinId={pin.id}
                                initialCommentCount={pin.comment_count || 0}
                                showComments={expandedComments.has(pin.id)}
                                onToggleComments={() => toggleComments(pin.id)}
                                onCommentAdded={() =>
                                  handleCommentAdded(pin.id)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {pins.length === 0 && !isLoading && (
                      <div className="text-sm text-muted-foreground text-center py-8 font-medium">
                        No pins yet
                      </div>
                    )}
                    {isFetchingNextPage && (
                      <div className="text-sm text-[var(--muted-foreground)] text-center py-4 font-medium">
                        Loading more...
                      </div>
                    )}
                  </div>
                </div>
              </NeuCard>
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop Layout - Similar to mobile with floating buttons */}
        <div className="hidden lg:flex flex-1 h-full relative">
          {/* Full screen map */}
          <div className="h-full w-full relative">
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

            {/* Floating button at the top to toggle pins panel */}
            <div className="absolute top-4 right-4 z-20">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPins(!showPins)}
                className="bg-white rounded-full p-3 h-auto gap-2"
              >
                {showPins ? (
                  <ArrowBigRightDashIcon className="w-5 h-5" />
                ) : (
                  <>
                    <MapPin className="w-5 h-5" />
                    <span className="hidden xl:inline">Ver Pins</span>
                  </>
                )}
              </Button>
            </div>

            {/* Floating action button for location at the bottom */}
            <div className="absolute bottom-6 right-4 z-20">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUseMyLocation}
                className="bg-white rounded-full p-3 h-auto gap-2"
              >
                <Navigation className="w-5 h-5" />
                <span className="hidden xl:inline">Minha Localização</span>
              </Button>
            </div>
          </div>

          {/* Sliding Pins Panel */}
          {showPins && (
            <div className="absolute top-0 right-0 h-full w-[400px] xl:w-[500px] z-30 p-4 pl-0">
              <div className="h-full flex flex-col bg-white rounded-l-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border)]">
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">
                    Pins Recentes
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPins(false)}
                    className="neu-button rounded-full p-2 h-auto"
                  >
                    <ArrowBigRightDashIcon className="w-5 h-5" />
                  </Button>
                </div>
                <div className="flex-1 overflow-hidden rounded-2xl">
                  <div className="space-y-4 overflow-y-auto scrollbar-apple h-full pr-2 py-2">
                    {pins.map((pin, index) => (
                      <div
                        key={pin.id}
                        ref={
                          pins.length === index + 1 ? lastPinElementRef : null
                        }
                        onClick={() => {
                          handlePinClick(pin.id);
                        }}
                        className="p-4 border border-black/20 rounded-lg cursor-pointer"
                      >
                        <div className="flex gap-3">
                          {/* <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold text-lg shadow-lg">
                            {(pin.author || "A")[0].toUpperCase()}
                          </div> */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="font-semibold text-foreground">
                                {pin.author || "Anonymous"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ·{" "}
                                {new Date(pin.created_at).toLocaleDateString()}{" "}
                                at{" "}
                                {new Date(pin.created_at).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                            </div>
                            <p className="text-sm text-foreground break-words whitespace-pre-wrap mb-2">
                              {pin.text}
                            </p>
                            {pin.image_url && (
                              <div className="mt-2 rounded-xl overflow-hidden border border-[var(--border)]">
                                <img
                                  src={pin.image_url}
                                  alt="Pin image"
                                  className="w-full h-40 object-cover"
                                  loading="lazy"
                                />
                              </div>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <svg
                                  className="inline-block w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                </svg>
                                {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
                              </span>
                            </div>
                            <div className="mt-2">
                              <div className="flex items-center gap-4">
                                <PinLikeButton
                                  pinId={pin.id}
                                  initialLikeCount={pin.like_count || 0}
                                  onLikeAdded={handleLikeAdded}
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleComments(pin.id);
                                  }}
                                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                  </svg>
                                  <span className="font-medium">
                                    {pin.comment_count || 0}
                                  </span>
                                </button>
                              </div>
                              <PinComments
                                pinId={pin.id}
                                initialCommentCount={pin.comment_count || 0}
                                showComments={expandedComments.has(pin.id)}
                                onToggleComments={() => toggleComments(pin.id)}
                                onCommentAdded={() =>
                                  handleCommentAdded(pin.id)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {pins.length === 0 && !isLoading && (
                      <div className="text-sm text-muted-foreground text-center py-8 font-medium">
                        No pins yet
                      </div>
                    )}
                    {isFetchingNextPage && (
                      <div className="text-sm text-[var(--muted-foreground)] text-center py-4 font-medium">
                        Loading more...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
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
