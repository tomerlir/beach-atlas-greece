import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { downloadCsv, generateFilename } from '@/utils/csv/download';
import { dbRowToCsvRow } from '@/utils/csv/beachCsvSchema';
import { useToast } from '@/hooks/use-toast';

const ExportCsvCard: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Fetch all beaches from Supabase
      const { data: beaches, error } = await supabase
        .from('beaches')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      if (!beaches || beaches.length === 0) {
        toast({
          title: 'No Data',
          description: 'No beaches found to export.',
          variant: 'destructive'
        });
        return;
      }

      // Convert database rows to CSV format
      const csvRows = beaches.map(dbRowToCsvRow);

      // Generate filename and download
      const filename = generateFilename('beaches');
      downloadCsv(filename, csvRows);

      toast({
        title: 'Export Successful',
        description: `Exported ${beaches.length} beaches to ${filename}`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export CSV
        </CardTitle>
        <CardDescription>
          Download all beaches in CSV format with fixed column order
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>• All beaches, all statuses</p>
          <p>• Column order fixed</p>
          <p>• Includes: slug, name, area, coordinates, type, amenities, etc.</p>
        </div>
        
        <Button 
          onClick={handleExport} 
          disabled={isExporting}
          className="w-full"
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ExportCsvCard;
