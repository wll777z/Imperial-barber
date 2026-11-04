import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Imperial Barber | Seu estilo, nossa assinatura",
  description:
    "Cortes modernos, barba impecável e cuidado em cada detalhe. Conheça a Imperial Barber e reserve seu horário.",
  icons: {
    icon: [
      {
        url: "/images/barbearia/favicon-32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/images/barbearia/favicon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
    apple: "/images/barbearia/apple-touch-icon.png",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
