import { Metadata } from "next";
import PrivilegedMaintenanceControl from "@/components/Maintenance/PrivilegedMaintenanceControl";

export const metadata: Metadata = {
  title: "Manage Maintenance | Inventory Management",
  description: "Privileged System Maintenance Control Center",
};

export default function PrivilegedMaintenancePage() {
  return <PrivilegedMaintenanceControl />;
}
