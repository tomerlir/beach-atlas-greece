import { CSV_HEADER_ORDER } from './beachCsvSchema';

/**
 * Downloads CSV data as a file
 * @param filename - The name of the file to download
 * @param rows - Array of data rows
 * @param headers - Array of header names (optional, defaults to CSV_HEADER_ORDER)
 */
export function downloadCsv(
  filename: string, 
  rows: Record<string, any>[], 
  headers: string[] = CSV_HEADER_ORDER
): void {
  try {
    // Create CSV content
    const csvContent = createCsvContent(rows, headers);
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      // Create object URL
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up object URL
      URL.revokeObjectURL(url);
    } else {
      // Fallback for older browsers
      throw new Error('Download not supported in this browser');
    }
  } catch (error) {
    console.error('Error downloading CSV:', error);
    throw new Error(`Failed to download CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Creates CSV content from rows and headers
 * @param rows - Array of data rows
 * @param headers - Array of header names
 * @returns CSV string
 */
function createCsvContent(rows: Record<string, any>[], headers: string[]): string {
  // Escape CSV field value
  function escapeCsvField(field: any): string {
    if (field === null || field === undefined) {
      return '';
    }
    
    const str = String(field);
    
    // If field contains comma, newline, or quote, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    
    return str;
  }
  
  // Create header row
  const headerRow = headers.map(escapeCsvField).join(',');
  
  // Create data rows
  const dataRows = rows.map(row => 
    headers.map(header => escapeCsvField(row[header])).join(',')
  );
  
  // Combine header and data rows
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Generates a filename with current date
 * @param prefix - Filename prefix
 * @param extension - File extension (default: 'csv')
 * @returns Formatted filename
 */
export function generateFilename(prefix: string, extension: string = 'csv'): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
  return `${prefix}-${dateStr}.${extension}`;
}
