"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const[email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const[isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage({ type: "error", text: "Erro ao fazer login. Verifique suas credenciais." });
      setIsLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      setMessage({ type: "error", text: "Preencha e-mail e senha para criar conta." });
      return;
    }
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Conta criada! Você já pode fazer login." });
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Acesse sua conta</h1>
          <p className="text-zinc-400 text-sm mt-2">Entre ou crie uma conta para começar a dimensionar seus eventos.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              placeholder="••••••••"
              required
            />
          </div>

          {message.text && (
            <div className={`p-3 rounded-lg text-sm ${message.type === "error" ? "bg-red-900/30 text-red-400 border border-red-900/50" : "bg-green-900/30 text-green-400 border border-green-900/50"}`}>
              {message.text}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? "Carregando..." : "Entrar"}
            </button>
            
            <button
              type="button"
              onClick={handleSignUp}
              disabled={isLoading}
              className="w-full bg-transparent border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              Criar nova conta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}