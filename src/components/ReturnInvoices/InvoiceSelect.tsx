"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Select from "react-select";
import { TInvoice } from "@/types";

export interface InvoiceOption {
  value: string;
  label: string;
  invoice: TInvoice;
}

interface InvoiceSelectProps {
  invoices: TInvoice[];
  selectedInvoiceId?: string;
  selectedInvoice?: TInvoice | null;
  onSelect: (invoiceId: string) => void;
  onClear: () => void;
  onSearch: (term: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

function invoiceLabel(invoice: TInvoice) {
  return `${invoice.invoiceNumber} · ${invoice.customer?.name || "Unknown"}`;
}

export default function InvoiceSelect({
  invoices,
  selectedInvoiceId,
  selectedInvoice,
  onSelect,
  onClear,
  onSearch,
  isLoading = false,
  disabled = false,
  placeholder = "Search invoice # or customer...",
}: InvoiceSelectProps) {
  const instanceId = useId();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const options: InvoiceOption[] = useMemo(() => {
    const list = [...invoices];
    if (
      selectedInvoice &&
      !list.some((r) => r.id === selectedInvoice.id)
    ) {
      list.unshift(selectedInvoice);
    }
    return list.map((r) => ({
      value: r.id,
      label: invoiceLabel(r),
      invoice: r,
    }));
  }, [invoices, selectedInvoice]);

  const currentValue =
    options.find((opt) => opt.value === selectedInvoiceId) || null;

  const filterOption = (
    candidate: { label: string; value: string; data: InvoiceOption },
    input: string,
  ) => {
    if (!input || !input.trim()) return true;
    const term = input.trim().toLowerCase();
    const r = candidate.data.invoice;
    if (!r) return candidate.label.toLowerCase().includes(term);

    return (
      r.invoiceNumber.toLowerCase().includes(term) ||
      (r.customer?.name || "").toLowerCase().includes(term) ||
      (r.customer?.phoneNumber || "").includes(term) ||
      String(r.totalAmount).includes(term)
    );
  };

  return (
    <div className="w-full">
      <Select<InvoiceOption, false>
        instanceId={instanceId}
        isDisabled={disabled}
        isLoading={isLoading}
        isClearable
        options={options}
        value={currentValue}
        filterOption={filterOption}
        placeholder={placeholder}
        menuPortalTarget={isMounted ? document.body : undefined}
        menuPosition="fixed"
        noOptionsMessage={({ inputValue }) =>
          inputValue
            ? `No invoice matching "${inputValue}"`
            : "No invoices found"
        }
        onChange={(option, actionMeta) => {
          if (actionMeta.action === "clear" || !option) {
            onClear();
            return;
          }
          onSelect(option.value);
        }}
        onInputChange={(inputValue, { action }) => {
          if (action === "input-change") {
            onSearch(inputValue);
          }
          if (action === "menu-close" || action === "input-blur") {
            onSearch("");
          }
        }}
        formatOptionLabel={(option, { context }) => {
          const r = option.invoice;
          if (context === "value") {
            return (
              <span className="font-medium text-xs text-foreground truncate block leading-none">
                {option.label}
              </span>
            );
          }

          return (
            <div className="flex flex-col py-0.5 text-xs text-left">
              <span className="font-mono font-semibold text-foreground truncate leading-tight">
                {r.invoiceNumber}
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {r.customer?.name || "Unknown"} · ৳{r.totalAmount}
              </span>
            </div>
          );
        }}
        styles={{
          control: (base, state) => ({
            ...base,
            height: "2rem",
            minHeight: "2rem",
            backgroundColor:
              "color-mix(in srgb, var(--input) 50%, transparent)",
            borderColor: state.isFocused ? "var(--ring)" : "transparent",
            borderRadius: "1rem",
            fontSize: "0.75rem",
            paddingLeft: "0.5rem",
            paddingRight: "0.25rem",
            boxShadow: state.isFocused
              ? "0 0 0 3px color-mix(in srgb, var(--ring) 30%, transparent)"
              : "none",
            outline: "none",
            display: "flex",
            alignItems: "center",
            "&:hover": {
              borderColor: state.isFocused ? "var(--ring)" : "transparent",
            },
            cursor: disabled ? "not-allowed" : "text",
            opacity: disabled ? 0.5 : 1,
            transition:
              "color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
          }),
          valueContainer: (base) => ({
            ...base,
            padding: 0,
            margin: 0,
            height: "100%",
            display: "grid",
            alignItems: "center",
            overflow: "hidden",
          }),
          singleValue: (base) => ({
            ...base,
            color: "var(--foreground)",
            fontSize: "0.75rem",
            margin: 0,
            gridArea: "1 / 1 / 2 / 3",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "100%",
          }),
          placeholder: (base) => ({
            ...base,
            color: "var(--muted-foreground)",
            fontSize: "0.75rem",
            margin: 0,
            gridArea: "1 / 1 / 2 / 3",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "100%",
          }),
          input: (base) => ({
            ...base,
            color: "var(--foreground)",
            fontSize: "0.75rem",
            margin: 0,
            padding: 0,
            gridArea: "1 / 1 / 2 / 3",
          }),
          indicatorsContainer: (base) => ({
            ...base,
            height: "100%",
            display: "flex",
            alignItems: "center",
          }),
          indicatorSeparator: () => ({
            display: "none",
          }),
          dropdownIndicator: (base, state) => ({
            ...base,
            color: state.isFocused
              ? "var(--foreground)"
              : "var(--muted-foreground)",
            padding: "0 3px",
            "&:hover": {
              color: "var(--foreground)",
            },
          }),
          clearIndicator: (base) => ({
            ...base,
            color: "var(--muted-foreground)",
            padding: "0 2px",
            cursor: "pointer",
            "&:hover": {
              color: "var(--destructive)",
            },
          }),
          menuPortal: (base) => ({
            ...base,
            zIndex: 9999,
          }),
          menu: (base) => ({
            ...base,
            backgroundColor: "var(--popover)",
            color: "var(--popover-foreground)",
            border: "1px solid var(--border)",
            borderRadius: "1rem",
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.15)",
            zIndex: 9999,
            overflow: "hidden",
            padding: "4px",
            marginTop: "4px",
          }),
          menuList: (base) => ({
            ...base,
            padding: 0,
            maxHeight: "240px",
            scrollbarWidth: "thin",
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
              ? "var(--accent)"
              : state.isFocused
                ? "var(--accent)"
                : "transparent",
            color: "var(--popover-foreground)",
            borderRadius: "0.5rem",
            padding: "6px 10px",
            cursor: "pointer",
            "&:active": {
              backgroundColor: "var(--accent)",
            },
          }),
        }}
      />
    </div>
  );
}
