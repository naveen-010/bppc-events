import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "BPPC Events | BITS Pilani",
  description: "Discover and register for events at BITS Pilani Pilani Campus",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-8rem)]">{children}</main>
          <footer className="border-t py-8 text-center text-sm text-[var(--muted-foreground)]">
            <div className="max-w-7xl mx-auto px-4">
              <p>BPPC Events Portal · BITS Pilani, Pilani Campus</p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
