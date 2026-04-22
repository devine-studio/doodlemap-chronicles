import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Upload, X, Loader2, Link, MapPin, Navigation } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const CreatePin = () => {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapToken, setMapToken] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          "get-mapbox-token"
        );
        if (error) throw error;
        setMapToken(data.token);
      } catch (error) {
        console.error("Error fetching Mapbox token:", error);
      }
    };
    fetchToken();
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocalização não suportada pelo navegador");
      return;
    }

    const loadingToast = toast.loading("Obtendo sua localização...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        toast.dismiss(loadingToast);
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        toast.success("Localização obtida!");
      },
      (error) => {
        toast.dismiss(loadingToast);
        let errorMessage = "Não foi possível obter sua localização";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Permissão de localização negada. Habilite nas configurações.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Informação de localização indisponível";
            break;
          case error.TIMEOUT:
            errorMessage = "Tempo esgotado ao obter localização";
            break;
        }

        setLocationError(errorMessage);
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapToken || !location) return;

    mapboxgl.accessToken = mapToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [location.lng, location.lat],
      zoom: 15,
      interactive: false,
      attributionControl: false,
    });

    new mapboxgl.Marker({ color: "#ff4444" })
      .setLngLat([location.lng, location.lat])
      .addTo(map.current);

    return () => {
      map.current?.remove();
    };
  }, [mapToken, location]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Por favor, selecione uma imagem");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("A imagem deve ter menos de 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setLinkUrl("");
    setShowLinkInput(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.${fileExt}`;
    const filePath = fileName;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("pin-images")
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage.from("pin-images").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error("Por favor, escreva algo");
      return;
    }

    if (!location) {
      toast.error("Aguarde enquanto obtemos sua localização");
      return;
    }

    setIsUploading(true);
    try {
      let imageUrl: string | undefined;

      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      } else if (linkUrl.trim()) {
        imageUrl = linkUrl.trim();
      }

      const { data, error } = await supabase
        .from("pins")
        .insert({
          text: text.trim(),
          image_url: imageUrl,
          author: author.trim() || undefined,
          lat: location.lat,
          lng: location.lng,
        })
        .select();

      if (error) throw error;

      toast.success("Pin criado com sucesso!", {
        description: "Seu pin foi adicionado ao mapa.",
      });

      setText("");
      setAuthor("");
      setImageFile(null);
      setImagePreview(null);
      setLinkUrl("");
      setShowLinkInput(false);

      setTimeout(() => {
        navigate("/mobile/feed");
      }, 1000);
    } catch (error) {
      console.error("Error creating pin:", error);
      toast.error("Erro ao criar pin", {
        description: "Tente novamente mais tarde.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetryLocation = () => {
    window.location.reload();
  };

  return (
    <div className="h-[100dvh] w-full overflow-y-auto bg-white">
      <div className="max-w-2xl mx-auto p-4 pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
            Criar novo pin
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Compartilhe memórias em lugares incríveis
          </p>
        </div>

        <div className="mb-6 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--muted)]/20">
          <div
            ref={mapContainer}
            className="w-full h-[200px] relative"
            style={{
              backgroundColor: "#f0f0f0",
            }}
          >
            {!location && !locationError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--muted)]/50">
                <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-xs text-[var(--muted-foreground)] font-medium">
                  Obtendo localização...
                </p>
              </div>
            )}
            {locationError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--muted)]/50 p-4">
                <MapPin className="w-8 h-8 text-red-500 mb-2" />
                <p className="text-xs text-center text-[var(--muted-foreground)] font-medium mb-3">
                  {locationError}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleRetryLocation}
                >
                  Tentar novamente
                </Button>
              </div>
            )}
          </div>
          {location && (
            <div className="px-3 py-2 bg-white border-t border-[var(--border)]">
              <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                <Navigation className="w-3 h-3" />
                <span>
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="text"
                className="text-sm font-medium text-[var(--foreground)]"
              >
                O que está acontecendo?
              </Label>
              <span
                className={`text-xs font-medium ${
                  text.length > 140
                    ? "text-red-600"
                    : text.length > 120
                    ? "text-orange-500"
                    : "text-[var(--muted-foreground)]"
                }`}
              >
                {text.length}/140
              </span>
            </div>
            <Textarea
              id="text"
              placeholder="Compartilhe suas memórias..."
              value={text}
              onChange={(e) => {
                if (e.target.value.length <= 140) {
                  setText(e.target.value);
                }
              }}
              className="min-h-[120px] resize-none"
              required
              maxLength={140}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-[var(--foreground)]">
              Adicionar foto ou link (opcional)
            </Label>

            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-[var(--border)]">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : showLinkInput || linkUrl ? (
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type="url"
                    placeholder="Cole um link (Spotify, YouTube, etc.)"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-[var(--accent)]/10 rounded-full text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Ou{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setShowLinkInput(false);
                      setLinkUrl("");
                    }}
                    className="text-[var(--accent)] hover:underline"
                  >
                    envie uma foto
                  </button>
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Câmera
                  </Button>
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Ou{" "}
                  <button
                    type="button"
                    onClick={() => setShowLinkInput(true)}
                    className="text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                  >
                    <Link className="w-3 h-3" />
                    cole um link
                  </button>
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="author"
              className="text-sm font-medium text-[var(--foreground)]"
            >
              Seu nome (opcional)
            </Label>
            <Input
              id="author"
              placeholder="Anônimo"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={isUploading || !location}
              className="w-full"
              size="lg"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Publicar Pin"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePin;
