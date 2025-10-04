interface PinCardProps {
  title: string;
  message?: string;
  imageUrl?: string;
  date: string;
  author?: string;
}

export const PinCard = ({
  title,
  message,
  imageUrl,
  date,
  author,
}: PinCardProps) => {
  return (
    <div className="tactical-panel p-3 hover:shadow-[0_0_20px_rgba(94,234,212,0.3)] transition-all glitch-hover group">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-primary/30">
        <div className="flex items-center gap-2">
          <span className="text-primary text-xs">●</span>
          <span className="text-[10px] text-muted-foreground font-mono uppercase">
            MARKER DATA
          </span>
        </div>
        <div className="w-2 h-2 bg-primary rounded-full pulse-glow"></div>
      </div>

      {/* Title */}
      <h3 className="font-black text-base mb-3 text-primary uppercase tracking-wide line-clamp-2">
        {title}
      </h3>

      {/* Image */}
      {imageUrl && (
        <div className="relative mb-3">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-40 object-cover tactical-border"
          />
          {/* Tactical corners on image */}
          <div className="absolute top-1 left-1 w-4 h-4 border-l border-t border-primary/60"></div>
          <div className="absolute top-1 right-1 w-4 h-4 border-r border-t border-primary/60"></div>
          <div className="absolute bottom-1 left-1 w-4 h-4 border-l border-b border-primary/60"></div>
          <div className="absolute bottom-1 right-1 w-4 h-4 border-r border-b border-primary/60"></div>
        </div>
      )}

      {/* Message */}
      {message && (
        <p className="text-xs mb-3 line-clamp-3 text-foreground/80 font-mono leading-relaxed">
          {message}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono pt-2 border-t border-primary/20">
        <span>{new Date(date).toLocaleDateString("pt-BR")}</span>
        {author && (
          <span className="text-primary">USER: {author.toUpperCase()}</span>
        )}
      </div>
    </div>
  );
};
