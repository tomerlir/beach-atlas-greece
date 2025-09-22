/**
 * Accessibility utilities for WCAG 2.1 AA compliance
 */

/**
 * Generates meaningful alt-text for beach images
 * Ensures WCAG 2.1 AA compliance by providing descriptive alternative text
 */
export function generateBeachImageAltText(beach: {
  name: string;
  area: string;
  type?: string;
  wave_conditions?: string;
  blue_flag?: boolean;
}): string {
  const { name, area, type, wave_conditions, blue_flag } = beach;
  
  // Base description with beach name and location
  let altText = `${name} beach in ${area}`;
  
  // Add beach type if available
  if (type && type !== 'OTHER') {
    const typeDescription = type.toLowerCase().replace('_', ' ');
    altText += `, featuring a ${typeDescription} shoreline`;
  }
  
  // Add wave conditions if available
  if (wave_conditions) {
    const waveDescription = wave_conditions.toLowerCase();
    altText += ` with ${waveDescription} water conditions`;
  }
  
  // Add blue flag status if available
  if (blue_flag) {
    altText += `, certified with Blue Flag status for environmental quality`;
  }
  
  return altText;
}

/**
 * Generates alt-text for generic beach images when specific beach data is not available
 */
export function generateGenericBeachAltText(beachName?: string, location?: string): string {
  if (beachName && location) {
    return `${beachName} beach in ${location}`;
  } else if (beachName) {
    return `${beachName} beach`;
  } else if (location) {
    return `Beach in ${location}`;
  } else {
    return 'Beach landscape';
  }
}

