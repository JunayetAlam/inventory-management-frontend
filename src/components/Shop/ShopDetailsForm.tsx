"use client";

import React, { useEffect, useState, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Store01Icon, Upload01Icon, Delete02Icon, Add01Icon, Call02Icon, Mail01Icon, Location01Icon, FloppyDiskIcon, CheckmarkCircle02Icon, AlertCircleIcon, Loading03Icon, Building03Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetShopDetailsQuery,
  useUpsertShopDetailsMutation,
} from "@/redux/api/shopApi";
import {
  useDeleteAssetMutation,
  useUploadAssetMutation,
} from "@/redux/api/assestApi";
import useIsAdmin from "@/hooks/useIsAdmin";

export default function ShopDetailsForm() {
  const [isAdmin] = useIsAdmin();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: shopResponse, isLoading: isFetchingShop } = useGetShopDetailsQuery();
  const [upsertShop, { isLoading: isSaving }] = useUpsertShopDetailsMutation();
  const [uploadAsset, { isLoading: isUploadingLogo }] = useUploadAssetMutation();
  const [deleteAsset] = useDeleteAssetMutation();

  const shop = shopResponse?.data;

  // Form states
  const [name, setName] = useState("");
  const [proprietor, setProprietor] = useState("");
  const [logo, setLogo] = useState("");
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([""]);
  const [emails, setEmails] = useState<string[]>([""]);
  const [locations, setLocations] = useState<string[]>([""]);

  // Sync state when data loads
  useEffect(() => {
    if (shop) {
      setName(shop.name || "");
      setProprietor(shop.proprietor || "");
      setLogo(shop.logo || "");
      setPhoneNumbers(
        shop.phoneNumbers && shop.phoneNumbers.length > 0
          ? [...shop.phoneNumbers]
          : [""]
      );
      setEmails(
        shop.emails && shop.emails.length > 0 ? [...shop.emails] : [""]
      );
      setLocations(
        shop.locations && shop.locations.length > 0
          ? [...shop.locations]
          : [""]
      );
    }
  }, [shop]);

  // Phone number helpers
  const handleAddPhone = () => {
    setPhoneNumbers((prev) => [...prev, ""]);
  };
  const handleRemovePhone = (index: number) => {
    setPhoneNumbers((prev) => prev.filter((_, i) => i !== index));
  };
  const handlePhoneChange = (index: number, val: string) => {
    setPhoneNumbers((prev) => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  // Email helpers
  const handleAddEmail = () => {
    setEmails((prev) => [...prev, ""]);
  };
  const handleRemoveEmail = (index: number) => {
    setEmails((prev) => prev.filter((_, i) => i !== index));
  };
  const handleEmailChange = (index: number, val: string) => {
    setEmails((prev) => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  // Location helpers
  const handleAddLocation = () => {
    setLocations((prev) => [...prev, ""]);
  };
  const handleRemoveLocation = (index: number) => {
    setLocations((prev) => prev.filter((_, i) => i !== index));
  };
  const handleLocationChange = (index: number, val: string) => {
    setLocations((prev) => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  // Logo file upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("model", "shop");
      const res = await uploadAsset(formData).unwrap();
      const uploadedUrl = res?.data?.url?.url || res?.data?.url;
      if (uploadedUrl) {
        // Clean up previously uploaded draft logo if it differs from the saved shop logo
        if (logo && logo !== shop?.logo) {
          deleteAsset(logo);
        }
        setLogo(uploadedUrl);
        toast.success("Logo uploaded successfully");
      }
    } catch (err: unknown) {
      console.error("Failed to upload logo:", err);
      toast.error("Failed to upload logo image");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = () => {
    // Clean up draft logo if it was uploaded in this session and not yet saved
    if (logo && logo !== shop?.logo) {
      deleteAsset(logo);
    }
    setLogo("");
  };

  // Save / Upsert form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      toast.error("Only administrators can update shop details.");
      return;
    }

    if (!name.trim()) {
      toast.error("Shop Name is required");
      return;
    }

    // Filter empty values
    const cleanedPhones = phoneNumbers.map((p) => p.trim()).filter(Boolean);
    const cleanedEmails = emails.map((m) => m.trim()).filter(Boolean);
    const cleanedLocations = locations.map((l) => l.trim()).filter(Boolean);

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const em of cleanedEmails) {
      if (!emailRegex.test(em)) {
        toast.error(`"${em}" is not a valid email address`);
        return;
      }
    }

    const payload = {
      name: name.trim(),
      proprietor: proprietor.trim() || null,
      logo: logo.trim() || null,
      phoneNumbers: cleanedPhones,
      emails: cleanedEmails,
      locations: cleanedLocations,
    };

    try {
      await upsertShop(payload).unwrap();
      toast.success("Shop details saved successfully!");
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to save shop details";
      toast.error(errorMsg);
    }
  };

  if (isFetchingShop) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-72 rounded-xl" />
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Banner / Status Alert if Read-Only */}
      {!isAdmin && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-700 dark:text-amber-300">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-4 shrink-0" />
          <span>
            You are logged in as a <strong>Cashier</strong>. You have read-only access. Only Store Admins and Superadmins can modify shop details.
          </span>
        </div>
      )}

      {/* Audit Info Badge */}
      {shop && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-muted/40 font-normal">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="mr-1.5 size-3 text-emerald-500" />
              Shop Configured
            </Badge>
            {shop.updatedBy && (
              <span className="text-xs text-muted-foreground">
                Last updated by {shop.updatedBy.firstName} {shop.updatedBy.lastName} on{" "}
                {new Date(shop.updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
          {isAdmin && (
            <Button
              type="submit"
              disabled={isSaving || isUploadingLogo}
              size="sm"
              className="gap-1.5 h-8 px-4"
            >
              {isSaving ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="size-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={FloppyDiskIcon} strokeWidth={2} className="size-3.5" />
                  Save Changes
                </>
              )}
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Logo & Branding Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <HugeiconsIcon icon={Store01Icon} strokeWidth={2} className="size-4 text-primary" />
                Shop Logo & Identity
              </CardTitle>
              <CardDescription className="text-xs">
                Upload your store brand logo shown on invoices and reports.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logo Preview Box */}
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl bg-muted/20 text-center relative overflow-hidden group">
                {logo ? (
                  <div className="relative flex flex-col items-center gap-3">
                    <img
                      src={logo}
                      alt="Shop Logo"
                      className="size-32 object-contain rounded-lg border border-border bg-background shadow-xs p-1"
                    />
                    {isAdmin && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveLogo}
                        disabled={isSaving || isUploadingLogo}
                        className="text-xs text-destructive hover:bg-destructive/10 h-7 px-2.5"
                      >
                        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-3 mr-1" />
                        Remove Logo
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <div className="size-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <HugeiconsIcon icon={Building03Icon} strokeWidth={2} className="size-8" />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      No logo uploaded yet
                    </span>
                  </div>
                )}
              </div>

              {/* Upload Input */}
              {isAdmin && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="shop-logo-file"
                    disabled={isUploadingLogo || isSaving}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full text-xs h-9 cursor-pointer"
                    disabled={isUploadingLogo || isSaving}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploadingLogo ? (
                      <>
                        <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="size-3.5 mr-2 animate-spin" />
                        Uploading Logo...
                      </>
                    ) : (
                      <>
                        <HugeiconsIcon icon={Upload01Icon} strokeWidth={2} className="size-3.5 mr-2" />
                        {logo ? "Change Logo Image" : "Upload Logo Image"}
                      </>
                    )}
                  </Button>
                  <p className="text-[11px] text-muted-foreground mt-1.5 text-center">
                    PNG, JPG, WEBP, or SVG (max 5MB)
                  </p>
                </div>
              )}

              {/* Quick Preview Card */}
              <div className="rounded-lg border border-border p-3.5 bg-card/60 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-3 text-amber-500" />
                  Invoice Preview
                </div>
                <div className="border border-dashed border-border/80 rounded p-2.5 bg-background text-center space-y-0.5">
                  <p className="font-bold text-sm tracking-wide text-foreground">
                    {name || "Your Store Name"}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    {proprietor
                      ? (proprietor.toLowerCase().startsWith("prop")
                          ? proprietor
                          : `Proprietor: ${proprietor}`)
                      : "Proprietor: Your Name"}
                  </p>
                  {phoneNumbers.filter(Boolean).length > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      <span className="font-semibold text-foreground/80">Phone: </span>
                      {phoneNumbers.filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Information & Multi-Value Lists */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">General Information</CardTitle>
              <CardDescription className="text-xs">
                Core identity and branding information for the business.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="shop-name" className="text-xs font-medium">
                  Shop Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="shop-name"
                  placeholder="e.g., Al-Madina Super Shop"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isAdmin || isSaving}
                  required
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="shop-proprietor" className="text-xs font-medium">
                  Proprietor Name
                </Label>
                <Input
                  id="shop-proprietor"
                  placeholder="e.g., Mohammad Rahman"
                  value={proprietor}
                  onChange={(e) => setProprietor(e.target.value)}
                  disabled={!isAdmin || isSaving}
                  className="h-9 text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Phone Numbers Card (Multiple) */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <HugeiconsIcon icon={Call02Icon} strokeWidth={2} className="size-4 text-primary" />
                  Phone Numbers
                </CardTitle>
                <CardDescription className="text-xs">
                  Add one or more contact phone numbers for customer service or billing.
                </CardDescription>
              </div>
              {isAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddPhone}
                  disabled={isSaving}
                  className="h-8 text-xs gap-1"
                >
                  <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3" />
                  Add Number
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-2.5">
              {phoneNumbers.map((phone, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder={`Phone number ${idx + 1} (e.g., +8801712345678)`}
                      value={phone}
                      onChange={(e) => handlePhoneChange(idx, e.target.value)}
                      disabled={!isAdmin || isSaving}
                      className="h-9 text-sm font-mono"
                    />
                  </div>
                  {isAdmin && phoneNumbers.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemovePhone(idx)}
                      disabled={isSaving}
                      className="size-9 text-muted-foreground hover:text-destructive shrink-0"
                      title="Remove phone number"
                    >
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Email Addresses Card (Multiple) */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} className="size-4 text-primary" />
                  Email Addresses
                </CardTitle>
                <CardDescription className="text-xs">
                  Official contact email addresses displayed on printed invoices.
                </CardDescription>
              </div>
              {isAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddEmail}
                  disabled={isSaving}
                  className="h-8 text-xs gap-1"
                >
                  <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3" />
                  Add Email
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-2.5">
              {emails.map((email, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="email"
                      placeholder={`Email address ${idx + 1} (e.g., contact@store.com)`}
                      value={email}
                      onChange={(e) => handleEmailChange(idx, e.target.value)}
                      disabled={!isAdmin || isSaving}
                      className="h-9 text-sm"
                    />
                  </div>
                  {isAdmin && emails.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveEmail(idx)}
                      disabled={isSaving}
                      className="size-9 text-muted-foreground hover:text-destructive shrink-0"
                      title="Remove email"
                    >
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Locations & Addresses Card (Multiple) */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-4 text-primary" />
                  Locations & Branches
                </CardTitle>
                <CardDescription className="text-xs">
                  Physical shop branch locations or address lines.
                </CardDescription>
              </div>
              {isAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLocation}
                  disabled={isSaving}
                  className="h-8 text-xs gap-1"
                >
                  <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3" />
                  Add Location
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-2.5">
              {locations.map((loc, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder={`Branch or location ${idx + 1} (e.g., Level 3, City Center, Dhaka)`}
                      value={loc}
                      onChange={(e) => handleLocationChange(idx, e.target.value)}
                      disabled={!isAdmin || isSaving}
                      className="h-9 text-sm"
                    />
                  </div>
                  {isAdmin && locations.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveLocation(idx)}
                      disabled={isSaving}
                      className="size-9 text-muted-foreground hover:text-destructive shrink-0"
                      title="Remove location"
                    >
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Bottom Save Action */}
          {isAdmin && (
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isSaving || isUploadingLogo}
                className="gap-2 h-10 px-6 font-medium shadow-xs"
              >
                {isSaving ? (
                  <>
                    <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="size-4 animate-spin" />
                    Saving Details...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={FloppyDiskIcon} strokeWidth={2} className="size-4" />
                    Save Shop Details
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
