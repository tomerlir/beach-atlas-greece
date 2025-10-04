import React from 'react';
import type { Beach } from '@/types/beach';
import BeachCard from '@/components/BeachCard';
import { Link } from 'react-router-dom';
import { generateAreaUrl } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { analytics } from '@/lib/analytics';

type SlimArea = { name: string; slug: string };

export function MoreInArea({ area, beaches }: { area: SlimArea; beaches: Beach[] }) {
  if (!area || !beaches || beaches.length === 0) return null;

  const areaHref = generateAreaUrl(area.slug || area.name);

  return (
    <section className="mt-10">
      <h2 className="text-xl font-medium">More beaches in {area.name}</h2>
      <div className="mt-4">
        <Carousel className="relative">
          <CarouselContent>
            {beaches.map((b) => (
              <CarouselItem key={b.slug} className="basis-[85%] sm:basis-1/2 lg:basis-1/3">
                <div onClick={() => analytics.event('carousel_card_click', { context: 'more_in_area', area_slug: area.slug || area.name, beach_slug: b.slug })}>
                  <BeachCard beach={b as any} showDistance={false} compact />
                </div>
              </CarouselItem>
            ))}
            <CarouselItem className="basis-[85%] sm:basis-1/2 lg:basis-1/3">
              <Link
                to={areaHref}
                className="block h-full w-full border rounded-lg hover:bg-gray-50 transition-colors"
                aria-label={`View all beaches in ${area.name}`}
                onClick={() => analytics.event('view_all_area_click', { area_slug: area.slug || area.name })}
              >
                <div className="flex h-full items-center justify-center p-4 text-center">
                  View all beaches in {area.name} →
                </div>
              </Link>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex lg:hidden" />
          <CarouselNext className="hidden sm:flex lg:hidden" />
        </Carousel>
      </div>
    </section>
  );
}

export default MoreInArea;


