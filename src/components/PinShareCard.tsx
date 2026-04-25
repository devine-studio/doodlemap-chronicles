import { useEffect, useRef, type CSSProperties } from "react";
import type { Pin } from "@/hooks/usePinsQuery";

interface PinShareCardProps {
  pin: Pin;
  mapImageUrl: string | null;
  photoUrl: string | null;
  linkUrl?: string | null;
  linkType?: "spotify" | "link" | null;
  shareUrl: string;
  width: number;
  onReady?: (node: HTMLDivElement) => void;
}

const COLORS = {
  bgTop: "#eef2f7",
  bgBottom: "#dfe6ed",
  window: "#ffffff",
  windowBorder: "#c8d2df",
  titleBarTop: "#eaf1f9",
  titleBarBottom: "#bfd0e3",
  titleBarBorder: "#9fb4cc",
  text: "#3d4852",
  mute: "#6b7a8a",
  accent: "#7c9ac7",
  urlBg: "#f4f7fb",
  urlBorder: "#d6dfea",
  divider: "#e1e8f0",
  photoBorder: "#dfe6ed",
  pinRed: "#ff4444",
  footerMute: "#6b7a8a",
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} · ${timePart}`;
};

const SpotifyIconSVG = () => (
  <svg width="52" height="52" viewBox="0 0 24 24" fill="#1DB954" style={{ flexShrink: 0 }}>
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
  </svg>
);

const ExternalLinkSVG = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={COLORS.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

export const PinShareCard = ({
  pin,
  mapImageUrl,
  photoUrl,
  linkUrl,
  linkType,
  shareUrl,
  width,
  onReady,
}: PinShareCardProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (rootRef.current && onReady) {
      onReady(rootRef.current);
    }
  }, [onReady]);

  const prettyUrl = `${shareUrl.replace(/^https?:\/\//, "")}/pin/${pin.id.slice(0, 8)}`;
  const author = pin.author || "Anonymous";
  const initial = author[0]?.toUpperCase() || "A";
  const lat = pin.lat.toFixed(5);
  const lng = pin.lng.toFixed(5);

  const hasExtra = !!(photoUrl || linkUrl);
  const textClamp = photoUrl ? 4 : linkUrl ? 5 : 6;

  return (
    <div
      ref={rootRef}
      style={{
        width,
        position: "relative",
        fontFamily:
          '"Blinker", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        background: `linear-gradient(180deg, ${COLORS.bgTop} 0%, ${COLORS.bgBottom} 100%)`,
        boxSizing: "border-box",
        padding: "60px 60px 48px",
        display: "flex",
        flexDirection: "column",
        color: COLORS.text,
      }}
    >
      {/* Decorative corner dots */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 12% 18%, rgba(124,154,199,0.18) 0, transparent 28%), radial-gradient(circle at 88% 82%, rgba(90,103,117,0.10) 0, transparent 34%)",
          pointerEvents: "none",
        }}
      />

      {/* Browser Window — natural height, no flex:1 */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          background: COLORS.window,
          border: `1px solid ${COLORS.windowBorder}`,
          borderRadius: 28,
          boxShadow:
            "0 40px 80px rgba(30, 50, 80, 0.25), 0 12px 24px rgba(30, 50, 80, 0.12), inset 0 1px 0 rgba(255,255,255,0.9)",
          overflow: "hidden",
        }}
      >
        {/* Title bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 64,
            padding: "0 22px",
            background: `linear-gradient(180deg, ${COLORS.titleBarTop} 0%, ${COLORS.titleBarBottom} 100%)`,
            borderBottom: `1px solid ${COLORS.titleBarBorder}`,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img
              src="/win7world.png"
              alt=""
              width={32}
              height={32}
              style={{ display: "block", filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.15))" }}
              crossOrigin="anonymous"
            />
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 0.3, color: COLORS.text }}>
              mapin
            </span>
            <span style={{ fontSize: 15, color: COLORS.mute, marginLeft: 4, fontWeight: 400 }}>
              — Memories. Pinned.
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 24, borderRadius: 6, background: "linear-gradient(180deg, #f6fafd 0%, #d4dfea 100%)", border: `1px solid ${COLORS.titleBarBorder}`, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 4 }}>
              <div style={{ width: 12, height: 2, background: COLORS.text, borderRadius: 1 }} />
            </div>
            <div style={{ width: 36, height: 24, borderRadius: 6, background: "linear-gradient(180deg, #f6fafd 0%, #d4dfea 100%)", border: `1px solid ${COLORS.titleBarBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 12, height: 10, border: `1.5px solid ${COLORS.text}`, borderRadius: 2, boxSizing: "border-box" }} />
            </div>
            <div style={{ width: 36, height: 24, borderRadius: 6, background: "linear-gradient(180deg, #ff9a94 0%, #e03a2f 100%)", border: "1px solid #b52a22", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, lineHeight: 1 }}>
              ×
            </div>
          </div>
        </div>

        {/* URL bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "14px 22px",
            borderBottom: `1px solid ${COLORS.divider}`,
            background: "#f7faff",
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            {["‹", "›", "↻"].map((ch, i) => (
              <div key={i} style={{ width: 32, height: 32, borderRadius: "50%", background: "#ffffff", border: `1px solid ${COLORS.urlBorder}`, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.mute, fontSize: 18, fontWeight: 600, lineHeight: 1 }}>
                {ch}
              </div>
            ))}
          </div>
          <div style={{ flex: 1, height: 44, borderRadius: 22, background: COLORS.urlBg, border: `1px solid ${COLORS.urlBorder}`, display: "flex", alignItems: "center", padding: "0 18px", boxShadow: "inset 0 1px 2px rgba(90, 103, 117, 0.08)", gap: 10 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="5" y="11" width="14" height="9" rx="2" stroke={COLORS.mute} strokeWidth="1.8" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke={COLORS.mute} strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", monospace', fontSize: 17, color: COLORS.text, letterSpacing: 0.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {prettyUrl}
            </span>
          </div>
        </div>

        {/* Content — natural height */}
        <div
          style={{
            padding: "32px 40px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          {/* Author row */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: `linear-gradient(135deg, #5a6775 0%, ${COLORS.accent} 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: 28,
                boxShadow: "0 4px 10px rgba(90, 103, 117, 0.35)",
                flexShrink: 0,
              }}
            >
              {initial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.1 }}>
                {author}
              </div>
              <div style={{ fontSize: 18, color: COLORS.mute, marginTop: 4 }}>
                {formatDate(pin.created_at)}
              </div>
            </div>
          </div>

          {/* Pin text */}
          {pin.text && (
            <div
              style={{
                fontSize: 26,
                lineHeight: 1.35,
                color: COLORS.text,
                fontWeight: 500,
                wordBreak: "break-word",
                whiteSpace: "pre-wrap",
                display: "-webkit-box",
                WebkitLineClamp: textClamp,
                WebkitBoxOrient: "vertical" as CSSProperties["WebkitBoxOrient"],
                overflow: "hidden",
              }}
            >
              {pin.text}
            </div>
          )}

          {/* Map box */}
          <div
            data-share-map=""
            style={{
              position: "relative",
              borderRadius: 22,
              overflow: "hidden",
              border: `1px solid ${COLORS.photoBorder}`,
              boxShadow: "0 8px 20px rgba(30, 50, 80, 0.12)",
              height: hasExtra ? 300 : 440,
              background: "#e8eef5",
              flexShrink: 0,
            }}
          >
            {mapImageUrl ? (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundImage: `url(${mapImageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: COLORS.mute,
                  fontSize: 20,
                  background: "repeating-linear-gradient(45deg, #eef2f7 0 18px, #e4ebf3 18px 36px)",
                }}
              >
                map unavailable
              </div>
            )}

            {/* Coords chip */}
            <div
              style={{
                position: "absolute",
                left: 16,
                bottom: 16,
                background: "rgba(255,255,255,0.95)",
                borderRadius: 999,
                padding: "8px 14px",
                fontSize: 16,
                fontWeight: 600,
                color: COLORS.text,
                boxShadow: "0 2px 8px rgba(30, 50, 80, 0.18)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill={COLORS.pinRed} />
                <circle cx="12" cy="9" r="2.6" fill="#fff" />
              </svg>
              {lat}, {lng}
            </div>

            {/* mapin watermark on map */}
            <div
              style={{
                position: "absolute",
                right: 16,
                top: 16,
                background: "rgba(255,255,255,0.92)",
                borderRadius: 999,
                padding: "6px 12px 6px 8px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 14,
                fontWeight: 600,
                color: COLORS.text,
                boxShadow: "0 2px 6px rgba(30, 50, 80, 0.18)",
              }}
            >
              <img src="/win7world.png" alt="" width={18} height={18} style={{ display: "block" }} crossOrigin="anonymous" />
              mapin
            </div>
          </div>

          {/* Photo — square placeholder, composited in pinShare.ts */}
          {photoUrl && (
            <div
              data-share-photo=""
              style={{
                borderRadius: 22,
                overflow: "hidden",
                border: `1px solid ${COLORS.photoBorder}`,
                boxShadow: "0 8px 20px rgba(30, 50, 80, 0.12)",
                height: 880,
                flexShrink: 0,
              }}
            />
          )}

          {/* Spotify link */}
          {linkType === "spotify" && linkUrl && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                padding: "28px 28px",
                borderRadius: 22,
                border: `1px solid ${COLORS.photoBorder}`,
                background: "rgba(29, 185, 84, 0.08)",
                flexShrink: 0,
              }}
            >
              <SpotifyIconSVG />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.text, marginBottom: 6 }}>
                  Spotify
                </div>
                <div style={{ fontSize: 17, color: COLORS.mute, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {linkUrl}
                </div>
              </div>
            </div>
          )}

          {/* Generic link */}
          {linkType === "link" && linkUrl && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                padding: "28px 28px",
                borderRadius: 22,
                border: `1px solid ${COLORS.photoBorder}`,
                background: `rgba(124, 154, 199, 0.06)`,
                flexShrink: 0,
              }}
            >
              <ExternalLinkSVG />
              <div style={{ flex: 1, minWidth: 0, fontSize: 20, color: COLORS.accent, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
                {linkUrl}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          color: COLORS.footerMute,
          fontSize: 22,
          fontWeight: 500,
        }}
      >
        <img src="/win7world.png" alt="" width={26} height={26} style={{ display: "block", opacity: 0.9 }} crossOrigin="anonymous" />
        <span>
          pinned on <span style={{ color: COLORS.text, fontWeight: 700 }}>mapin</span>
        </span>
        <span style={{ opacity: 0.5 }}>·</span>
        <span>try it at mapin-map.vercel.app →</span>
      </div>
    </div>
  );
};
