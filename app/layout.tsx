import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MonetizationProvider } from "@/components/providers/MonetizationProvider";
import { Header } from "@/components/layout/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AXON Calculadoras | CS Com Eventos",
  description: "Sistema B2B/B2C de dimensionamento técnico para produtores de eventos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-zinc-950 text-zinc-50 antialiased min-h-screen flex flex-col`}>
        <MonetizationProvider>
          
          {/* O Novo Header Inteligente */}
          <Header />

          {/* Área Principal de Conteúdo */}
          <main className="flex-1 container mx-auto px-4 py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="w-full border-t border-zinc-800 bg-zinc-950 py-6 mt-auto">
            <div className="container mx-auto px-4 text-center text-sm text-zinc-500">
              &copy; 2026 CS Com Eventos - AXON Systems. Todos os direitos reservados.
            </div>
          </footer>

        </MonetizationProvider>
      </body>
    </html>
  );
}