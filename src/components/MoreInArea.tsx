import React from "react";
import type { Beach } from "@/types/beach";
import BeachCard from "@/components/BeachCard";
import { Link } from "react-router-dom";
import { generateAreaUrl } from "@/lib/utils";

type SlimArea = { name: string; slug: string };

export function MoreInArea({ area, beaches }: { area: SlimArea; beaches: Beach[] }) {
  if (!area || !beaches || beaches.length === 0) return null;

  const areaHref = generateAreaUrl(area.slug || area.name);

  return (
    <section className="mt-10 max-w-4xl md:max-w-5xl mx-auto px-4">
      <h2 className="text-xl font-medium">More beaches in {area.name}</h2>
      <div className="mt-4 -mx-4 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex gap-4 pb-4 pl-4">
          {beaches.map((b) => (
            <div
              key={b.slug}
              className="flex-none w-[85%] sm:w-[45%] lg:w-[30%]"
            >
              <BeachCard beach={b} showDistance={false} compact engagementSource="browsing" />
            </div>
          ))}
          <div className="flex-none w-[85%] sm:w-[45%] lg:w-[30%]">
            <Link
              to={areaHref}
              className="block h-full w-full border rounded-lg hover:bg-muted/50 transition-colors"
              aria-label={`View all beaches in ${area.name}`}
            >
              <div className="flex h-full items-center justify-center p-4 text-center">
                View all beaches in {area.name} →
              </div>
            </Link>
          </div>
          {/* Spacer for proper right padding on scroll */}
          <div className="flex-none w-4" aria-hidden="true"></div>
        </div>
      </div>
    </section>
  );
}

export default MoreInArea;
