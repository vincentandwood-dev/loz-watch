import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "loz.watch - Lake of the Ozarks Live Map",
  description: "Real-time situational awareness and live map platform for Lake of the Ozarks, Missouri",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

