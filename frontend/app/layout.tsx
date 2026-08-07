import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Librerio - Tu biblioteca digital",
  description: "Descubre, organiza y comparte tus libros favoritos en Librerio, la plataforma de lectura definitiva.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
