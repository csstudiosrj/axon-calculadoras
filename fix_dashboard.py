content = '''"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { EventData } from "@/types/monetization";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [eventos, setEventos] = useState<EventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingEventos, setLoadingEventos] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/auth/login");
        return;
      }
      setUser(session.user);
      setIsLoading(false);

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (!error && data) setEventos(data as EventData[]);
      setLoadingEventos(false);
    };
    init();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-[#138946] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const ativosCount = eventos.filter(e => e.is_active).length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Meu Painel</h1>
        <p className="text-zinc-400">Bem-vindo(a), {user.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-lg">
          <h3 className="text-zinc-400 text-sm font-medium mb-1">Eventos Ativos</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">{ativosCount}</span>
          </div>
          <button
            onClick={() => router.push("/eventos/novo")}
            className="mt-4 w-full bg-[#138946] hover:bg-[#005e30] text-white font-medium text-sm py-2 rounded-lg transition-colors shadow-lg shadow-[#138946]/20"
          >
            + Novo Evento
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-lg">
          <h3 className="text-zinc-400 text-sm font-medium mb-1">Total de Eventos</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">{eventos.length}</span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Meus Eventos</h2>

        {loadingEventos ? (
          <div className="text-center py-12 text-zinc-500">Carregando eventos...</div>
        ) : eventos.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-12 text-center">
            <p className="text-zinc-500 mb-4">Você ainda não possui eventos cadastrados.</p>
            <button
              onClick={() => router.push("/eventos/novo")}
              className="bg-[#138946] hover:bg-[#005e30] text-white font-medium px-6 py-2 rounded-lg transition-colors"
            >
              Criar primeiro evento
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {eventos.map((evento) => (
              <div
                key={evento.id}
                onClick={() => router.push(`/eventos/${evento.id}`)}
                className="bg-zinc-900 border border-zinc-800 hover:border-[#52ad92] p-5 rounded-xl cursor-pointer transition-all hover:-translate-y-1 group flex justify-between items-center"
              >
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-[#52ad92] transition-colors">{evento.name}</h3>
                  <p className="text-zinc-500 text-sm">PAX: {evento.pax.toLocaleString("pt-BR")}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-md ${evento.is_active ? "bg-[#138946]/20 text-[#138946]" : "bg-red-900/20 text-red-400"}`}>
                    {evento.is_active ? "Ativo" : "Expirado"}
                  </span>
                  <p className="text-zinc-600 text-xs mt-2">Usos: {evento.uses_count}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
'''

with open('./app/dashboard/page.tsx', 'w') as f:
    f.write(content)

print("ok")