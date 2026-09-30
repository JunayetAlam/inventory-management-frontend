"use client";

import React, { useId, useMemo, useEffect, useState } from "react";
import Select from "react-select";
import { TCustomer } from "@/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserMultipleIcon, UserIcon } from "@hugeicons/core-free-icons";

export interface CustomerFilterOption {
  value: string;
  label: string;
  customer?: TCustomer;
}

interface CustomerFilterSelectProps {
  customers: TCustomer[];
  selectedCustomerId: string;
  onChange: (customerId: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
}

export default function CustomerFilterSelect({
  customers,
  selectedCustomerId,
  onChange,
  disabled = false,
  isLoading = false,
  placeholder = "All Customers",
}: CustomerFilterSelectProps) {
  const instanceId = useId();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const options: CustomerFilterOption[] = useMemo(() => {
    const list: CustomerFilterOption[] = [
      {
        value: "ALL",
        label: "All Customers",
      },
    ];

    customers.forEach((c) => {
      list.push({
        value: c.id,
        label: c.name,
        customer: c,
      });
    });

    return list;
  }, [customers]);

  const currentValue: CustomerFilterOption = useMemo(() => {
    if (!selectedCustomerId || selectedCustomerId === "ALL") {
      return options[0];
    }
    const found = options.find((opt) => opt.value === selectedCustomerId);
    return found || options[0];
  }, [selectedCustomerId, options]);

  const filterOption = (
    candidate: { label: string; value: string; data: CustomerFilterOption },
    input: string,
  ) => {
    if (!input || !input.trim()) return true;
    const term = input.trim().toLowerCase();

    if (candidate.data.value === "ALL") {
      return "all customers".includes(term);
    }

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
      <Select<CustomerFilterOption, false>
        instanceId={instanceId}
        isDisabled={disabled}
        isLoading={isLoading}
        isClearable={selectedCustomerId !== "ALL" && Boolean(selectedCustomerId)}
        options={options}
        value={currentValue}
        filterOption={filterOption}
        placeholder={placeholder}
        menuPortalTarget={isMounted ? document.body : undefined}
        menuPosition="fixed"
        noOptionsMessage={({ inputValue }) =>
          inputValue
            ? `No customer matching "${inputValue}"`
            : "No customers found"
        }
        onChange={(option, actionMeta) => {
          if (actionMeta.action === "clear" || !option) {
            onChange("ALL");
            return;
          }
          onChange(option.value);
        }}
        formatOptionLabel={(option, { context }) => {
          if (context === "value") {
            if (option.value === "ALL" || !option.customer) {
              return (
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <HugeiconsIcon icon={UserMultipleIcon} strokeWidth={2} className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">All Customers</span>
                </div>
              );
            }

            const cust = option.customer;
            return (
              <div className="flex items-center gap-1.5 text-xs text-foreground font-medium truncate">
                <HugeiconsIcon icon={UserIcon} strokeWidth={2} className="size-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{cust.name}</span>
                <span className="text-muted-foreground font-mono text-[11px] shrink-0">
                  ({cust.phoneNumber})
                </span>
              </div>
            );
          }

          if (option.value === "ALL" || !option.customer) {
            return (
              <div className="flex items-center gap-2 py-0.5 text-xs font-semibold text-foreground">
                <HugeiconsIcon icon={UserMultipleIcon} strokeWidth={2} className="size-3.5 text-primary shrink-0" />
                <span>All Customers</span>
              </div>
            );
          }

          const cust = option.customer;
          return (
            <div className="flex items-center justify-between py-0.5 gap-2 text-xs">
              <span className="font-medium text-foreground truncate">
                {cust.name}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                {cust.countryCode || "+880"} {cust.phoneNumber}
              </span>
            </div>
          );
        }}
        styles={{
          control: (base, state) => ({
            ...base,
            height: "2.25rem",
            minHeight: "2.25rem",
            backgroundColor: "var(--background)",
            borderColor: state.isFocused ? "var(--ring)" : "var(--border)",
            borderRadius: "calc(var(--radius) - 2px)",
            fontSize: "0.75rem",
            paddingLeft: "0.5rem",
            paddingRight: "0.25rem",
            boxShadow: state.isFocused
              ? "0 0 0 2px color-mix(in srgb, var(--ring) 30%, transparent)"
              : "none",
            outline: "none",
            display: "flex",
            alignItems: "center",
            "&:hover": {
              borderColor: state.isFocused ? "var(--ring)" : "var(--border)",
            },
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          }),
          valueContainer: (base) => ({
            ...base,
            padding: 0,
            margin: 0,
            height: "100%",
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
          }),
          singleValue: (base) => ({
            ...base,
            color: "var(--foreground)",
            fontSize: "0.75rem",
            margin: 0,
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
            borderRadius: "calc(var(--radius) - 2px)",
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
            borderRadius: "calc(var(--radius) - 4px)",
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
