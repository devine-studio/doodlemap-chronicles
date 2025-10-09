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
    <div className="aero-panel p-3 hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
        <span className="text-xs text-gray-600 font-medium">Pin Info</span>
        <div className="w-2 h-2 bg-green-500 rounded-full shadow-sm"></div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-sm mb-2 text-gray-800 line-clamp-2">
        {title}
      </h3>

      {/* Image */}
      {imageUrl && (
        <div className="mb-2 rounded overflow-hidden border border-gray-200">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-32 object-cover"
          />
        </div>
      )}

      {/* Message */}
      {message && (
        <p className="text-xs mb-2 line-clamp-3 text-gray-700 leading-relaxed">
          {message}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-2 border-t border-gray-100">
        <span>{new Date(date).toLocaleDateString()}</span>
        {author && <span className="text-blue-600">by {author}</span>}
      </div>
    </div>
  );
};
