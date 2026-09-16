import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apex Ranked Tracker",
  description: "Ranked match history for tracked Apex Legends accounts",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto max-w-4xl px-4 py-8">{children}</div>
      </body>
    </html>
  );
}
