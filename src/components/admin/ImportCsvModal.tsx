import React, { useState, useRef, useCallback } from "react";
import { Upload, AlertCircle, CheckCircle, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { authSupabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAreas } from "@/hooks/useAreas";
import Papa from "papaparse";
import {
  normalizeRow,
  classify,
  ValidationError,
  ClassificationResult,
  csvRowToDbInsert,
  csvRowToDbUpdate,
} from "@/utils/csv/beachCsvSchema";
import { CsvRowData } from "@/utils/csv/download";

// Type for Papa Parse results that matches our CSV structure
type ParsedCsvRow = CsvRowData & Record<string, string>;

interface ImportSummary {
  totalRows: number;
  uniqueSlugs: number;
  createCount: number;
  updateCount: number;
  skipCount: number;
  errorCount: number;
  errors: ValidationError[];
}

interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImportCsvModal: React.FC<ImportCsvModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "complete">("upload");
  const [_file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCsvRow[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [previewRows, setPreviewRows] = useState<ClassificationResult[]>([]);
  const [_existingSlugs, setExistingSlugs] = useState<Set<string>>(new Set());
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    created: number;
    updated: number;
    errors: number;
  }>({ created: 0, updated: 0, errors: 0 });
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch areas for area_id mapping
  const { data: areas = [] } = useAreas();

  const resetModal = useCallback(() => {
    setStep("upload");
    setFile(null);
    setParsedData([]);
    setSummary(null);
    setPreviewRows([]);
    setExistingSlugs(new Set());
    setImportProgress(0);
    setImportResults({ created: 0, updated: 0, errors: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleClose = useCallback(() => {
    if (step === "preview" && parsedData.length > 0) {
      if (window.confirm("Are you sure you want to close? All parsed data will be lost.")) {
        resetModal();
        onClose();
      }
    } else {
      resetModal();
      onClose();
    }
  }, [step, parsedData.length, resetModal, onClose]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file.",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    parseCsvFile(selectedFile);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    const files = event.dataTransfer.files;
    if (files.length === 0) return;

    const droppedFile = files[0];
    if (!droppedFile.name.toLowerCase().endsWith(".csv")) {
      toast({
        title: "Invalid File",
        description: "Please drop a CSV file.",
        variant: "destructive",
      });
      return;
    }

    setFile(droppedFile);
    parseCsvFile(droppedFile);
  };

  const parseCsvFile = async (file: File) => {
    try {
      // Parse CSV file
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          if (results.errors.length > 0) {
            toast({
              title: "Parse Error",
              description: `Failed to parse CSV: ${results.errors[0].message}`,
              variant: "destructive",
            });
            return;
          }

          const csvData = results.data as ParsedCsvRow[];
          setParsedData(csvData);
          await performDryRun(csvData);
        },
        error: (error) => {
          toast({
            title: "Parse Error",
            description: `Failed to parse CSV: ${error.message}`,
            variant: "destructive",
          });
        },
      });
    } catch (error) {
      toast({
        title: "Parse Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const performDryRun = async (data: ParsedCsvRow[]) => {
    try {
      // Fetch existing slugs
      const { data: existingBeaches, error } = await authSupabase.from("beaches").select("slug");

      if (error) throw error;

      const slugs = new Set(existingBeaches?.map((b) => b.slug) || []);
      setExistingSlugs(slugs);

      // Process each row
      const seenSlugs = new Set<string>();
      const results: ClassificationResult[] = [];
      const allErrors: ValidationError[] = [];
      let createCount = 0;
      let updateCount = 0;
      let skipCount = 0;
      let errorCount = 0;

      for (let i = 0; i < data.length; i++) {
        const rawRow = data[i];
        const normalizedResult = normalizeRow(rawRow, i + 1);

        if (normalizedResult.classification === "error") {
          errorCount++;
          allErrors.push(...normalizedResult.errors);
          results.push(normalizedResult);
          continue;
        }

        if (!normalizedResult.normalizedRow) {
          errorCount++;
          allErrors.push({
            row: i + 1,
            column: "general",
            message: "Failed to normalize row",
            value: JSON.stringify(rawRow),
          });
          results.push({
            classification: "error",
            errors: [
              {
                row: i + 1,
                column: "general",
                message: "Failed to normalize row",
                value: JSON.stringify(rawRow),
              },
            ],
          });
          continue;
        }

        const classificationResult = classify(
          slugs,
          normalizedResult.normalizedRow,
          i + 1,
          seenSlugs
        );

        if (classificationResult.classification === "error") {
          errorCount++;
          allErrors.push(...classificationResult.errors);
        } else if (classificationResult.classification === "create") {
          createCount++;
        } else if (classificationResult.classification === "update") {
          updateCount++;
        } else {
          skipCount++;
        }

        results.push(classificationResult);
      }

      // Set summary
      setSummary({
        totalRows: data.length,
        uniqueSlugs: seenSlugs.size,
        createCount,
        updateCount,
        skipCount,
        errorCount,
        errors: allErrors.slice(0, 30), // Limit to 30 errors for display
      });

      // Set preview rows (first 20)
      setPreviewRows(results.slice(0, 20));
      setStep("preview");
    } catch (error) {
      toast({
        title: "Dry Run Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    if (!summary || summary.errorCount > 0) {
      toast({
        title: "Cannot Import",
        description: "Please fix all errors before importing.",
        variant: "destructive",
      });
      return;
    }

    if (
      !window.confirm(
        "This will upsert by slug. Blank cells do not overwrite existing data. Proceed?"
      )
    ) {
      return;
    }

    setStep("importing");
    setImportProgress(0);

    try {
      const validRows = previewRows.filter((r) => r.classification !== "error" && r.normalizedRow);
      const chunkSize = 200;
      let created = 0;
      let updated = 0;
      let errors = 0;

      for (let i = 0; i < validRows.length; i += chunkSize) {
        const chunk = validRows.slice(i, i + chunkSize);
        const creates = chunk.filter((r) => r.classification === "create");
        const updates = chunk.filter((r) => r.classification === "update");

        // Process creates
        if (creates.length > 0) {
          // Create area name to area_id mapping
          const areaIdMap = areas.reduce(
            (acc, area) => {
              acc[area.name] = area.id;
              return acc;
            },
            {} as Record<string, string>
          );

          const createData = creates.map((r) => csvRowToDbInsert(r.normalizedRow!, areaIdMap));
          const { error: createError } = await authSupabase.from("beaches").insert(createData);

          if (createError) {
            console.error("Create error:", createError);
            errors += creates.length;
          } else {
            created += creates.length;
          }
        }

        // Process updates
        for (const update of updates) {
          // Create area name to area_id mapping
          const areaIdMap = areas.reduce(
            (acc, area) => {
              acc[area.name] = area.id;
              return acc;
            },
            {} as Record<string, string>
          );

          const updateData = csvRowToDbUpdate(update.normalizedRow!, areaIdMap);
          const { error: updateError } = await authSupabase
            .from("beaches")
            .update(updateData)
            .eq("slug", update.normalizedRow!.slug);

          if (updateError) {
            console.error("Update error:", updateError);
            errors++;
          } else {
            updated++;
          }
        }

        setImportProgress(Math.round(((i + chunkSize) / validRows.length) * 100));
        setImportResults({ created, updated, errors });
      }

      setStep("complete");
      toast({
        title: "Import Complete",
        description: `Created: ${created}, Updated: ${updated}, Errors: ${errors}`,
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      setStep("preview");
    }
  };

  const getClassificationBadge = (classification: string) => {
    switch (classification) {
      case "create":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Create
          </Badge>
        );
      case "update":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            Update
          </Badge>
        );
      case "skip":
        return <Badge variant="secondary">Skip</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">{classification}</Badge>;
    }
  };

  const renderUploadStep = () => (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload
          className={`mx-auto h-12 w-12 mb-4 transition-colors ${
            isDragOver ? "text-primary" : "text-muted-foreground"
          }`}
        />
        <div className="space-y-2">
          <h3 className="text-lg font-medium">
            {isDragOver ? "Drop CSV file here" : "Upload CSV File"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isDragOver
              ? "Release to upload the file"
              : "Drag and drop a CSV file or click to select"}
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="mt-4"
        >
          <FileText className="mr-2 h-4 w-4" />
          Choose File
        </Button>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Import Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{summary?.totalRows}</div>
              <div className="text-sm text-muted-foreground">Total Rows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary?.createCount}</div>
              <div className="text-sm text-muted-foreground">Create</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary?.updateCount}</div>
              <div className="text-sm text-muted-foreground">Update</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summary?.errorCount}</div>
              <div className="text-sm text-muted-foreground">Errors</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Errors */}
      {summary && summary.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>Found {summary.errors.length} validation errors:</p>
              <ScrollArea className="h-32">
                <div className="space-y-1">
                  {summary.errors.map((error, index) => (
                    <div key={index} className="text-sm">
                      Row {error.row}, {error.column}: {error.message}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Preview Table */}
      <Card>
        <CardHeader>
          <CardTitle>Preview (First 20 Rows)</CardTitle>
          <CardDescription>Showing how rows will be processed</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Row</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {row.normalizedRow?.slug || "N/A"}
                    </TableCell>
                    <TableCell className="max-w-48 truncate" title={row.normalizedRow?.name}>
                      {row.normalizedRow?.name || "N/A"}
                    </TableCell>
                    <TableCell>{getClassificationBadge(row.classification)}</TableCell>
                    <TableCell>
                      {row.errors.length > 0 ? (
                        <div className="text-red-600 text-sm">{row.errors[0].message}</div>
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep("upload")}>
          <Upload className="mr-2 h-4 w-4" />
          Choose Different File
        </Button>
        <Button onClick={handleImport} disabled={summary?.errorCount > 0}>
          Import {summary?.createCount + summary?.updateCount} Rows
        </Button>
      </div>
    </div>
  );

  const renderImportingStep = () => (
    <div className="space-y-6 text-center">
      <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Importing Data</h3>
        <p className="text-sm text-muted-foreground">Processing rows in chunks of 200...</p>
      </div>
      <div className="space-y-2">
        <Progress value={importProgress} className="w-full" />
        <p className="text-sm text-muted-foreground">{importProgress}% complete</p>
      </div>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="font-medium text-green-600">{importResults.created}</div>
          <div className="text-muted-foreground">Created</div>
        </div>
        <div>
          <div className="font-medium text-blue-600">{importResults.updated}</div>
          <div className="text-muted-foreground">Updated</div>
        </div>
        <div>
          <div className="font-medium text-red-600">{importResults.errors}</div>
          <div className="text-muted-foreground">Errors</div>
        </div>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Import Complete</h3>
        <p className="text-sm text-muted-foreground">Successfully processed all rows</p>
      </div>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="font-medium text-green-600">{importResults.created}</div>
          <div className="text-muted-foreground">Created</div>
        </div>
        <div>
          <div className="font-medium text-blue-600">{importResults.updated}</div>
          <div className="text-muted-foreground">Updated</div>
        </div>
        <div>
          <div className="font-medium text-red-600">{importResults.errors}</div>
          <div className="text-muted-foreground">Errors</div>
        </div>
      </div>
      <div className="flex justify-center gap-2">
        <Button onClick={() => (window.location.href = "/admin/beaches?sort=updated_at&dir=desc")}>
          View Beaches
        </Button>
        <Button variant="outline" onClick={handleClose}>
          Close
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        aria-describedby="import-csv-desc"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import CSV
          </DialogTitle>
          <DialogDescription id="import-csv-desc">
            Upload and import beach data from a CSV file
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && renderUploadStep()}
        {step === "preview" && renderPreviewStep()}
        {step === "importing" && renderImportingStep()}
        {step === "complete" && renderCompleteStep()}
      </DialogContent>
    </Dialog>
  );
};

export default ImportCsvModal;
