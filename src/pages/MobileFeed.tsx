import { useState } from "react";
import { PinsFeed } from "@/components/PinsFeed";
import { MobilePinView } from "@/components/MobilePinView";
import { ImageLightbox } from "@/components/ImageLightbox";
import { usePinsQuery, Pin } from "@/hooks/usePinsQuery";

const MobileFeed = () => {
  const { pins, isLoading, isFetchingNextPage, refetch, lastPinElementRef } =
    usePinsQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);

  const handleCommentAdded = (pinId: string) => {
    refetch();
  };

  const handleLikeAdded = () => {
    refetch();
  };

  const handlePinClick = (pinId: string) => {
    setSelectedPinId(pinId);
  };

  const handleClosePinView = () => {
    setSelectedPinId(null);
  };

  const selectedPin: Pin | null =
    pins.find((pin) => pin.id === selectedPinId) || null;

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-white flex flex-col">
      {isLoading ? (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm text-[var(--foreground)] font-medium">
            Loading pins...
          </p>
        </div>
      ) : (
        <div className={`flex-1 min-h-0${selectedPin ? " pointer-events-none" : ""}`}>
          <PinsFeed
            pins={pins}
            isLoading={isLoading}
            isFetchingNextPage={isFetchingNextPage}
            lastPinElementRef={lastPinElementRef}
            onPinClick={handlePinClick}
            onImageClick={(imageUrl) => setLightboxImage(imageUrl)}
            onCommentAdded={handleCommentAdded}
            onLikeAdded={handleLikeAdded}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>
      )}

      <MobilePinView
        pin={selectedPin}
        isOpen={!!selectedPin}
        onClose={handleClosePinView}
        onCommentAdded={handleCommentAdded}
        onLikeAdded={handleLikeAdded}
      />

      <ImageLightbox
        imageUrl={lightboxImage || ""}
        alt="Pin image"
        isOpen={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
};

export default MobileFeed;
