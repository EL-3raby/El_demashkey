import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import AdminToast from "@/components/AdminToast";

export const metadata: Metadata = {
  title: "دمشقي - المذاق الشامي الأصيل",
  description: "نظام إدارة وتوصيل مطعم دمشقي - دمنهور",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-on-background">
        <AppProvider>
          <AdminToast />
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
