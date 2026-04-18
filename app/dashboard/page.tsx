"use client";

import { useMonetization } from "@/components/providers/MonetizationProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { profile, isLoading } = useMonetization();
  const router = useRouter();

  // Proteção de Rota: Se não estiver logado, manda pro login
  useEffect(() => {
    if (!isLoading && !profile) {
      router.push("/login");
    }
  }, [isLoading, profile, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) return null; // Evita piscar a tela antes de redirecionar

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Meu Painel</h1>
        <p className="text-zinc-400">Bem-vindo(a), {profile.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Card do Plano */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-lg">
          <h3 className="text-zinc-400 text-sm font-medium mb-1">Plano Atual</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">{profile.tier}</span>
          </div>
          <button className="mt-4 w-full bg-zinc-800 hover:bg-zinc-700 text-white text-sm py-2 rounded-lg transition-colors">
            Fazer Upgrade
          </button>
        </div>

        {/* Card de Créditos Extras */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-lg">
          <h3 className="text-zinc-400 text-sm font-medium mb-1">Créditos Avulsos</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-blue-500">{profile.extra_credits}</span>
            <span className="text-zinc-500 mb-1">usos</span>
          </div>
          <button className="mt-4 w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-900/50 text-sm py-2 rounded-lg transition-colors">
            Comprar Créditos
          </button>
        </div>

        {/* Card de Eventos Ativos */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-lg">
          <h3 className="text-zinc-400 text-sm font-medium mb-1">Eventos Ativos</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">0</span>
            <span className="text-zinc-500 mb-1">/ {profile.tier === 'FREE' ? '1' : '5'}</span>
          </div>
          <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-lg transition-colors shadow-lg shadow-blue-900/20">
            + Novo Evento
          </button>
        </div>
      </div>

      {/* Lista de Eventos (Vazia por enquanto) */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Meus Eventos</h2>
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-12 text-center">
          <p className="text-zinc-500">Você ainda não possui eventos cadastrados.</p>
        </div>
      </div>
    </div>
  );
}