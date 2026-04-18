import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MonetizationProvider } from "@/components/providers/MonetizationProvider";

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
          
          {/* Header / Navbar do SaaS */}
          <header className="w-full border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md sticky top-0 z-40">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white">
                  AXON <span className="text-blue-500">Calculadoras</span>
                </span>
              </div>
              
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-300">
                <a href="/dashboard" className="hover:text-white transition-colors">Dashboard</a>
                <a href="/calculadoras" className="hover:text-white transition-colors">Calculadoras</a>
                <a href="/planos" className="hover:text-white transition-colors">Planos</a>
              </nav>
              
              <div className="flex items-center gap-4">
                 <a href="/login" className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors shadow-lg shadow-blue-900/20">
                   Acessar Conta
                 </a>
              </div>
            </div>
          </header>

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