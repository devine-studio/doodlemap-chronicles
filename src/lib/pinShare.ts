import { createRoot, type Root } from "react-dom/client";
import { createElement } from "react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Pin } from "@/hooks/usePinsQuery";
import { PinShareCard } from "@/components/PinShareCard";

const SHARE_URL = "https://mapin-map.vercel.app";
const CARD_WIDTH = 1080;
const MAP_BORDER_RADIUS = 22;

const getUrlType = (url: string): "image" | "spotify" | "link" => {
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;
  const imageHosts = /\.(supabase\.co|cloudinary|imgur|unsplash)/i;
  if (imageExtensions.test(url) || imageHosts.test(url)) return "image";
  if (url.includes("spotify.com") || url.includes("open.spotify")) return "spotify";
  return "link";
};

let cachedTokenPromise: Promise<string | null> | null = null;
const getMapboxToken = (): Promise<string | null> => {
  if (!cachedTokenPromise) {
    cachedTokenPromise = (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-mapbox-token");
        if (error) throw error;
        return (data?.token as string) || null;
      } catch (err) {
        console.error("Failed to fetch mapbox token for share:", err);
        cachedTokenPromise = null;
        return null;
      }
    })();
  }
  return cachedTokenPromise;
};

const buildStaticMapUrl = (lat: number, lng: number, token: string): string => {
  const marker = `pin-l+ff4444(${lng},${lat})`;
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${marker}/${lng},${lat},14/960x600@2x?access_token=${token}`;
};

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const fetchAsDataUrl = async (src: string, timeoutMs = 8000): Promise<string | null> => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(src, {
      signal: controller.signal,
      credentials: "omit",
      mode: "cors",
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await blobToDataUrl(blob);
  } catch {
    return null;
  }
};

const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || "image/png" });
};

// Loads a data URL or image URL into an HTMLImageElement.
const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

// Returns the bounding rect of `el` relative to `root`.
const getRelativeRect = (root: Element, el: Element) => {
  const rr = root.getBoundingClientRect();
  const er = el.getBoundingClientRect();
  return {
    x: Math.round(er.left - rr.left),
    y: Math.round(er.top - rr.top),
    w: Math.round(er.width),
    h: Math.round(er.height),
  };
};

// Clips the canvas context to a rounded rectangle.
const clipRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.clip();
};

// Draws `img` into the box (x, y, w, h) with object-fit: cover semantics,
// clipped to a rounded rectangle.
const drawImageCover = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, w: number, h: number,
  radius: number,
) => {
  ctx.save();
  clipRoundedRect(ctx, x, y, w, h, radius);

  const imgAspect = img.naturalWidth / img.naturalHeight;
  const boxAspect = w / h;
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (imgAspect > boxAspect) {
    // Image is wider — crop left/right
    sw = img.naturalHeight * boxAspect;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    // Image is taller — crop top/bottom
    sh = img.naturalWidth / boxAspect;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
};

// Takes the base PNG from html-to-image and composites the map/photo images
// directly onto the canvas at the positions measured from the live DOM.
// This sidesteps WebKit's inability to render cross-origin images inside
// SVG <foreignObject>, which html-to-image relies on.
const compositeImages = async (
  host: HTMLDivElement,
  baseDataUrl: string,
  mapDataUrl: string | null,
  photoDataUrl: string | null,
  cardHeight: number,
): Promise<string> => {
  const [baseImg, mapImg, photoImg] = await Promise.all([
    loadImage(baseDataUrl),
    mapDataUrl ? loadImage(mapDataUrl) : Promise.resolve(null),
    photoDataUrl ? loadImage(photoDataUrl) : Promise.resolve(null),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = cardHeight;
  const ctx = canvas.getContext("2d")!;

  // Draw the base card (text, borders, overlays, everything except images)
  ctx.drawImage(baseImg, 0, 0);

  // Composite map image directly at its measured DOM position
  if (mapImg) {
    const el = host.querySelector("[data-share-map]");
    if (el) {
      const { x, y, w, h } = getRelativeRect(host, el);
      drawImageCover(ctx, mapImg, x, y, w, h, MAP_BORDER_RADIUS);
    }
  }

  // Composite photo directly at its measured DOM position
  if (photoImg) {
    const el = host.querySelector("[data-share-photo]");
    if (el) {
      const { x, y, w, h } = getRelativeRect(host, el);
      drawImageCover(ctx, photoImg, x, y, w, h, MAP_BORDER_RADIUS);
    }
  }

  return canvas.toDataURL("image/png");
};

interface RenderedHost {
  node: HTMLDivElement;
  container: HTMLDivElement;
  root: Root;
  cleanup: () => void;
}

interface MountOptions {
  pin: Pin;
  mapImageUrl: string | null;
  photoUrl: string | null;
  linkUrl?: string | null;
  linkType?: "spotify" | "link" | null;
}

const mountOffscreen = (opts: MountOptions): Promise<RenderedHost> =>
  new Promise((resolve) => {
    const container = document.createElement("div");
    container.setAttribute("data-pin-share-host", "true");
    container.style.position = "fixed";
    container.style.left = "-99999px";
    container.style.top = "0";
    container.style.width = `${CARD_WIDTH}px`;
    // Tall enough to never clip; actual card height is measured after render.
    container.style.minHeight = "200px";
    container.style.pointerEvents = "none";
    container.style.zIndex = "-1";
    document.body.appendChild(container);

    const root = createRoot(container);

    const handleReady = (node: HTMLDivElement) => {
      resolve({
        node,
        container,
        root,
        cleanup: () => {
          try {
            root.unmount();
          } catch {
            // noop
          }
          container.remove();
        },
      });
    };

    root.render(
      createElement(PinShareCard, {
        pin: opts.pin,
        mapImageUrl: opts.mapImageUrl,
        photoUrl: opts.photoUrl,
        linkUrl: opts.linkUrl,
        linkType: opts.linkType,
        shareUrl: SHARE_URL,
        width: CARD_WIDTH,
        onReady: handleReady,
      })
    );
  });

const waitForFonts = async () => {
  try {
    const docWithFonts = document as Document & {
      fonts?: { ready?: Promise<unknown> };
    };
    if (typeof document !== "undefined" && docWithFonts.fonts?.ready) {
      await docWithFonts.fonts.ready;
    }
  } catch {
    // noop
  }
};

// Returns the image dataUrl when native sharing isn't available (caller shows a fallback UI),
// or null when the native share sheet handled it (including user abort).
export const sharePin = async (pin: Pin): Promise<string | null> => {
  let host: RenderedHost | null = null;
  try {
    const token = await getMapboxToken();
    const mapUrl = token ? buildStaticMapUrl(pin.lat, pin.lng, token) : null;

    const photoCandidate =
      pin.image_url && getUrlType(pin.image_url) === "image" ? pin.image_url : null;

    // Determine whether the attached URL is an image, spotify, or generic link.
    const urlType = pin.image_url ? getUrlType(pin.image_url) : null;
    const linkUrl = urlType && urlType !== "image" ? pin.image_url : null;
    const linkType = urlType === "spotify" || urlType === "link" ? urlType : null;

    // Fetch images as data URLs up-front so they're available for canvas compositing.
    const [resolvedMap, resolvedPhoto] = await Promise.all([
      mapUrl ? fetchAsDataUrl(mapUrl) : Promise.resolve(null),
      photoCandidate ? fetchAsDataUrl(photoCandidate) : Promise.resolve(null),
    ]);

    await waitForFonts();

    // Mount the card. Pass photoUrl so the [data-share-photo] placeholder renders
    // (needed to measure its position for canvas compositing). mapImageUrl is null —
    // the map placeholder renders and gets overwritten during compositing.
    host = await mountOffscreen({
      pin,
      mapImageUrl: null,
      photoUrl: resolvedPhoto,
      linkUrl,
      linkType,
    });

    // Wait for layout to flush, then measure the card's natural rendered height.
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    const cardHeight = Math.round(host.node.getBoundingClientRect().height);

    // Capture the card layout (text, borders, chips, overlays — everything except images).
    const baseDataUrl = await toPng(host.node, {
      pixelRatio: 1,
      cacheBust: true,
      width: CARD_WIDTH,
      height: cardHeight,
      backgroundColor: "#eef2f7",
    });

    // Draw the actual images directly onto the canvas at their measured positions.
    const dataUrl = await compositeImages(host.node, baseDataUrl, resolvedMap, resolvedPhoto, cardHeight);

    const filename = `mapin-pin-${pin.id.slice(0, 8)}.png`;
    const file = await dataUrlToFile(dataUrl, filename);

    const shareData: ShareData = {
      files: [file],
      text: "Pinned on mapin",
      title: "mapin",
      url: SHARE_URL,
    };

    const canShareFiles =
      typeof navigator !== "undefined" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare(shareData);

    if (canShareFiles && typeof navigator.share === "function") {
      try {
        await navigator.share(shareData);
        return null;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return null;
        console.warn("share() failed, returning dataUrl for fallback UI:", err);
        return dataUrl;
      }
    }

    // Native file sharing unavailable (e.g. iOS WebView without share API).
    // Return the dataUrl so the caller can show it in a save-able overlay.
    return dataUrl;
  } catch (err) {
    console.error("sharePin failed:", err);
    toast.error("Couldn't generate share image");
    throw err;
  } finally {
    host?.cleanup();
  }
};
