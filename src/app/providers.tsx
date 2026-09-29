"use client";

import * as React from "react";
import { Provider } from "react-redux";
import { persistor, store } from "../redux/store";
import { Toaster } from "sonner";
import { PersistGate } from "redux-persist/integration/react";
import MaintenanceGuard from "@/components/Global/MaintenanceGuard";

export interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Toaster richColors position="top-center" />
        <MaintenanceGuard>{children}</MaintenanceGuard>
      </PersistGate>
    </Provider>
  );
}
