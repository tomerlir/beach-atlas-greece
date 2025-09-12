import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MapPin, Waves, Car, Flag, Mail, ArrowLeft, Shield, Palmtree, Users, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";

// Map amenities to readable labels with icons
const amenityConfig: Record<string, { label: string; icon: any }> = {
  umbrellas: { label: "Umbrellas", icon: Shield },
  sunbeds: { label: "Sunbeds", icon: Clock },
  taverna: { label: "Taverna", icon: Users },
  water_sports: { label: "Water Sports", icon: Waves },
  snorkeling: { label: "Snorkeling", icon: Waves },
  photography: { label: "Photography", icon: Users },
  beach_bar: { label: "Beach Bar", icon: Users },
  music: { label: "Music", icon: Users },
  hiking: { label: "Hiking", icon: Palmtree },
  birdwatching: { label: "Birdwatching", icon: Palmtree },
  boat_trips: { label: "Boat Trips", icon: Waves },
  cliff_jumping: { label: "Cliff Jumping", icon: Waves },
  family_friendly: { label: "Family Friendly", icon: Users },
  fishing: { label: "Fishing", icon: Waves },
  showers: { label: "Showers", icon: Shield },
  toilets: { label: "Toilets", icon: Shield },
  food: { label: "Food", icon: Users },
  lifeguard: { label: "Lifeguard", icon: Shield },
  parking: { label: "Parking", icon: Car },
};

// Map beach types to readable labels
const typeLabels: Record<string, string> = {
  SANDY: "Sandy",
  PEBBLY: "Pebbles",
  MIXED: "Mixed",
  OTHER: "Other",
};

// Map wave conditions to readable labels  
const waveLabels: Record<string, string> = {
  CALM: "Calm Waters",
  MODERATE: "Moderate Waves", 
  WAVY: "Wavy",
  SURFABLE: "Surfable",
};

// Map parking types to readable labels
const parkingLabels: Record<string, string> = {
  NONE: "No Parking",
  ROADSIDE: "Roadside Parking",
  SMALL_LOT: "Small Parking Lot",
  LARGE_LOT: "Large Parking Lot",
};

const BeachDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const { data: beach, isLoading, error } = useQuery({
    queryKey: ["beach", slug],
    queryFn: async () => {
      if (!slug) throw new Error("No slug provided");
      
      const { data, error } = await supabase
        .from("beaches")
        .select("*")
        .eq("slug", slug)
        .eq("status", "ACTIVE")
        .single();

      if (error) {
        console.error("Beach fetch error:", error);
        throw error;
      }
      
      return data;
    },
    enabled: !!slug,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-8 w-32 mb-6" />
            <Skeleton className="aspect-video w-full mb-6" />
            <Skeleton className="h-10 w-3/4 mb-2" />
            <Skeleton className="h-6 w-1/2 mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
            <Skeleton className="h-40 w-full mb-6" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
      </div>
    );
  }

  // Error or not found state
  if (error || !beach) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="py-16">
              <Waves className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <h1 className="text-4xl font-bold text-foreground mb-4">Beach Not Found</h1>
              <p className="text-muted-foreground mb-8">
                The beach you're looking for doesn't exist or isn't currently available.
              </p>
              <Button asChild>
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Directory
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const handleFeedbackClick = () => {
    const subject = `Correction for ${beach.name}`;
    const body = `Hi,\n\nI'd like to suggest a correction for the beach "${beach.name}" at ${beach.place_text}.\n\nCorrection details:\n\n\nThank you!`;
    window.location.href = `mailto:feedback@beachesofgreece.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const shouldShowReadMore = beach.description && beach.description.length > 200;
  const displayDescription = shouldShowReadMore && !isDescriptionExpanded 
    ? beach.description.slice(0, 200) + "..."
    : beach.description;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Directory
            </Link>
          </Button>

          {/* Hero Image */}
          <div className="aspect-video bg-gradient-ocean relative overflow-hidden rounded-lg mb-6">
            {beach.photo_url ? (
              <img 
                src={beach.photo_url} 
                alt={`${beach.name} beach`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-ocean flex items-center justify-center">
                <Waves className="h-24 w-24 text-white opacity-50" />
              </div>
            )}
          </div>

          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-3">{beach.name}</h1>
            <div className="flex items-center text-muted-foreground text-lg">
              <MapPin className="h-5 w-5 mr-2" />
              {beach.place_text}
            </div>
          </div>

          {/* Quick Facts Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <Badge variant="outline" className="mb-2">
                  {typeLabels[beach.type] || beach.type}
                </Badge>
                <p className="text-xs text-muted-foreground">Beach Type</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Badge variant={beach.organized ? "default" : "secondary"} className="mb-2">
                  {beach.organized ? "Organized" : "Unorganized"}
                </Badge>
                <p className="text-xs text-muted-foreground">Organization</p>
              </CardContent>
            </Card>

            {beach.blue_flag && (
              <Card>
                <CardContent className="p-4 text-center">
                  <Badge className="mb-2">
                    <Flag className="h-3 w-3 mr-1" />
                    Blue Flag
                  </Badge>
                  <p className="text-xs text-muted-foreground">Certification</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-4 text-center">
                <Badge variant="outline" className="mb-2">
                  {waveLabels[beach.wave_conditions] || beach.wave_conditions}
                </Badge>
                <p className="text-xs text-muted-foreground">Wave Conditions</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-8">
              {/* Description */}
              {beach.description && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">About This Beach</h2>
                    <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                      {displayDescription}
                    </p>
                    {shouldShowReadMore && (
                      <Button 
                        variant="link" 
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className="p-0 h-auto mt-2"
                      >
                        {isDescriptionExpanded ? "Read less" : "Read more"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Parking */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Parking Information</h2>
                  <div className="flex items-center">
                    <Car className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {parkingLabels[beach.parking] || beach.parking}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Amenities */}
              {beach.amenities.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Available Amenities</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {beach.amenities.map((amenity) => {
                        const config = amenityConfig[amenity];
                        const IconComponent = config?.icon || Users;
                        const label = config?.label || amenity;
                        
                        return (
                          <div key={amenity} className="flex items-center space-x-3 p-2 rounded-md bg-muted/50">
                            <IconComponent className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Feedback */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Suggest a Correction</h2>
                  <p className="text-muted-foreground mb-4">
                    Help us keep beach information accurate and up-to-date.
                  </p>
                  <Button onClick={handleFeedbackClick} className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Correction
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BeachDetail;