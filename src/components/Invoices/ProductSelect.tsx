"use client";

import React, { useId, useMemo, useEffect, useState } from "react";
import CreatableSelect from "react-select/creatable";
import { TProduct } from "@/types";
import { PlusCircle } from "lucide-react";

export interface ProductOption {
  value: string;
  label: string;
  product?: TProduct;
  isNew?: boolean;
}

interface ProductSelectProps {
  products: TProduct[];
  selectedProductId?: string | null;
  valueName?: string;
  onSelectProduct: (product: TProduct) => void;
  onNameChange: (name: string) => void;
  onClear: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ProductSelect({
  products,
  selectedProductId,
  valueName = "",
  onSelectProduct,
  onNameChange,
  onClear,
  disabled = false,
  placeholder = "Search product or type custom name...",
}: ProductSelectProps) {
  const instanceId = useId();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Map products to react-select options
  const options: ProductOption[] = useMemo(() => {
    return products.map((p) => ({
      value: p.id,
      label: p.name,
      product: p,
    }));
  }, [products]);

  // Determine current selected option or custom value
  const currentValue: ProductOption | null = useMemo(() => {
    if (selectedProductId) {
      const found = options.find((opt) => opt.value === selectedProductId);
      if (found) return found;
      if (valueName) {
        return { value: selectedProductId, label: valueName };
      }
    }
    if (valueName && valueName.trim()) {
      return { value: valueName, label: valueName, isNew: true };
    }
    return null;
  }, [selectedProductId, options, valueName]);

  // Filter option: searches product name or SKU/unit
  const filterOption = (
    candidate: { label: string; value: string; data: ProductOption },
    input: string
  ) => {
    if (!input || !input.trim()) return true;
    const term = input.trim().toLowerCase();
    const prod = candidate.data.product;

    if (!prod) {
      return candidate.label.toLowerCase().includes(term);
    }

    return (
      prod.name.toLowerCase().includes(term) ||
      prod.unit.toLowerCase().includes(term) ||
      String(prod.sellingPrice).includes(term)
    );
  };

  return (
    <div className="w-full">
      <CreatableSelect<ProductOption, false>
        instanceId={instanceId}
        isDisabled={disabled}
        isClearable
        options={options}
        value={currentValue}
        filterOption={filterOption}
        placeholder={placeholder}
        menuPortalTarget={isMounted ? document.body : undefined}
        menuPosition="fixed"
        noOptionsMessage={({ inputValue }) =>
          inputValue
            ? `No product matching "${inputValue}". Press Enter to use as custom product.`
            : "No products available"
        }
        formatCreateLabel={(inputValue) => (
          <span className="flex items-center gap-2 text-primary font-medium text-xs">
            <PlusCircle className="size-3.5" /> Use &quot;{inputValue}&quot; as custom product
          </span>
        )}
        onChange={(option, actionMeta) => {
          if (actionMeta.action === "clear") {
            onClear();
            return;
          }

          if (!option) {
            onClear();
            return;
          }

          if (option.product) {
            onSelectProduct(option.product);
          } else {
            onNameChange(option.label || option.value);
          }
        }}
        onInputChange={(inputValue, { action }) => {
          if (action === "input-change") {
            onNameChange(inputValue);
          }
        }}
        formatOptionLabel={(option, { context }) => {
          if (context === "value") {
            return (
              <span className="font-medium text-xs text-foreground truncate block leading-none">
                {option.label}
              </span>
            );
          }

          if (option.isNew || !option.product) {
            return (
              <div className="flex items-center gap-2 py-0.5">
                <PlusCircle className="size-3 text-primary shrink-0" />
                <span className="font-medium text-xs text-foreground">
                  Custom: &quot;{option.label}&quot;
                </span>
              </div>
            );
          }

          const prod = option.product;
          return (
            <div className="flex flex-col py-0.5 text-xs text-left">
              <span className="font-medium text-foreground truncate leading-tight">
                {prod.name}
              </span>
              <span
                className={`text-[11px] font-mono mt-0.5 ${
                  prod.stock < 0
                    ? "text-rose-600 dark:text-rose-400 font-semibold"
                    : prod.stock === 0
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground"
                }`}
              >
                Stock: {prod.stock} {prod.unit} · ৳{prod.sellingPrice}
              </span>
            </div>
          );
        }}
        styles={{
          control: (base, state) => ({
            ...base,
            height: "2rem",
            minHeight: "2rem",
            backgroundColor: "color-mix(in srgb, var(--input) 50%, transparent)",
            borderColor: state.isFocused ? "var(--ring)" : "transparent",
            borderRadius: "1rem", // rounded-2xl to match website inputs
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
            transition: "color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
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
            color: state.isFocused ? "var(--foreground)" : "var(--muted-foreground)",
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
            borderRadius: "1rem", // rounded-2xl
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
