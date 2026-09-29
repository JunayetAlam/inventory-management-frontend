"use client";

import React, { useId, useMemo, useEffect, useState } from "react";
import CreatableSelect from "react-select/creatable";
import { TCustomer } from "@/types";
import { PlusCircle } from "lucide-react";

export interface CustomerOption {
  value: string;
  label: string;
  customer?: TCustomer;
  isNew?: boolean;
}

interface CustomerSelectProps {
  customers: TCustomer[];
  selectedCustomerId?: string | null;
  valueName?: string;
  onSelectCustomer: (customer: TCustomer) => void;
  onNameChange: (name: string) => void;
  onClear: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
}

export default function CustomerSelect({
  customers,
  selectedCustomerId,
  valueName = "",
  onSelectCustomer,
  onNameChange,
  onClear,
  disabled = false,
  isLoading = false,
  placeholder = "Search by name or phone...",
}: CustomerSelectProps) {
  const instanceId = useId();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Map customers to react-select options
  const options: CustomerOption[] = useMemo(() => {
    return customers.map((c) => ({
      value: c.id,
      label: c.name,
      customer: c,
    }));
  }, [customers]);

  // Determine current selected option or custom value
  const currentValue: CustomerOption | null = useMemo(() => {
    if (selectedCustomerId) {
      const found = options.find((opt) => opt.value === selectedCustomerId);
      if (found) return found;
      if (valueName) {
        return { value: selectedCustomerId, label: valueName };
      }
    }
    if (valueName && valueName.trim()) {
      return { value: valueName, label: valueName, isNew: true };
    }
    return null;
  }, [selectedCustomerId, options, valueName]);

  // Custom filter: allows searching by customer name, phone number (with or without country code), or email
  const filterOption = (
    candidate: { label: string; value: string; data: CustomerOption },
    input: string
  ) => {
    if (!input || !input.trim()) return true;
    const term = input.trim().toLowerCase();
    const cust = candidate.data.customer;

    if (!cust) {
      return candidate.label.toLowerCase().includes(term);
    }

    const nameMatch = cust.name?.toLowerCase().includes(term);
    const phoneMatch =
      cust.phoneNumber?.includes(term) ||
      (cust.countryCode && (cust.countryCode + cust.phoneNumber).includes(term)) ||
      (cust.phoneNumber && `0${cust.phoneNumber}`.includes(term)) ||
      (cust.whatsappNumber && cust.whatsappNumber.includes(term));

    return Boolean(nameMatch || phoneMatch);
  };

  return (
    <div className="w-full">
      <CreatableSelect<CustomerOption, false>
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
            ? `No customer matching "${inputValue}". Press Enter to use as new name.`
            : "No customers found"
        }
        formatCreateLabel={(inputValue) => (
          <span className="flex items-center gap-2 text-primary font-medium text-xs">
            <PlusCircle className="size-3.5" /> Use &quot;{inputValue}&quot; as new customer
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

          if (option.customer) {
            onSelectCustomer(option.customer);
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
              <span className="font-medium text-sm text-foreground truncate block leading-none">
                {option.label}
              </span>
            );
          }

          if (option.isNew || !option.customer) {
            return (
              <div className="flex items-center gap-2 py-0.5">
                <PlusCircle className="size-3.5 text-primary shrink-0" />
                <span className="font-medium text-xs text-foreground">
                  New Customer: &quot;{option.label}&quot;
                </span>
              </div>
            );
          }

          const cust = option.customer;
          return (
            <div className="flex items-center justify-between py-0.5 gap-2 text-sm">
              <span className="font-medium text-foreground truncate">
                {cust.name}
              </span>
              <span className="text-xs text-muted-foreground font-mono shrink-0">
                {cust.countryCode || "+880"} {cust.phoneNumber}
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
            borderRadius: "1rem", // rounded-2xl to match input.tsx exactly
            fontSize: "0.875rem",
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
            fontSize: "0.875rem",
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
            fontSize: "0.875rem",
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
            fontSize: "0.875rem",
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
            padding: "0 4px",
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
            marginTop: "6px",
          }),
          menuList: (base) => ({
            ...base,
            padding: 0,
            maxHeight: "260px",
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
            borderRadius: "0.625rem",
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
