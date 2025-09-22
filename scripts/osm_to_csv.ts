#!/usr/bin/env tsx
// Usage:
//   tsx scripts/osm_to_csv.ts --country GR --place "Greece" --out beaches_gr.csv
//   tsx scripts/osm_to_csv.ts --bbox "34.7,23.3,35.8,24.3" --place "Chania, Crete" --out beaches_crete.csv
//   tsx scripts/osm_to_csv.ts --country GR --place "Greece" --limit 100 --out beaches_sample.csv
//
// Note: --limit controls how many beaches to fetch from Overpass API.
// Useful for testing or processing beaches in smaller batches.

import fs from 'node:fs/promises';
import path from 'node:path';

type Argv = { bbox?: string; country?: string; place?: string; limit?: string; out: string };
const args: Partial<Argv> = {};
for (let i = 2; i < process.argv.length; i += 2) {
  const key = process.argv[i]?.replace(/^--/, '');
  const value = process.argv[i + 1];
  if (key && value) {
    args[key as keyof Argv] = value;
  }
}
if (!args.out) { console.error('Missing --out filename'); process.exit(1); }

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

// --- Helpers ---
const slugify = (s: string) =>
  s.toLowerCase()
   .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
   .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);

const haversineKm = (a:[number,number], b:[number,number]) => {
  const toRad = (d:number)=>d*Math.PI/180;
  const R = 6371;
  const dLat = toRad(b[0]-a[0]), dLon = toRad(b[1]-a[1]);
  const lat1 = toRad(a[0]), lat2 = toRad(b[0]);
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
};

// Amenity mapping based on your app's AMENITY_MAP
const ALLOWED_AMENITIES = new Set([
  'sunbeds','umbrellas','parking','showers','toilets','lifeguard',
  'beach_bar','taverna','food','music',
  'snorkeling','water_sports','family_friendly','boat_trips','fishing',
  'photography','hiking','birdwatching','cliff_jumping'
]);

// Extract amenity keys from OSM tags heuristically
const inferAmenities = (tags: Record<string,string|undefined>) => {
  const out = new Set<string>();
  const description = (tags['description'] || tags['note'] || '').toLowerCase();
  const name = (tags['name'] || '').toLowerCase();
  
  // Facilities
  if (tags['sunbed'] === 'yes' || tags['seats'] === 'sunbeds' || tags['beach'] === 'resort' ||
      description.includes('sunbed') || description.includes('sunbeds')) out.add('sunbeds');
  if (tags['umbrella'] === 'yes' || tags['sun_shade'] === 'yes' || 
      description.includes('umbrella') || description.includes('umbrellas')) out.add('umbrellas');
  if (tags['shower'] === 'yes' || tags['showers'] === 'yes' || 
      description.includes('shower') || description.includes('showers')) out.add('showers');
  if (tags['toilets'] === 'yes' || tags['toilet'] === 'yes' || 
      description.includes('toilet') || description.includes('toilets') || description.includes('wc')) out.add('toilets');
  
  // Safety
  if (tags['lifeguard'] === 'yes' || tags['lifeguards'] === 'yes' || 
      description.includes('lifeguard') || description.includes('lifeguards')) out.add('lifeguard');

  // Services / food
  if (tags['amenity'] === 'bar' || tags['bar'] === 'yes' || tags['beach_bar'] === 'yes' ||
      description.includes('bar') || description.includes('beach bar')) out.add('beach_bar');
  if (tags['amenity'] === 'restaurant' || tags['cuisine'] || tags['taverna'] === 'yes' ||
      description.includes('restaurant') || description.includes('taverna') || description.includes('food')) out.add('taverna');
  if (tags['amenity'] === 'fast_food' || tags['food'] === 'yes' ||
      description.includes('fast food') || description.includes('snack')) out.add('food');
  if (tags['music'] === 'yes' || tags['live_music'] === 'yes' ||
      description.includes('music') || description.includes('live music')) out.add('music');

  // Activities
  if (tags['snorkeling'] === 'yes' || tags['snorkel'] === 'yes' ||
      description.includes('snorkel') || description.includes('snorkeling')) out.add('snorkeling');
  if (tags['water_sports'] === 'yes' || tags['sport'] === 'surfing' || tags['sport'] === 'windsurfing' || tags['sport'] === 'kitesurfing' ||
      description.includes('surfing') || description.includes('windsurfing') || description.includes('kitesurfing') ||
      description.includes('water sports') || description.includes('watersports')) out.add('water_sports');
  if (tags['family_friendly'] === 'yes' || tags['nudism'] === 'no' || tags['children'] === 'yes' ||
      description.includes('family') || description.includes('children') || description.includes('kids')) out.add('family_friendly');
  if (tags['boat_rental'] === 'yes' || tags['boat'] === 'yes' || tags['ferry'] === 'yes' || tags['boat_trips'] === 'yes' ||
      description.includes('boat') || description.includes('boat rental') || description.includes('boat trips') ||
      description.includes('ferry') || description.includes('sailing')) out.add('boat_trips');
  if (tags['fishing'] === 'yes' || tags['fish'] === 'yes' ||
      description.includes('fishing') || description.includes('fish')) out.add('fishing');
  if (tags['photography'] === 'yes' || tags['photo'] === 'yes' ||
      description.includes('photo') || description.includes('photography') || description.includes('scenic')) out.add('photography');
  if (tags['hiking'] === 'yes' || tags['trail'] === 'yes' ||
      description.includes('hiking') || description.includes('trail') || description.includes('walking')) out.add('hiking');
  if (tags['birdwatching'] === 'yes' || tags['birds'] === 'yes' ||
      description.includes('bird') || description.includes('birdwatching')) out.add('birdwatching');
  if (tags['cliff_jumping'] === 'yes' || tags['cliff'] === 'yes' || tags['jumping'] === 'yes' ||
      description.includes('cliff') || description.includes('jumping') || description.includes('cliff jumping')) out.add('cliff_jumping');

  // Parking detection (add to amenities if available)
  if (tags['parking'] === 'yes' || tags['parking'] === 'free' || tags['parking'] === 'public' ||
      description.includes('parking') || description.includes('car park')) out.add('parking');

  return Array.from(out).filter(k => ALLOWED_AMENITIES.has(k));
};

const inferParking = (tags: Record<string,string|undefined>): 'NONE'|'ROADSIDE'|'SMALL_LOT'|'LARGE_LOT' => {
  // Check parking tags first
  const parking = (tags['parking'] || tags['parking:lane'] || '').toLowerCase();
  const parkingCapacity = tags['parking:capacity'] || '';
  const parkingFee = (tags['parking:fee'] || '').toLowerCase();
  
  // Explicit parking indicators
  if (parking.includes('no') || parking.includes('private') || parking.includes('customers_only')) return 'NONE';
  if (parking.includes('yes') || parking.includes('free') || parking.includes('public')) {
    // If parking is available, try to determine size
    if (parkingCapacity) {
      const capacity = parseInt(parkingCapacity);
      if (capacity > 50) return 'LARGE_LOT';
      if (capacity > 10) return 'SMALL_LOT';
      return 'ROADSIDE';
    }
  }
  
  // Check description for parking clues
  const description = (tags['description'] || tags['note'] || '').toLowerCase();
  if (description.includes('no parking') || description.includes('parking not available')) return 'NONE';
  if (description.includes('large parking') || description.includes('big parking') || 
      description.includes('parking lot') || description.includes('car park')) return 'LARGE_LOT';
  if (description.includes('small parking') || description.includes('limited parking')) return 'SMALL_LOT';
  if (description.includes('roadside parking') || description.includes('street parking')) return 'ROADSIDE';
  if (description.includes('parking available') || description.includes('free parking')) {
    // Default to small lot if parking is mentioned but size unclear
    return 'SMALL_LOT';
  }
  
  // Check access tags
  const access = (tags['access'] || '').toLowerCase();
  if (access.includes('private') || access.includes('no')) return 'NONE';
  
  // Check for parking-related amenities
  if (tags['amenity'] === 'parking' || tags['parking:lane:both'] || tags['parking:lane:left'] || tags['parking:lane:right']) {
    return 'ROADSIDE';
  }
  
  // Check name for parking clues
  const name = (tags['name'] || '').toLowerCase();
  if (name.includes('parking') || name.includes('car park')) return 'SMALL_LOT';
  
  // Default based on beach type and location
  // Organized beaches often have better parking
  if (tags['sunbed'] === 'yes' || tags['umbrella'] === 'yes' || tags['lifeguard'] === 'yes') {
    return 'SMALL_LOT';
  }
  
  // Remote/isolated beaches often have no parking
  if (name.includes('remote') || name.includes('isolated') || description.includes('remote')) {
    return 'NONE';
  }
  
  // Default to ROADSIDE for most beaches
  return 'ROADSIDE';
};

const inferType = (tags: Record<string,string|undefined>): 'SANDY'|'PEBBLY'|'MIXED'|'OTHER' => {
  // Check surface tags first
  const surf = (tags['surface'] || tags['beach:surface'] || tags['natural'] || '').toLowerCase();
  if (surf.includes('sand') || surf.includes('sandy')) return 'SANDY';
  if (surf.includes('pebble') || surf.includes('shingle') || surf.includes('stone') || surf.includes('rock')) return 'PEBBLY';
  if (surf.includes('mixed') || surf.includes('combination')) return 'MIXED';
  
  // Check description for surface clues
  const description = (tags['description'] || tags['note'] || '').toLowerCase();
  
  // Check for mixed surfaces first (most specific)
  if (description.includes('mixed') || description.includes('combination') || 
      (description.includes('sand') && (description.includes('pebble') || description.includes('pebbles') || 
       description.includes('stone') || description.includes('stones')))) return 'MIXED';
  
  // Then check for specific surface types
  if (description.includes('sand') || description.includes('sandy')) return 'SANDY';
  if (description.includes('pebble') || description.includes('pebbles') || description.includes('shingle') || 
      description.includes('stone') || description.includes('stones') || description.includes('rock') || 
      description.includes('rocks') || description.includes('gravel')) return 'PEBBLY';
  
  // Check name for surface clues
  const name = (tags['name'] || tags['name:en'] || '').toLowerCase();
  if (name.includes('sand') || name.includes('sandy')) return 'SANDY';
  if (name.includes('pebble') || name.includes('stone') || name.includes('rock')) return 'PEBBLY';
  
  // Check other relevant tags
  const material = (tags['material'] || tags['beach:material'] || '').toLowerCase();
  if (material.includes('sand')) return 'SANDY';
  if (material.includes('pebble') || material.includes('stone') || material.includes('rock')) return 'PEBBLY';
  
  // Default to OTHER if we can't determine
  return 'OTHER';
};

const inferWaveConditions = (tags: Record<string,string|undefined>): 'CALM'|'MODERATE'|'WAVY'|'SURFABLE' => {
  const wave = (tags['wave'] || tags['surf'] || tags['sea_conditions'] || tags['water'] || '').toLowerCase();
  
  // Direct wave condition indicators
  if (wave.includes('calm') || wave.includes('sheltered') || wave.includes('protected')) return 'CALM';
  if (wave.includes('moderate') || wave.includes('medium')) return 'MODERATE';
  if (wave.includes('wavy') || wave.includes('rough') || wave.includes('choppy')) return 'WAVY';
  if (wave.includes('surf') || wave.includes('surfable') || wave.includes('waves')) return 'SURFABLE';
  
  // Infer from beach type and location
  const beachType = (tags['surface'] || tags['beach:surface'] || '').toLowerCase();
  const location = (tags['name'] || '').toLowerCase();
  
  // Sandy beaches in sheltered areas (bays, coves) are often calm
  if (beachType.includes('sand') && (location.includes('bay') || location.includes('cove') || location.includes('beach'))) {
    return 'CALM';
  }
  
  // Beaches with "surf" in name or surf-related amenities
  if (location.includes('surf') || tags['sport'] === 'surfing' || tags['sport'] === 'windsurfing') {
    return 'SURFABLE';
  }
  
  // Default to MODERATE for most Greek beaches (typical Mediterranean conditions)
  return 'MODERATE';
};

const inferOrganized = (tags: Record<string,string|undefined>) => {
  const description = (tags['description'] || tags['note'] || '').toLowerCase();
  
  // Direct organized beach indicators
  if (tags['sunbed']==='yes' || tags['umbrella']==='yes' || tags['lifeguard']==='yes' || 
      tags['fee']==='yes' || tags['beach']==='resort' || tags['organized']==='yes' ||
      tags['amenity']==='restaurant' || tags['amenity']==='bar') return true;
  
  // Check description for organized beach clues
  if (description.includes('organized') || description.includes('resort') || 
      description.includes('sunbed') || description.includes('umbrella') ||
      description.includes('lifeguard') || description.includes('fee') ||
      description.includes('restaurant') || description.includes('bar') ||
      description.includes('beach bar') || description.includes('taverna')) return true;
  
  // Check for multiple amenities that suggest organization
  const amenities = inferAmenities(tags);
  if (amenities.length >= 3) return true; // Multiple amenities suggest organization
  
  return false;
};

const inferBlueFlag = (tags: Record<string,string|undefined>) => {
  return tags['blue_flag'] === 'yes' || tags['blueflag'] === 'yes' || tags['award'] === 'blue_flag';
};

// Build Overpass QL
const buildOverpassQL = () => {
  const limit = args.limit ? parseInt(args.limit) : undefined;
  const outClause = limit ? `out center tags ${limit};` : 'out center tags;';
  
  if (args.bbox) {
    return `[out:json][timeout:120];
      (
        nwr["natural"="beach"](${args.bbox});
      );
      ${outClause}`;
  }
  const country = (args.country || 'GR').toUpperCase();
  return `[out:json][timeout:180];
    area["ISO3166-1"="${country}"]->.area;
    ( 
      nwr["natural"="beach"](area.area);
    );
    ${outClause}`;
};

type OsmEl = { 
  id: number; 
  type: 'node'|'way'|'relation'; 
  lat?: number; 
  lon?: number; 
  center?: {lat:number; lon:number}; 
  tags?: Record<string,string>; 
};

(async () => {
  console.log('🌊 Fetching beach data from OpenStreetMap...');
  if (args.limit) {
    console.log(`📊 Limiting results to ${args.limit} beaches`);
  }
  
  const ql = buildOverpassQL();
  console.log('Query:', ql);
  
  const res = await fetch(OVERPASS_ENDPOINT, {
    method: 'POST',
    headers: {'Content-Type':'application/x-www-form-urlencoded'},
    body: new URLSearchParams({ data: ql })
  });
  
  if (!res.ok) { 
    console.error('❌ Overpass error:', await res.text()); 
    process.exit(1); 
  }
  
  const json = await res.json() as { elements: OsmEl[] };
  console.log(`📊 Found ${json.elements.length} beach features`);

  // Map OSM → our schema rows
  type Row = {
    slug:string; name:string; area:string; latitude:number; longitude:number;
    type:'SANDY'|'PEBBLY'|'MIXED'|'OTHER';
    wave_conditions:'CALM'|'MODERATE'|'WAVY'|'SURFABLE';
    organized:boolean;
    parking:'NONE'|'ROADSIDE'|'SMALL_LOT'|'LARGE_LOT';
    blue_flag:boolean;
    amenities:string[];
    photo_url:string;
    description:string;
    source:string;
    verified_at?:string;
    status:'DRAFT'|'HIDDEN'|'ACTIVE';
  };

  const placeText = (args.place || 'Greece');
  const rows: Row[] = [];

  for (const el of json.elements) {
    const tags = el.tags || {};
    
    // Choose best available name (prefer English, fallback to local)
    const name = tags['name:en'] || tags['name'] || tags['name:el'] || '';
    if (!name) continue;

    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (lat==null || lon==null) continue;

    const amenities = inferAmenities(tags);
    const parking = inferParking(tags);
    const type = inferType(tags);
    const waveConditions = inferWaveConditions(tags);
    const organized = !!inferOrganized(tags);
    const blueFlag = !!inferBlueFlag(tags);

    // Generate description from available tags
    const descriptionParts: string[] = [];
    if (tags['description']) descriptionParts.push(tags['description']);
    if (tags['note']) descriptionParts.push(tags['note']);
    if (tags['access']) descriptionParts.push(`Access: ${tags['access']}`);
    if (tags['fee'] === 'yes') descriptionParts.push('Entry fee required');
    
    const row: Row = {
      slug: slugify(`${name}`),
      name,
      area: placeText,
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lon.toFixed(6)),
      type,
      wave_conditions: waveConditions,
      organized,
      parking,
      blue_flag: blueFlag,
      amenities,
      photo_url: 'https://placehold.co/1200x675?text=Beach',
      description: descriptionParts.join('; '),
      source: 'osm',
      verified_at: undefined,
      status: 'DRAFT'
    };
    rows.push(row);
  }

  console.log(`🔄 Processing ${rows.length} beaches...`);

  // De-duplication: same slug within 0.3 km → keep the one with more amenities
  const deduped: Row[] = [];
  for (const r of rows) {
    const dupIdx = deduped.findIndex(x =>
      x.slug === r.slug &&
      haversineKm([x.latitude,x.longitude],[r.latitude,r.longitude]) <= 0.3
    );
    if (dupIdx === -1) {
      deduped.push(r);
    } else {
      // Keep richer record (more amenities, or if equal, keep first)
      if (r.amenities.length > deduped[dupIdx].amenities.length) {
        deduped[dupIdx] = r;
      }
    }
  }

  console.log(`✨ Deduplicated to ${deduped.length} unique beaches`);

  // CSV serialize with your exact header order
  const header = [
    'slug','name','area','latitude','longitude','type','wave_conditions',
    'organized','parking','blue_flag','amenities','photo_url','description',
    'source','verified_at','status'
  ] as const;

  const lines = [header.join(',')];
  for (const r of deduped) {
    const vals = [
      r.slug,
      r.name.replaceAll('"','""'),
      r.area.replaceAll('"','""'),
      String(r.latitude),
      String(r.longitude),
      r.type,
      r.wave_conditions, // Always has a value now
      String(r.organized),
      r.parking,
      String(r.blue_flag),
      r.amenities.join(','), // Use comma as per your schema
      r.photo_url,
      r.description.replaceAll('"','""'),
      r.source,
      r.verified_at ?? '',
      r.status
    ];
    // Wrap fields that may contain commas with quotes
    const csvRow = vals.map(v => (v.includes(',') || v.includes('"')) ? `"${v}"` : v).join(',');
    lines.push(csvRow);
  }

  const outPath = path.resolve(process.cwd(), args.out as string);
  await fs.writeFile(outPath, lines.join('\n'), 'utf8');
  
  console.log(`✅ Wrote ${deduped.length} beaches to ${outPath}`);
  console.log(`📁 File saved at: ${outPath}`);
  
  // Show some stats
  const stats = {
    sandy: deduped.filter(r => r.type === 'SANDY').length,
    pebbly: deduped.filter(r => r.type === 'PEBBLY').length,
    mixed: deduped.filter(r => r.type === 'MIXED').length,
    other: deduped.filter(r => r.type === 'OTHER').length,
    organized: deduped.filter(r => r.organized).length,
    blueFlag: deduped.filter(r => r.blue_flag).length,
    withAmenities: deduped.filter(r => r.amenities.length > 0).length
  };
  
  console.log('\n📈 Beach Statistics:');
  console.log(`  🏖️  Sandy: ${stats.sandy}`);
  console.log(`  🪨 Pebbly: ${stats.pebbly}`);
  console.log(`  🔀 Mixed: ${stats.mixed}`);
  console.log(`  ❓ Other: ${stats.other}`);
  console.log(`  🏢 Organized: ${stats.organized}`);
  console.log(`  🏆 Blue Flag: ${stats.blueFlag}`);
  console.log(`  🎯 With Amenities: ${stats.withAmenities}`);
})();
