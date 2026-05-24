import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Allo Inventory",
  description: "Multi-warehouse inventory reservation system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="sticky top-0 z-20 bg-white border-b border-default">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-[#01848a] flex items-center justify-center">
                <span className="text-white text-sm font-semibold">A</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-[#111827]">Allo Inventory</div>
                <div className="text-xs text-[#111827]">Inventory & reservations</div>
              </div>
            </div>
            <div className="flex-1" />
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-12">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
