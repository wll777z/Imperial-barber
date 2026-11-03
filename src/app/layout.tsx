import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Imperial Barber | Seu estilo, nossa assinatura",
  description:
    "Cortes modernos, barba impecável e cuidado em cada detalhe. Conheça a Imperial Barber e reserve seu horário.",
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
