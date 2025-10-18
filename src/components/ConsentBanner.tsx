import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { X, BarChart3 } from "lucide-react";
import { analytics } from "@/lib/analytics";
import { Link } from "react-router-dom";

export default function ConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [open, setOpen] = useState(false);

  // Category toggles (extendable for marketing/performance if added later)
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);

  useEffect(() => {
    const currentConsent = analytics.getConsent();
    setIsVisible(currentConsent === "unknown");
    setAnalyticsAllowed(currentConsent === "accepted");

    const unsubscribe = analytics.onConsentChange((newConsent) => {
      setIsVisible(newConsent === "unknown");
      setAnalyticsAllowed(newConsent === "accepted");
    });

    return unsubscribe;
  }, []);

  // Global opener from Footer (or elsewhere)
  useEffect(() => {
    const handler = () => {
      try {
        const current = analytics.getConsent();
        setAnalyticsAllowed(current === "accepted");
      } catch (error) {
        // Analytics consent check may fail in some environments
        console.warn("Failed to get analytics consent:", error);
      }
      setOpen(true);
    };
    window.addEventListener("open-privacy-preferences", handler);
    return () => window.removeEventListener("open-privacy-preferences", handler);
  }, []);

  const handleAccept = () => {
    analytics.setConsent("accepted");
  };

  const handleReject = () => {
    analytics.setConsent("rejected");
  };

  return (
    <>
      {/* Preferences Dialog is always mounted so the footer link can open it */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-describedby="consent-pref-desc" className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Privacy preferences</DialogTitle>
            <DialogDescription id="consent-pref-desc">
              Choose which optional features you want to allow. You can change your choice at any
              time from the site footer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-foreground">Strictly necessary</div>
                <div className="text-sm text-muted-foreground">
                  Required for core site functionality. Always on.
                </div>
              </div>
              <Switch checked disabled aria-readonly aria-label="Strictly necessary" />
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <Label htmlFor="analytics-switch" className="text-sm font-medium">
                  Analytics
                </Label>
                <div className="text-sm text-muted-foreground">
                  Cookieless analytics to help us understand usage and improve features.
                </div>
              </div>
              <Switch
                id="analytics-switch"
                checked={analyticsAllowed}
                onCheckedChange={setAnalyticsAllowed}
                aria-label="Analytics"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => {
                  handleReject();
                  setOpen(false);
                }}
                className="w-full sm:w-auto"
              >
                Reject all
              </Button>
              <Button
                onClick={() => {
                  handleAccept();
                  setOpen(false);
                }}
                className="w-full sm:w-auto"
              >
                Accept all
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Banner shows only when consent is unknown */}
      {isVisible && (
        <div className="fixed z-50 bottom-0 left-0 right-0 sm:bottom-4 sm:right-4 sm:left-auto sm:w-[420px]">
          <div className="mx-auto sm:mx-0 bg-background border border-border shadow-lg rounded-none sm:rounded-lg px-4 py-4 animate-banner-slide-up motion-reduce:animate-none">
            <div className="space-y-3">
              {/* Header row with icon, title and X button */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-foreground">Privacy preferences</h3>
                </div>
                <Button
                  onClick={handleReject}
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0 h-8 w-8 p-0 -mr-2"
                  aria-label="Close banner"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Description - full width */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                With your permission, we'd also like to enable privacy-friendly analytics
                (cookieless) to help us improve Beaches of Greece.
                <Link to="/privacy" className="text-primary hover:underline ml-1">
                  Privacy policy
                </Link>
              </p>

              {/* Buttons - full width */}
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <Button onClick={handleAccept} size="default" className="w-full sm:flex-1">
                  Accept all
                </Button>
                <Button
                  onClick={handleReject}
                  variant="outline"
                  size="default"
                  className="w-full sm:flex-1"
                >
                  Reject all
                </Button>
                <Button
                  onClick={() => setOpen(true)}
                  variant="secondary"
                  size="default"
                  className="w-full sm:flex-1"
                >
                  Customize
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
