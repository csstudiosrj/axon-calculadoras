"use client";

import { useMonetization } from "@/components/providers/MonetizationProvider";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function Header() {
  const { profile } = useMonetization();
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Força o recarregamento da página para limpar todos os estados e ir pro login
    window.location.href = "/login";
  };

  return (
    <header className="w-full border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-white">
            AXON <span className="text-[#138946]">Calculadoras</span>
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-300">
          {profile && (
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          )}
          <Link href="/planos" className="hover:text-white transition-colors">Planos</Link>
        </nav>
        
        <div className="flex items-center gap-4">
          {profile ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-400 hidden md:block">{profile.email}</span>
              <button 
                onClick={handleLogout}
                className="text-sm font-medium border border-zinc-700 hover:bg-zinc-800 text-zinc-300 px-4 py-2 rounded-md transition-colors"
              >
                Sair
              </button>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="text-sm font-medium bg-[#138946] hover:bg-[#005e30] text-white px-4 py-2 rounded-md transition-colors shadow-lg shadow-[#138946]/20"
            >
              Acessar Conta
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}