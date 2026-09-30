"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
} from "@/redux/api/customerApi";
import { useUploadAssetMutation } from "@/redux/api/assestApi";
import { TCustomer } from "@/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserAdd01Icon, UserCheck01Icon, Camera01Icon, Delete02Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { errorMessageGenerator } from "@/utils/errorMessageGenerator";
import CustomPhoneInput from "@/components/Forms/CustomPhoneInput";

interface CustomerFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerToEdit?: TCustomer | null;
}

export default function CustomerFormModal({
  open,
  onOpenChange,
  customerToEdit,
}: CustomerFormModalProps) {
  const isEditing = Boolean(customerToEdit);
  const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation();
  const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();
  const [uploadAsset, { isLoading: isUploadingImage }] = useUploadAssetMutation();

  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+880");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [image, setImage] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name || "");
      setCountryCode(customerToEdit.countryCode || "+880");
      setPhoneNumber(customerToEdit.phoneNumber || "");
      setWhatsappNumber(customerToEdit.whatsappNumber || "");
      setImage(customerToEdit.image || "");
      setEmail(customerToEdit.email || "");
      setAddress(customerToEdit.address || "");
      setErrors({});
    } else {
      setName("");
      setCountryCode("+880");
      setPhoneNumber("");
      setWhatsappNumber("");
      setImage("");
      setEmail("");
      setAddress("");
      setErrors({});
    }
  }, [customerToEdit, open]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) {
      errs.name = "Customer name is required";
    }
    const cleanPhone = phoneNumber.trim().replace(/[\s\-\(\)]/g, "");
    if (!cleanPhone) {
      errs.phoneNumber = "Phone number is required";
    } else if (cleanPhone.length < 4 || cleanPhone.length > 16) {
      errs.phoneNumber = "Phone number must be between 4 and 16 digits";
    }
    if (whatsappNumber.trim()) {
      const cleanWa = whatsappNumber.trim().replace(/[\s\-\(\)]/g, "");
      if (cleanWa.length < 4 || cleanWa.length > 20) {
        errs.whatsappNumber = "WhatsApp number must be between 4 and 20 digits";
      }
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Please enter a valid email address";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be less than 5MB");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("model", "customer");
      const res = await uploadAsset(formData).unwrap();
      const uploadedUrl = res?.data?.url?.url || res?.data?.url;
      if (uploadedUrl) {
        setImage(uploadedUrl);
        toast.success("Image uploaded successfully");
      }
    } catch (err) {
      toast.error(errorMessageGenerator(err));
    }
  };

  const handleRemoveImage = () => {
    setImage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: name.trim(),
      countryCode,
      phoneNumber: phoneNumber.trim().replace(/[\s\-\(\)]/g, ""),
      whatsappNumber: whatsappNumber.trim()
        ? whatsappNumber.trim().replace(/[\s\-\(\)]/g, "")
        : null,
      image: image.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
    };

    try {
      if (isEditing && customerToEdit) {
        await updateCustomer({ id: customerToEdit.id, body: payload }).unwrap();
        toast.success("Customer updated successfully!");
      } else {
        await createCustomer(payload).unwrap();
        toast.success("Customer created successfully!");
      }
      onOpenChange(false);
    } catch (error) {
      const errMsg = errorMessageGenerator(error);
      toast.error(errMsg);
      if (errMsg.toLowerCase().includes("phone number")) {
        setErrors((prev) => ({ ...prev, phoneNumber: errMsg }));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            {isEditing ? (
              <HugeiconsIcon icon={UserCheck01Icon} strokeWidth={2} className="size-5 text-primary" />
            ) : (
              <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} className="size-5 text-primary" />
            )}
            {isEditing ? "Edit Customer" : "Add New Customer"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Customer Photo Upload */}
          <div className="flex items-center gap-4 py-1">
            <div className="relative group size-16 shrink-0">
              <Avatar className="size-16 border-2 border-border shadow-xs">
                {image ? (
                  <AvatarImage src={image} alt="Customer avatar" className="object-cover" />
                ) : null}
                <AvatarFallback className="text-base font-semibold bg-primary/10 text-primary">
                  {name ? name.slice(0, 2).toUpperCase() : "CU"}
                </AvatarFallback>
              </Avatar>

              {isUploadingImage && (
                <div className="absolute inset-0 bg-background/70 backdrop-blur-xs flex items-center justify-center rounded-full">
                  <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="size-5 animate-spin text-primary" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-foreground">Customer Photo (Optional)</p>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="customer-image-upload"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted cursor-pointer transition-colors"
                >
                  <HugeiconsIcon icon={Camera01Icon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
                  <span>{image ? "Change Photo" : "Upload Photo"}</span>
                  <input
                    id="customer-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                    disabled={isUploadingImage || isCreating || isUpdating}
                  />
                </label>

                {image && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                    disabled={isUploadingImage || isCreating || isUpdating}
                  >
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-3.5 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">JPG, PNG or WEBP (Max 5MB)</p>
            </div>
          </div>

          {/* Customer Name */}
          <div className="space-y-1.5">
            <Label htmlFor="customer-name">Full Name *</Label>
            <Input
              id="customer-name"
              placeholder="e.g. Rahim Chowdhury"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Professional React Phone Input with country selector and search */}
          <CustomPhoneInput
            name="customer-phone"
            label="Phone Number"
            required
            country="bd"
            value={
              phoneNumber
                ? phoneNumber.startsWith("+")
                  ? phoneNumber
                  : `${countryCode}${phoneNumber}`
                : countryCode
            }
            onChange={(val: string, data: any) => {
              if (data && data.dialCode) {
                setCountryCode(`+${data.dialCode}`);
                const rawNational = val.slice(data.dialCode.length).trim();
                setPhoneNumber(rawNational);
              } else {
                setPhoneNumber(val);
              }
              if (errors.phoneNumber) {
                setErrors((prev) => ({ ...prev, phoneNumber: "" }));
              }
            }}
            error={errors.phoneNumber}
          />

          {/* WhatsApp Number */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="customer-whatsapp">WhatsApp Number (Optional)</Label>
              {phoneNumber && (
                <button
                  type="button"
                  onClick={() => {
                    const full = phoneNumber.startsWith("+")
                      ? phoneNumber
                      : `${countryCode}${phoneNumber}`.replace(/[\s\-\(\)]/g, "");
                    setWhatsappNumber(full);
                    if (errors.whatsappNumber) {
                      setErrors((prev) => ({ ...prev, whatsappNumber: "" }));
                    }
                  }}
                  className="text-xs text-primary font-medium hover:underline transition-colors cursor-pointer"
                >
                  Same as Phone
                </button>
              )}
            </div>
            <Input
              id="customer-whatsapp"
              type="tel"
              placeholder="e.g. +88017XXXXXXXX or 017XXXXXXXX"
              value={whatsappNumber}
              onChange={(e) => {
                setWhatsappNumber(e.target.value);
                if (errors.whatsappNumber) {
                  setErrors((prev) => ({ ...prev, whatsappNumber: "" }));
                }
              }}
            />
            {errors.whatsappNumber && (
              <p className="text-xs text-destructive">{errors.whatsappNumber}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="customer-email">Email Address (Optional)</Label>
            <Input
              id="customer-email"
              type="email"
              placeholder="e.g. rahim@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label htmlFor="customer-address">Address (Optional)</Label>
            <Textarea
              id="customer-address"
              placeholder="e.g. House #12, Road #4, Dhanmondi, Dhaka"
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating
                ? "Saving..."
                : isEditing
                ? "Update Customer"
                : "Add Customer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
