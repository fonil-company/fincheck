import type { Metadata, Viewport } from "next";
import { Montserrat, Playfair_Display, Oswald } from "next/font/google";
import "./globals.css";
import MetaPixel from "@/components/MetaPixel";

const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });
const oswald = Oswald({ variable: "--font-oswald", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Empréstimo Pessoal | Aridiego Pereira Assessoria Bancária",
  description:
    "Simule seu empréstimo pessoal sem compromisso. Análise personalizada, menos burocracia e atendimento com especialista autorizado.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${montserrat.variable} ${playfair.variable} ${oswald.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <MetaPixel />
      </body>
    </html>
  );
}
