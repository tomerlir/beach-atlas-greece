import { useState } from 'react';
import { 
  Link2, 
  Facebook, 
  Twitter, 
  Mail, 
  MessageCircle,
  Check,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
}

export const ShareDialog = ({
  isOpen,
  onClose,
  url,
  title,
  description,
  imageUrl,
}: ShareDialogProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = description ? encodeURIComponent(description) : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: 'Link copied!',
        description: 'Beach URL copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: 'Failed to copy',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const shareOptions = [
    {
      name: 'Copy Link',
      icon: copied ? Check : Link2,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      action: handleCopyLink,
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'text-[#25D366]',
      bgColor: 'bg-[#25D366]/10',
      action: () => {
        window.open(`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`, '_blank', 'noopener,noreferrer');
      },
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'text-[#1877F2]',
      bgColor: 'bg-[#1877F2]/10',
      action: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank', 'noopener,noreferrer');
      },
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'text-foreground',
      bgColor: 'bg-muted',
      action: () => {
        window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, '_blank', 'noopener,noreferrer');
      },
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      action: () => {
        const subject = encodedTitle;
        const body = `Check out this beach: ${url}${description ? `\n\n${description}` : ''}`;
        const mailtoLink = `mailto:?subject=${subject}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink, '_self');
      },
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Beach</DialogTitle>
          <DialogDescription>
            Share {title} with friends and family
          </DialogDescription>
        </DialogHeader>

        {/* Beach Preview */}
        {imageUrl && (
          <div className="relative w-full h-32 rounded-lg overflow-hidden mb-4 border">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-background font-semibold text-sm truncate">
                {title}
              </p>
            </div>
          </div>
        )}

        {/* Share Options Grid */}
        <div className="grid grid-cols-3 gap-3">
          {shareOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.name}
                type="button"
                onClick={option.action}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ${option.bgColor} hover:bg-opacity-80`}
              >
                <div className="w-12 h-12 rounded-full bg-background/50 flex items-center justify-center">
                  <Icon className={`h-6 w-6 ${option.color}`} />
                </div>
                <span className="text-xs font-medium text-foreground text-center">
                  {option.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* URL Display */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground truncate">
            {url}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
