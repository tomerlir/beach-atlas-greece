import React, { useState } from 'react';
import { Upload, Download, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ExportCsvCard from '@/components/admin/ExportCsvCard';
import ImportCsvModal from '@/components/admin/ImportCsvModal';
import { AMENITY_MAP } from '@/lib/amenities';

const ImportExport: React.FC = () => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [copiedColumnOrder, setCopiedColumnOrder] = useState(false);
  const { toast } = useToast();

  const columnOrder = 'slug,name,place_text,latitude,longitude,type,wave_conditions,organized,parking,blue_flag,amenities,photo_url,description,source,verified_at,status';

  const handleCopyColumnOrder = async () => {
    try {
      await navigator.clipboard.writeText(columnOrder);
      setCopiedColumnOrder(true);
      toast({
        title: 'Copied!',
        description: 'Column order copied to clipboard',
      });
      setTimeout(() => setCopiedColumnOrder(false), 2000);
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy to clipboard',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Import & Export</h1>
        <p className="text-muted-foreground mt-1">
          Manage beach data through CSV import and export
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export Card */}
        <ExportCsvCard />

        {/* Import Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import CSV
            </CardTitle>
            <CardDescription>
              Upload CSV file with beach data for import with validation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>• Dry-run preview with validation</p>
              <p>• Chunked upserts by slug</p>
              <p>• Blank cells don't overwrite existing data</p>
              <p>• Strict validation with error reporting</p>
            </div>
            
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </button>
          </CardContent>
        </Card>
      </div>

      {/* CSV Format Information */}
      <Card>
        <CardHeader>
          <CardTitle>CSV Format Requirements</CardTitle>
          <CardDescription>
            Required column order and data format for import/export
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Fixed Column Order:</h4>
              <div className="relative bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto">
                <div className="whitespace-nowrap pr-8">
                  {columnOrder}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyColumnOrder}
                  className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-muted-foreground/10"
                >
                  {copiedColumnOrder ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Data Types:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• <strong>Booleans:</strong> true|false (case-insensitive)</li>
                  <li>• <strong>Numbers:</strong> latitude (-90 to 90), longitude (-180 to 180)</li>
                  <li>• <strong>Dates:</strong> ISO format (YYYY-MM-DDTHH:mm:ssZ) or empty</li>
                  <li>• <strong>Amenities:</strong> comma-separated keys</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Enum Values:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• <strong>type:</strong> SANDY|PEBBLY|MIXED|OTHER</li>
                  <li>• <strong>wave_conditions:</strong> CALM|MODERATE|WAVY|SURFABLE</li>
                  <li>• <strong>parking:</strong> NONE|ROADSIDE|SMALL_LOT|LARGE_LOT</li>
                  <li>• <strong>status:</strong> ACTIVE|HIDDEN|DRAFT</li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Allowed Amenities:</h4>
              <div className="text-sm text-muted-foreground break-words">
                {Object.keys(AMENITY_MAP).join(', ')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Modal */}
      <ImportCsvModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};

export default ImportExport;
