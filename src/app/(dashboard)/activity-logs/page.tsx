import { Metadata } from "next";
import ActivityLogsTable from "@/components/ActivityLogs/ActivityLogsTable";

export const metadata: Metadata = {
  title: "Manage Activity Logs | Invoice Management",
  description: "View and filter system audit and user activity logs",
};

export default function ActivityLogsPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Manage Activity Logs
      </h1>
      <ActivityLogsTable />
    </div>
  );
}
