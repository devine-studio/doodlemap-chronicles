import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CreatePinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (pin: {
    title: string;
    message?: string;
    imageUrl?: string;
    author?: string;
    lat: number;
    lng: number;
  }) => void;
  lat: number;
  lng: number;
}

export const CreatePinDialog = ({ open, onOpenChange, onSubmit, lat, lng }: CreatePinDialogProps) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [author, setAuthor] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('O título é obrigatório!');
      return;
    }

    onSubmit({
      title: title.trim(),
      message: message.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      author: author.trim() || undefined,
      lat,
      lng,
    });

    // Reset form
    setTitle('');
    setMessage('');
    setImageUrl('');
    setAuthor('');
    onOpenChange(false);
    
    toast.success('Pin criado com sucesso!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-secondary">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Criar Novo Pin</DialogTitle>
          <DialogDescription className="text-base">
            Adicione sua mensagem ao mapa mundial!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-bold mb-2 block">
              Título *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título..."
              required
            />
          </div>
          <div>
            <label className="text-sm font-bold mb-2 block">
              Mensagem
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Conte sua história..."
            />
          </div>
          <div>
            <label className="text-sm font-bold mb-2 block">
              URL da Imagem
            </label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              type="url"
            />
          </div>
          <div>
            <label className="text-sm font-bold mb-2 block">
              Seu Nome (opcional)
            </label>
            <Input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Anônimo"
            />
          </div>
          <DialogFooter>
            <Button type="submit" variant="default" size="lg" className="w-full">
              Adicionar Pin
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};