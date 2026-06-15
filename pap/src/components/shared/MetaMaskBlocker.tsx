"use client";

import Script from "next/script";

export function MetaMaskBlocker() {
  return (
    <Script id="metamask-blocker" strategy="beforeInteractive">
      {`
        window.addEventListener("unhandledrejection", function(e) {
          if (String(e.reason).includes("MetaMask")) e.preventDefault();
        });
        window.addEventListener("error", function(e) {
          if (String(e.message).includes("MetaMask") || String(e.error)?.includes("MetaMask")) {
            e.preventDefault();
          }
        });
      `}
    </Script>
  );
}
