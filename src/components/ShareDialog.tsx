import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  description?: string;
}

export function ShareDialog({ isOpen, onClose, url }: ShareDialogProps) {
  const { toast } = useToast();

  const handleCopyLink = async () => {
    try {
      // Ensure URL is properly formatted
      const cleanUrl = url.trim();

      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(cleanUrl);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = cleanUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      toast({
        title: "Link copied!",
        description: "Beach URL copied to clipboard",
      });
      onClose();
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Copy failed",
        description: "Unable to copy link. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" aria-describedby="share-dialog-desc">
        <DialogHeader>
          <DialogTitle>Share this beach</DialogTitle>
          <DialogDescription id="share-dialog-desc">
            Copy the link to share this beach with others.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Copy Link - Primary action */}
          <Button
            type="button"
            onClick={handleCopyLink}
            variant="default"
            className="w-full h-auto py-3 flex items-center justify-center gap-2"
          >
            <Copy className="h-5 w-5" />
            <span>Copy Link</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
