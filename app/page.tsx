// src/app/page.tsx
import Link from "next/link";

export default function CalculadorasHome() {
  return (
    <main className="min-h-screen bg-[var(--color-axon-bg,#0d0807)] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--color-axon-panel,#1a1413)] border border-[var(--color-axon-border,#2e2825)] rounded-2xl p-8 text-center shadow-2xl space-y-8">
        
        {/* Cabeçalho do Sistema */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            ARXUM <span className="text-[var(--color-axon-gold,#C5A059)]">Calculadoras</span>
          </h1>
          <p className="text-sm text-gray-400">
            Ferramentas inteligentes de orçamento, métricas e precificação.
          </p>
        </div>

        {/* CTA PRINCIPAL: Botão de Acesso Destacado */}
        <div className="py-2">
          <Link
            href="/login"
            className="w-full block bg-[var(--color-axon-gold,#C5A059)] hover:bg-[#d9b36a] text-black font-bold px-6 py-4 rounded-xl transition-all shadow-lg shadow-[var(--color-axon-gold-dim,rgba(197,160,89,0.12))] transform hover:-translate-y-0.5 text-lg"
          >
            Acessar Calculadoras
          </Link>
        </div>

        {/* Divisor Sutil */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-[var(--color-axon-border,#2e2825)]"></div>
          <span className="flex-shrink mx-4 text-xs text-gray-500 tracking-wider uppercase">Outros Sistemas</span>
          <div className="flex-grow border-t border-[var(--color-axon-border,#2e2825)]"></div>
        </div>

        {/* Links Menores para os Outros Sistemas */}
        <nav className="grid grid-cols-2 gap-3 text-xs">
          <a href="/" className="bg-[var(--color-axon-bg,#0d0807)] hover:bg-black/40 border border-[var(--color-axon-border,#2e2825)] text-gray-400 hover:text-white py-2 px-3 rounded-lg transition-all text-center">
            Home Principal
          </a>
          <a href="/fest" className="bg-[var(--color-axon-bg,#0d0807)] hover:bg-black/40 border border-[var(--color-axon-border,#2e2825)] text-gray-400 hover:text-white py-2 px-3 rounded-lg transition-all text-center">
            Fest
          </a>
          <a href="/suite" className="bg-[var(--color-axon-bg,#0d0807)] hover:bg-black/40 border border-[var(--color-axon-border,#2e2825)] text-gray-400 hover:text-white py-2 px-3 rounded-lg transition-all text-center">
            Suite
          </a>
          <a href="/crew" className="bg-[var(--color-axon-bg,#0d0807)] hover:bg-black/40 border border-[var(--color-axon-border,#2e2825)] text-gray-400 hover:text-white py-2 px-3 rounded-lg transition-all text-center">
            Crew
          </a>
          <a href="/poseidon" className="col-span-2 bg-[var(--color-axon-bg,#0d0807)] hover:bg-black/40 border border-[var(--color-axon-border,#2e2825)] text-gray-400 hover:text-white py-2 px-3 rounded-lg transition-all text-center">
            Poseidon
          </a>
        </nav>

        {/* Rodapé institucional */}
        <p className="text-[10px] text-gray-600 tracking-wide pt-2">
          © 2026 ARXUM Sistemas — Todos os direitos reservados.
        </p>
      </div>
    </main>
  );
}