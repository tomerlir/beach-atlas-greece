/**
 * Named Entity Recognition Module
 * Specialized for beach and location entities
 */

import { TextProcessor, ProcessedText } from './TextProcessor';

export interface BeachEntity {
  text: string;
  type: 'place' | 'amenity' | 'beach_type' | 'wave_condition' | 'parking' | 'organization';
  confidence: number;
  normalized: string;
}

export interface EntityRecognitionResult {
  places: BeachEntity[];
  amenities: BeachEntity[];
  beachTypes: BeachEntity[];
  waveConditions: BeachEntity[];
  parking: BeachEntity[];
  organization: BeachEntity[];
  all: BeachEntity[];
}

export class EntityRecognizer {
  private static instance: EntityRecognizer;
  private textProcessor: TextProcessor;
  
  // Enhanced entity patterns
  private placePatterns = new Map<string, RegExp>();
  private amenityPatterns = new Map<string, RegExp>();
  private beachTypePatterns = new Map<string, RegExp>();
  private waveConditionPatterns = new Map<string, RegExp>();
  private parkingPatterns = new Map<string, RegExp>();
  private organizationPatterns = new Map<string, RegExp>();

  private constructor() {
    this.textProcessor = TextProcessor.getInstance();
    this.initializePatterns();
  }

  public static getInstance(): EntityRecognizer {
    if (!EntityRecognizer.instance) {
      EntityRecognizer.instance = new EntityRecognizer();
    }
    return EntityRecognizer.instance;
  }

  /**
   * Initialize entity recognition patterns
   */
  private initializePatterns(): void {
    // Place patterns
    this.placePatterns.set('crete', /\bcrete\b/i);
    this.placePatterns.set('corfu', /\bcorfu\b/i);
    this.placePatterns.set('mykonos', /\bmykonos\b/i);
    this.placePatterns.set('santorini', /\bsantorini\b/i);
    this.placePatterns.set('rhodes', /\brhodes\b/i);
    this.placePatterns.set('zakynthos', /\bzakynthos\b/i);
    this.placePatterns.set('kefalonia', /\bkefalonia\b/i);
    this.placePatterns.set('paros', /\bparos\b/i);
    this.placePatterns.set('naxos', /\bnaxos\b/i);
    this.placePatterns.set('ios', /\bios\b/i);
    this.placePatterns.set('milos', /\bmilos\b/i);
    this.placePatterns.set('sifnos', /\bsifnos\b/i);
    this.placePatterns.set('folegandros', /\bfolegandros\b/i);
    this.placePatterns.set('amorgos', /\bamorgos\b/i);
    this.placePatterns.set('skiathos', /\bskiathos\b/i);
    this.placePatterns.set('skopelos', /\bskopelos\b/i);
    this.placePatterns.set('alonissos', /\balonissos\b/i);
    this.placePatterns.set('lesbos', /\blesbos\b/i);
    this.placePatterns.set('chios', /\bchios\b/i);
    this.placePatterns.set('samos', /\bsamos\b/i);
    this.placePatterns.set('kos', /\bkos\b/i);
    this.placePatterns.set('patmos', /\bpatmos\b/i);
    this.placePatterns.set('syros', /\bsyros\b/i);
    this.placePatterns.set('tinos', /\btinos\b/i);
    this.placePatterns.set('andros', /\bandros\b/i);
    this.placePatterns.set('kea', /\bkea\b/i);
    this.placePatterns.set('kythnos', /\bkythnos\b/i);
    
    // Major Greek cities and regions
    this.placePatterns.set('attica', /\b(athens?|attica)\b/i);
    this.placePatterns.set('chalkidiki', /\b(thessaloniki|chalkidiki)\b/i);
    this.placePatterns.set('patras', /\bpatras?\b/i);
    this.placePatterns.set('heraklion', /\bheraklion\b/i);
    this.placePatterns.set('larissa', /\blarissa\b/i);
    this.placePatterns.set('volos', /\bvolos\b/i);
    this.placePatterns.set('ioannina', /\bioannina\b/i);
    this.placePatterns.set('kavala', /\bkavala\b/i);
    this.placePatterns.set('serres', /\bserres\b/i);
    this.placePatterns.set('drama', /\bdrama\b/i);
    this.placePatterns.set('alexandroupoli', /\balexandroupoli\b/i);
    this.placePatterns.set('komotini', /\bkomotini\b/i);
    this.placePatterns.set('xanthi', /\bxanthi\b/i);
    this.placePatterns.set('katerini', /\bkaterini\b/i);
    this.placePatterns.set('trikala', /\btrikala\b/i);
    this.placePatterns.set('lamia', /\blamia\b/i);
    this.placePatterns.set('agrinio', /\bagrinio\b/i);
    this.placePatterns.set('kalamata', /\bkalamata\b/i);
    this.placePatterns.set('sparti', /\bsparti\b/i);
    this.placePatterns.set('tripoli', /\btripoli\b/i);
    this.placePatterns.set('corinth', /\bcorinth\b/i);
    this.placePatterns.set('argos', /\bargos\b/i);
    this.placePatterns.set('nafplio', /\bnafplio\b/i);
    this.placePatterns.set('mycenae', /\bmycenae\b/i);
    this.placePatterns.set('epidaurus', /\bepidaurus\b/i);
    this.placePatterns.set('olympia', /\bolympia\b/i);
    this.placePatterns.set('delphi', /\bdelphi\b/i);
    this.placePatterns.set('meteora', /\bmeteora\b/i);
    this.placePatterns.set('mount athos', /\bmount\s+athos\b/i);
    
    // Additional popular destinations
    this.placePatterns.set('lefkada', /\blefkada\b/i);
    this.placePatterns.set('ithaca', /\bithaca\b/i);
    this.placePatterns.set('kythira', /\bkythira\b/i);
    this.placePatterns.set('antikythera', /\bantikythera\b/i);
    this.placePatterns.set('hydra', /\bhydra\b/i);
    this.placePatterns.set('spetses', /\bspetses\b/i);
    this.placePatterns.set('poros', /\bporos\b/i);
    this.placePatterns.set('aegina', /\baegina\b/i);
    this.placePatterns.set('salamis', /\bsalamis\b/i);
    this.placePatterns.set('evia', /\bevia\b/i);
    this.placePatterns.set('skyros', /\bskyros\b/i);
    this.placePatterns.set('limnos', /\blimnos\b/i);
    this.placePatterns.set('thasos', /\bthasos\b/i);
    this.placePatterns.set('samothrace', /\bsamothrace\b/i);
    this.placePatterns.set('lesvos', /\blesvos\b/i);
    this.placePatterns.set('psara', /\bpsara\b/i);
    this.placePatterns.set('ikaria', /\bikaria\b/i);
    this.placePatterns.set('fourni', /\bfourni\b/i);
    this.placePatterns.set('lipsi', /\blipsi\b/i);
    this.placePatterns.set('kalymnos', /\bkalymnos\b/i);
    this.placePatterns.set('nissyros', /\bnissyros\b/i);
    this.placePatterns.set('tilos', /\btilos\b/i);
    this.placePatterns.set('symi', /\bsymi\b/i);
    this.placePatterns.set('karpathos', /\bkarpathos\b/i);
    this.placePatterns.set('kasos', /\bkasos\b/i);
    this.placePatterns.set('kastellorizo', /\bkastellorizo\b/i);
    this.placePatterns.set('gavdos', /\bgavdos\b/i);

    // Amenity patterns - enhanced to match exact database values
    this.amenityPatterns.set('sunbeds', /\b(sunbeds?|sun\s+beds?|beach\s+beds?|loungers?|beach\s+chairs?|deck\s+chairs?)\b/i);
    this.amenityPatterns.set('umbrellas', /\b(umbrellas?|sun\s+umbrellas?|beach\s+umbrellas?|parasols?|shade\s+umbrellas?)\b/i);
    this.amenityPatterns.set('showers', /\b(showers?|fresh\s+water\s+showers?|outdoor\s+showers?|beach\s+showers?|rinse\s+off)\b/i);
    this.amenityPatterns.set('toilets', /\b(toilets?|restrooms?|bathrooms?|wc|washrooms?|facilities)\b/i);
    this.amenityPatterns.set('lifeguard', /\b(lifeguards?|lifeguard\s+service|lifeguard\s+on\s+duty|lifesaving|safety\s+patrol|beach\s+safety)\b/i);
    this.amenityPatterns.set('beach_bar', /\b(beach\s+bars?|beachside\s+bars?|seaside\s+bars?|beach\s+club|bar\s+on\s+beach)\b/i);
    this.amenityPatterns.set('taverna', /\b(tavernas?|greek\s+tavernas?|traditional\s+tavernas?|restaurants?|greek\s+restaurants?|local\s+restaurants?)\b/i);
    this.amenityPatterns.set('food', /\b(food|snacks?|refreshments?|cafes?|cafés?|eateries?|dining|meals?)\b/i);
    this.amenityPatterns.set('music', /\b(music|live\s+music|dj|entertainment|beach\s+music|background\s+music)\b/i);
    this.amenityPatterns.set('snorkeling', /\b(snorkeling|snorkelling|snorkel\s+gear|snorkel\s+equipment|underwater\s+exploration|marine\s+life)\b/i);
    this.amenityPatterns.set('water_sports', /\b(water\s+sports|aquatic\s+activities|sea\s+sports|marine\s+activities|water\s+activities)\b/i);
    this.amenityPatterns.set('family_friendly', /\b(family\s+friendly|family-friendly|good\s+for\s+families|child\s+friendly|kids\s+friendly|suitable\s+for\s+children|for\s+families|families)\b/i);
    this.amenityPatterns.set('boat_trips', /\b(boat\s+trips?|boat\s+tours?|boat\s+excursions?|sailing|boat\s+rides?|marine\s+tours?)\b/i);
    this.amenityPatterns.set('fishing', /\b(fishing|fish|fishing\s+spots?|good\s+for\s+fishing|anglers?|fishing\s+opportunities)\b/i);
    this.amenityPatterns.set('photography', /\b(photography|photos?|pictures?|instagram|selfies?|instagrammable|scenic|picturesque|photo\s+opportunities|photogenic)\b/i);
    this.amenityPatterns.set('hiking', /\b(hiking|hike|hiking\s+trails?|walking\s+trails?|nature\s+walks?|trekking|trails?)\b/i);
    this.amenityPatterns.set('birdwatching', /\b(birdwatching|bird\s+watch|birds?|bird\s+spotting|ornithology|bird\s+observation)\b/i);
    this.amenityPatterns.set('cliff_jumping', /\b(cliff\s+jumping|cliff\s+dive|cliff\s+diving|rock\s+jumping|high\s+diving|cliff\s+leaping)\b/i);

    // Beach type patterns - enhanced to match exact database values
    this.beachTypePatterns.set('SANDY', /\b(white\s+sand|golden\s+sand|sandy\s+beach|sand\s+beach|sandy|sand|fine\s+sand|soft\s+sand|powder\s+sand|beach\s+sand)\b/i);
    this.beachTypePatterns.set('PEBBLY', /\b(pebble\s+beach|stone\s+beach|stony\s+beach|pebbly|pebble|pebbles|stony|rocky\s+pebbles|small\s+stones|gravel)\b/i);
    this.beachTypePatterns.set('MIXED', /\b(mixed\s+sand|sand\s+and\s+pebbles|mixed|combination|both\s+sand\s+and\s+pebbles|varied\s+surface)\b/i);
    this.beachTypePatterns.set('OTHER', /\b(rocky\s+beach|concrete\s+beach|man\s+made|artificial\s+beach|rocky|rocks|rock|platform|deck|pier|marina)\b/i);

    // Wave condition patterns - enhanced to match exact database values
    this.waveConditionPatterns.set('CALM', /\b(calm\s+water|calm\s+waters|calm\s+sea|still\s+water|peaceful\s+water|quiet\s+water|gentle\s+water|flat\s+water|shallow\s+water|shallow\s+waters|protected\s+beach|sheltered\s+beach|calm|still|peaceful|quiet|gentle|flat|shallow|mirror\s+like|glass\s+like|serene)\b/i);
    this.waveConditionPatterns.set('MODERATE', /\b(moderate\s+waves|medium\s+waves|moderate|medium|normal\s+waves|average\s+waves|light\s+waves|small\s+waves)\b/i);
    this.waveConditionPatterns.set('WAVY', /\b(big\s+waves|large\s+waves|strong\s+waves|rough\s+sea|choppy\s+water|wavy|waves|wave|choppy|rough|windy|powerful\s+waves|high\s+waves|stormy)\b/i);
    this.waveConditionPatterns.set('SURFABLE', /\b(good\s+for\s+surfing|waves\s+for\s+surfing|surfing\s+beach|body\s+surf|bodysurf|surf|surfing|surfable|surf\s+spot|surf\s+break|wave\s+riding)\b/i);

    // Parking patterns - enhanced to match exact database values with priority order
    // Order matters: more specific patterns first to avoid conflicts
    this.parkingPatterns.set('NONE', /\b(no\s+parking|without\s+parking|no\s+car\s+access|no\s+vehicle\s+access|walk\s+only|no\s+parking\s+available)\b/i);
    this.parkingPatterns.set('ROADSIDE', /\b(roadside\s+parking|street\s+parking|on\s+street\s+parking|road\s+parking|side\s+of\s+road|along\s+road)\b/i);
    this.parkingPatterns.set('SMALL_LOT', /\b(limited\s+parking|small\s+parking|few\s+spaces|small\s+lot|limited\s+spaces|restricted\s+parking)\b/i);
    this.parkingPatterns.set('LARGE_LOT', /\b(large\s+parking|ample\s+parking|plenty\s+of\s+parking|easy\s+parking|free\s+parking|large\s+lot|big\s+parking|extensive\s+parking|parking\s+lot|parking)\b/i);

    // Organization patterns
    this.organizationPatterns.set('organized', /\b(organized\s+beach|organized|organised)\b/i);
    this.organizationPatterns.set('unorganized', /\b(unorganized\s+beach|unorganized|unorganised|not\s+organized|wild\s+beach|natural\s+beach|undeveloped\s+beach|wild|natural)\b/i);
  }

  /**
   * Recognize entities in text
   */
  public async recognizeEntities(text: string): Promise<EntityRecognitionResult> {
    // Handle null/undefined input gracefully
    if (!text || typeof text !== 'string') {
      text = '';
    }
    
    const processedText = await this.textProcessor.processText(text);
    
    const result: EntityRecognitionResult = {
      places: [],
      amenities: [],
      beachTypes: [],
      waveConditions: [],
      parking: [],
      organization: [],
      all: []
    };

    // Recognize places
    result.places = this.recognizePlaces(text);
    
    // Recognize amenities
    result.amenities = this.recognizeAmenities(text);
    
    // Recognize beach types
    result.beachTypes = this.recognizeBeachTypes(text);
    
    // Recognize wave conditions
    result.waveConditions = this.recognizeWaveConditions(text);
    
    // Recognize parking
    result.parking = this.recognizeParking(text);
    
    // Recognize organization
    result.organization = this.recognizeOrganization(text);

    // Combine all entities
    result.all = [
      ...result.places,
      ...result.amenities,
      ...result.beachTypes,
      ...result.waveConditions,
      ...result.parking,
      ...result.organization
    ];

    return result;
  }

  /**
   * Recognize place entities
   */
  private recognizePlaces(text: string): BeachEntity[] {
    const entities: BeachEntity[] = [];
    
    for (const [place, pattern] of this.placePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        entities.push({
          text: matches[0],
          type: 'place',
          confidence: 0.95,
          normalized: place
        });
      }
    }

    return entities;
  }

  /**
   * Recognize amenity entities
   */
  private recognizeAmenities(text: string): BeachEntity[] {
    const entities: BeachEntity[] = [];
    
    for (const [amenity, pattern] of this.amenityPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        entities.push({
          text: matches[0],
          type: 'amenity',
          confidence: 0.9,
          normalized: amenity
        });
      }
    }

    return entities;
  }

  /**
   * Recognize beach type entities
   */
  private recognizeBeachTypes(text: string): BeachEntity[] {
    const entities: BeachEntity[] = [];
    
    for (const [type, pattern] of this.beachTypePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        entities.push({
          text: matches[0],
          type: 'beach_type',
          confidence: 0.9,
          normalized: type
        });
      }
    }

    return entities;
  }

  /**
   * Recognize wave condition entities
   */
  private recognizeWaveConditions(text: string): BeachEntity[] {
    const entities: BeachEntity[] = [];
    
    for (const [condition, pattern] of this.waveConditionPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        entities.push({
          text: matches[0],
          type: 'wave_condition',
          confidence: 0.9,
          normalized: condition
        });
      }
    }

    return entities;
  }

  /**
   * Recognize parking entities with priority handling
   */
  private recognizeParking(text: string): BeachEntity[] {
    const entities: BeachEntity[] = [];
    const matchedPositions = new Set<number>();
    
    // Process in priority order (more specific first)
    const priorityOrder = ['NONE', 'ROADSIDE', 'SMALL_LOT', 'LARGE_LOT'];
    
    for (const parking of priorityOrder) {
      const pattern = this.parkingPatterns.get(parking);
      if (pattern) {
        const matches = text.match(pattern);
        if (matches) {
          const matchStart = text.indexOf(matches[0]);
          const matchEnd = matchStart + matches[0].length;
          
          // Check if this match overlaps with any previously matched position
          let hasOverlap = false;
          for (let pos = matchStart; pos < matchEnd; pos++) {
            if (matchedPositions.has(pos)) {
              hasOverlap = true;
              break;
            }
          }
          
          if (!hasOverlap) {
            entities.push({
              text: matches[0],
              type: 'parking',
              confidence: 0.9,
              normalized: parking
            });
            
            // Mark these positions as matched
            for (let pos = matchStart; pos < matchEnd; pos++) {
              matchedPositions.add(pos);
            }
          }
        }
      }
    }

    return entities;
  }

  /**
   * Recognize organization entities
   */
  private recognizeOrganization(text: string): BeachEntity[] {
    const entities: BeachEntity[] = [];
    
    for (const [org, pattern] of this.organizationPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        entities.push({
          text: matches[0],
          type: 'organization',
          confidence: 0.9,
          normalized: org
        });
      }
    }

    return entities;
  }

  /**
   * Add custom place patterns
   */
  public addPlacePattern(place: string, pattern: RegExp): void {
    this.placePatterns.set(place.toLowerCase(), pattern);
  }

  /**
   * Add custom amenity patterns
   */
  public addAmenityPattern(amenity: string, pattern: RegExp): void {
    this.amenityPatterns.set(amenity, pattern);
  }
}
