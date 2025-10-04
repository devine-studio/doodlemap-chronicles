interface PinCardProps {
  title: string;
  message?: string;
  imageUrl?: string;
  date: string;
  author?: string;
}

export const PinCard = ({ title, message, imageUrl, date, author }: PinCardProps) => {
  return (
    <div className="bg-background brutalist-border brutalist-shadow p-4 hover:brutalist-shadow-hover hover:-translate-y-1 transition-all doodly-wiggle">
      <h3 className="font-black text-xl mb-2">{title}</h3>
      {imageUrl && (
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-48 object-cover mb-3 brutalist-border"
        />
      )}
      {message && (
        <p className="text-sm mb-3 line-clamp-3">{message}</p>
      )}
      <div className="text-xs text-muted-foreground font-bold">
        {new Date(date).toLocaleDateString('pt-BR')}
        {author && ` • ${author}`}
      </div>
    </div>
  );
};