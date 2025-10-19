import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, EyeOff, Trash2, Copy, Clock, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAnalyticsEvents, clearAnalyticsEvents, type AnalyticsEvent } from "./analyticsBuffer";

interface AnalyticsInspectorProps {
  isVisible: boolean;
  onToggle: () => void;
}

export default function AnalyticsInspector({ isVisible, onToggle }: AnalyticsInspectorProps) {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!isVisible) return;

    const updateEvents = () => {
      setEvents(getAnalyticsEvents());
    };

    // Update events immediately
    updateEvents();

    // Set up interval to check for new events
    const interval = setInterval(updateEvents, 500);

    return () => clearInterval(interval);
  }, [isVisible]);

  const clearEvents = () => {
    clearAnalyticsEvents();
    setEvents([]);
  };

  const copyEventToClipboard = (event: AnalyticsEvent) => {
    const eventData = {
      name: event.name,
      props: event.props,
      timestamp: new Date(event.timestamp).toISOString(),
    };

    navigator.clipboard.writeText(JSON.stringify(eventData, null, 2));
    toast({
      title: "Event copied",
      description: `Copied ${event.name} to clipboard`,
    });
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getEventColor = (eventName: string) => {
    if (eventName === "cbm") return "bg-green-100 text-green-800 border-green-200";
    if (eventName === "search_submit") return "bg-blue-100 text-blue-800 border-blue-200";
    if (eventName === "page_view") return "bg-purple-100 text-purple-800 border-purple-200";
    if (eventName.includes("filter")) return "bg-orange-100 text-orange-800 border-orange-200";
    if (eventName.includes("map")) return "bg-cyan-100 text-cyan-800 border-cyan-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  if (!isVisible) {
    return (
      <Button
        onClick={onToggle}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 shadow-lg"
        title="Show Analytics Inspector"
      >
        <Eye className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[36rem] max-w-[calc(100vw-2rem)]">
      <Card className="shadow-xl border-2 max-h-[85vh] flex flex-col overflow-hidden">
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics Inspector
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                onClick={() => setAutoScroll(!autoScroll)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                title={autoScroll ? "Disable auto-scroll" : "Enable auto-scroll"}
              >
                {autoScroll ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </Button>
              <Button
                onClick={clearEvents}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                title="Clear events"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              <Button
                onClick={onToggle}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                title="Close inspector"
              >
                <EyeOff className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-4 overflow-hidden flex-1 min-h-0">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="secondary" className="text-xs">
              {events.length} events
            </Badge>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Live
            </div>
          </div>

          <ScrollArea className="h-[calc(85vh-10rem)]">
            <div className="space-y-2 pr-4">
              {events.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  No events yet. Interact with the app to see analytics events.
                </div>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="border rounded-lg p-3 bg-card text-sm">
                    <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                      <Badge className={`text-xs ${getEventColor(event.name)}`} variant="outline">
                        {event.name}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTimestamp(event.timestamp)}
                        </span>
                        <Button
                          onClick={() => copyEventToClipboard(event)}
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 flex-shrink-0"
                          title="Copy event data"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {Object.entries(event.props).map(([key, value]) => (
                        <div key={key} className="text-xs">
                          <span className="text-muted-foreground font-mono block mb-0.5">
                            {key}:
                          </span>
                          <span className="font-mono block break-all bg-muted/30 rounded px-2 py-1">
                            {typeof value === "object"
                              ? JSON.stringify(value, null, 2)
                              : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
