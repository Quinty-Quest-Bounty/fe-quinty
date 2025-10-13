"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";

type AlertVariant = "default" | "destructive" | "warning" | "success";

interface AlertConfig {
  title: string;
  description: string;
  variant?: AlertVariant;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

interface AlertContextType {
  showAlert: (config: AlertConfig) => void;
  showConfirm: (config: AlertConfig) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertDialogProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<AlertConfig>({
    title: "",
    description: "",
    variant: "default",
  });
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const showAlert = useCallback((alertConfig: AlertConfig) => {
    setConfig({
      ...alertConfig,
      showCancel: alertConfig.showCancel ?? false,
    });
    setIsOpen(true);
  }, []);

  const showConfirm = useCallback((alertConfig: AlertConfig): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfig({
        ...alertConfig,
        showCancel: true,
      });
      setResolvePromise(() => resolve);
      setIsOpen(true);
    });
  }, []);

  const handleConfirm = () => {
    config.onConfirm?.();
    if (resolvePromise) {
      resolvePromise(true);
      setResolvePromise(null);
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    config.onCancel?.();
    if (resolvePromise) {
      resolvePromise(false);
      setResolvePromise(null);
    }
    setIsOpen(false);
  };

  const getIcon = () => {
    switch (config.variant) {
      case "destructive":
        return <XCircle className="h-6 w-6 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      case "success":
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      default:
        return <Info className="h-6 w-6 text-primary" />;
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="sm:max-w-[500px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-xl">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                {getIcon()}
              </div>
              {config.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {config.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            {config.showCancel && (
              <AlertDialogCancel onClick={handleCancel}>
                {config.cancelText || "Cancel"}
              </AlertDialogCancel>
            )}
            <AlertDialogAction
              onClick={handleConfirm}
              className={
                config.variant === "destructive"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {config.confirmText || "OK"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AlertContext.Provider>
  );
}

export function useAlertDialog() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlertDialog must be used within AlertDialogProvider");
  }
  return context;
}
