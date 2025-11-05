"use client";
import { useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";

export default function RootLayout({ children }) {
  useEffect(() => {
    // Load Bootstrap JS only in browser
    import("bootstrap/dist/js/bootstrap.bundle.min.js")
      .then(() => console.log("✅ Bootstrap JS loaded (client-side only)"))
      .catch((err) => console.error("❌ Bootstrap JS failed:", err));
  }, []);

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>The Quisine</title>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
