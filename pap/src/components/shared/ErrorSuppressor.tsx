"use client";

import { useEffect } from "react";

export function ErrorSuppressor() {
  useEffect(() => {
    const rejectionHandler = (e: PromiseRejectionEvent) => {
      if (String(e.reason).includes("MetaMask")) e.preventDefault();
    };
    const errorHandler = (e: ErrorEvent) => {
      if (String(e.error).includes("MetaMask") || String(e.message).includes("MetaMask")) {
        e.preventDefault();
      }
    };
    window.addEventListener("unhandledrejection", rejectionHandler);
    window.addEventListener("error", errorHandler);
    return () => {
      window.removeEventListener("unhandledrejection", rejectionHandler);
      window.removeEventListener("error", errorHandler);
    };
  }, []);
  return null;
}
