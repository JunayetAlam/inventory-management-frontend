"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBulkCreateProductsMutation } from "@/redux/api/productApi";
import { ProductUnit } from "@/types";
import {
  downloadSampleCSV,
  ParsedProductRow,
  parseProductCSV,
} from "@/utils/csvParser";
import { errorMessageGenerator } from "@/utils/errorMessageGenerator";
import {
  AlertCircle,
  Download,
  FileSpreadsheet,
  Plus,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRODUCT_UNITS: { label: string; value: ProductUnit }[] = [
  { label: "Piece (pcs)", value: "PIECE" },
  { label: "Kilogram (kg)", value: "KG" },
  { label: "Gram (g)", value: "GRAM" },
  { label: "Liter (L)", value: "LITER" },
  { label: "Box", value: "BOX" },
  { label: "Packet (pkt)", value: "PACKET" },
  { label: "Meter (m)", value: "METER" },
  { label: "Other", value: "OTHER" },
];

interface ProductBulkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const createEmptyRow = (): ParsedProductRow => ({
  id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  name: "",
  unit: "PIECE",
  sellingPrice: "",
  buyingPrice: "",
  stock: "0",
  description: "",
});

export default function ProductBulkModal({
  open,
  onOpenChange,
}: ProductBulkModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedProductRow[]>([createEmptyRow()]);
  const [bulkCreateProducts, { isLoading }] = useBulkCreateProductsMutation();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please select a valid CSV file (.csv)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text || !text.trim()) {
          toast.error("The selected CSV file is empty");
          return;
        }

        const parsed = parseProductCSV(text);
        if (parsed.length === 0) {
          toast.error("No valid product rows could be found in the CSV");
          return;
        }

        // If currently there's only 1 empty row, replace it. Otherwise append.
        setRows((prev) => {
          const isInitialEmpty =
            prev.length === 1 &&
            !prev[0].name &&
            !prev[0].sellingPrice &&
            !prev[0].buyingPrice;
          return isInitialEmpty ? parsed : [...prev, ...parsed];
        });

        toast.success(
          `Imported ${parsed.length} product(s) from CSV. You can review and edit below.`,
        );
      } catch {
        toast.error("Failed to parse CSV file. Please verify format.");
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  };

  const handleAddRow = () => {
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  const handleRemoveRow = (id: string) => {
    setRows((prev) => {
      const filtered = prev.filter((r) => r.id !== id);
      return filtered.length === 0 ? [createEmptyRow()] : filtered;
    });
  };

  const handleClearAll = () => {
    setRows([createEmptyRow()]);
  };

  const handleUpdateField = (
    id: string,
    field: keyof ParsedProductRow,
    value: string,
  ) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  // Find duplicates within the current list
  const nameOccurrences = rows.reduce<Record<string, number>>((acc, row) => {
    const trimmed = row.name.trim().toLowerCase();
    if (trimmed) {
      acc[trimmed] = (acc[trimmed] || 0) + 1;
    }
    return acc;
  }, {});

  const hasDuplicateNames = Object.values(nameOccurrences).some(
    (count) => count > 1,
  );

  const validateRows = () => {
    let isValid = true;
    const updatedRows = rows.map((row) => {
      const errors: ParsedProductRow["errors"] = {};
      const trimmedName = row.name.trim();
      const lowerName = trimmedName.toLowerCase();

      if (!trimmedName) {
        errors.name = "Name is required";
        isValid = false;
      } else if (nameOccurrences[lowerName] > 1) {
        errors.name = "Duplicate name in batch";
        isValid = false;
      }

      const numSelling = parseFloat(row.sellingPrice);
      if (!row.sellingPrice || isNaN(numSelling) || numSelling <= 0) {
        errors.sellingPrice = "Price > 0 required";
        isValid = false;
      }

      if (row.buyingPrice.trim() !== "") {
        const numBuying = parseFloat(row.buyingPrice);
        if (isNaN(numBuying) || numBuying < 0) {
          errors.buyingPrice = "Cost cannot be negative";
          isValid = false;
        }
      }

      if (row.stock.trim() !== "") {
        const numStock = parseFloat(row.stock);
        if (isNaN(numStock) || numStock < 0) {
          errors.stock = "Stock cannot be negative";
          isValid = false;
        }
      }

      return { ...row, errors };
    });

    setRows(updatedRows);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateRows()) {
      toast.error(
        "Please resolve highlighted validation errors before saving.",
      );
      return;
    }

    const payload = rows.map((r) => ({
      name: r.name.trim(),
      unit: r.unit,
      sellingPrice: parseFloat(r.sellingPrice),
      buyingPrice:
        r.buyingPrice.trim() !== "" ? parseFloat(r.buyingPrice) : null,
      stock: r.stock.trim() !== "" ? parseFloat(r.stock) : 0,
      description: r.description.trim() || null,
    }));

    try {
      const res = await bulkCreateProducts({ products: payload }).unwrap();
      toast.success(
        res.message || `Successfully created ${payload.length} products!`,
      );
      setRows([createEmptyRow()]);
      onOpenChange(false);
    } catch (error) {
      toast.error(errorMessageGenerator(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl! w-[95vw] p-0 max-h-[92vh] flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border bg-muted/20">
          <DialogHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <FileSpreadsheet className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Bulk Add & Import Products
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Import from CSV or enter multiple products at once into the
                  table below.
                </p>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 gap-1.5 text-xs"
              >
                <UploadCloud className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                Import CSV
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => downloadSampleCSV()}
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                title="Download CSV format template"
              >
                <Download className="size-3.5" />
                Sample CSV
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddRow}
                className="h-8 gap-1 text-xs font-medium"
              >
                <Plus className="size-3.5" />
                Add Row
              </Button>

              {rows.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-8 text-xs text-destructive hover:bg-destructive/10"
                >
                  Clear All
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* Duplicate warning alert banner */}
          {hasDuplicateNames && (
            <div className="mt-3 flex items-center gap-2 rounded-md bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="size-4 shrink-0" />
              <span>
                Duplicate product names detected in the list! Please ensure all
                product names in this batch are unique.
              </span>
            </div>
          )}
        </div>

        {/* Editable Products Grid */}
        <div className="flex-1 overflow-auto p-5">
          <div className="rounded-lg border border-border bg-card shadow-2xs overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead className="min-w-[180px]">Product Name *</TableHead>
                  <TableHead className="w-32">Unit *</TableHead>
                  <TableHead className="w-32">Selling (৳) *</TableHead>
                  <TableHead className="w-32">Buying (৳)</TableHead>
                  <TableHead className="w-24">Stock</TableHead>
                  <TableHead className="min-w-[200px]">Description</TableHead>
                  <TableHead className="w-12 text-center"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => {
                  const hasErr =
                    row.errors && Object.keys(row.errors).length > 0;
                  return (
                    <TableRow
                      key={row.id}
                      index={index}
                      className={cn(
                        "align-top",
                        hasErr && "bg-rose-500/5",
                      )}
                    >
                      {/* Index */}
                      <TableCell className="text-center font-mono text-muted-foreground">
                        {index + 1}
                      </TableCell>

                      {/* Name */}
                      <TableCell>
                        <Input
                          placeholder="e.g. Miniket Rice 25kg"
                          value={row.name}
                          onChange={(e) =>
                            handleUpdateField(row.id, "name", e.target.value)
                          }
                          className={cn(
                            "h-8 text-xs",
                            row.errors?.name &&
                              "border-destructive focus-visible:ring-destructive",
                          )}
                        />
                        {row.errors?.name && (
                          <p className="text-[10px] text-destructive mt-0.5">
                            {row.errors.name}
                          </p>
                        )}
                      </TableCell>

                      {/* Unit */}
                      <TableCell>
                        <Select
                          value={row.unit}
                          onValueChange={(val) =>
                            handleUpdateField(
                              row.id,
                              "unit",
                              val as ProductUnit,
                            )
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {PRODUCT_UNITS.map((u) => (
                              <SelectItem
                                key={u.value}
                                value={u.value}
                                className="text-xs"
                              >
                                {u.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      {/* Selling Price */}
                      <TableCell>
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="0.00"
                          value={row.sellingPrice}
                          onChange={(e) =>
                            handleUpdateField(
                              row.id,
                              "sellingPrice",
                              e.target.value,
                            )
                          }
                          className={cn(
                            "h-8 text-xs",
                            row.errors?.sellingPrice &&
                              "border-destructive focus-visible:ring-destructive",
                          )}
                        />
                        {row.errors?.sellingPrice && (
                          <p className="text-[10px] text-destructive mt-0.5">
                            {row.errors.sellingPrice}
                          </p>
                        )}
                      </TableCell>

                      {/* Buying Price */}
                      <TableCell>
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="0.00"
                          value={row.buyingPrice}
                          onChange={(e) =>
                            handleUpdateField(
                              row.id,
                              "buyingPrice",
                              e.target.value,
                            )
                          }
                          className={cn(
                            "h-8 text-xs",
                            row.errors?.buyingPrice &&
                              "border-destructive focus-visible:ring-destructive",
                          )}
                        />
                        {row.errors?.buyingPrice && (
                          <p className="text-[10px] text-destructive mt-0.5">
                            {row.errors.buyingPrice}
                          </p>
                        )}
                      </TableCell>

                      {/* Stock */}
                      <TableCell>
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="0"
                          value={row.stock}
                          onChange={(e) =>
                            handleUpdateField(row.id, "stock", e.target.value)
                          }
                          className={cn(
                            "h-8 text-xs",
                            row.errors?.stock &&
                              "border-destructive focus-visible:ring-destructive",
                          )}
                        />
                        {row.errors?.stock && (
                          <p className="text-[10px] text-destructive mt-0.5">
                            {row.errors.stock}
                          </p>
                        )}
                      </TableCell>

                      {/* Description */}
                      <TableCell>
                        <Textarea
                          placeholder="Optional specifications..."
                          value={row.description}
                          onChange={(e) =>
                            handleUpdateField(
                              row.id,
                              "description",
                              e.target.value,
                            )
                          }
                          rows={2}
                          className="min-h-[38px] text-xs py-1.5 resize-y rounded-xl"
                        />
                      </TableCell>

                      {/* Delete Row */}
                      <TableCell className="text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveRow(row.id)}
                          className="size-7 text-muted-foreground hover:text-destructive"
                          title="Remove row"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Quick Helper Tip */}
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              💡 Tip: Click <strong>Sample CSV</strong> to download the expected
              template, then click <strong>Import CSV</strong> to populate this
              table instantly.
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddRow}
              className="h-7 text-xs gap-1"
            >
              <Plus className="size-3" />
              Add Another Row
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20">
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{rows.length}</span>{" "}
            product(s) in list
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={isLoading || rows.length === 0}
              onClick={handleSubmit}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1.5"
            >
              {isLoading
                ? "Creating Products..."
                : `Create All (${rows.length} Products)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
