import os

# Template base para cada calculadora
def make_calc(calc_id, nome, cor, norma, func_name, campos, results_keys):
    campos_jsx = "\n".join(campos)
    results_jsx = "\n".join([
        f'''                <div key="{k}" className="flex justify-between items-center p-4 bg-zinc-950/80 rounded-xl border border-zinc-800/80">
                  <div>
                    <div className="text-zinc-300 font-medium text-sm">{{rv_{k}.label}}</div>
                    {{rv_{k}.norma && <div className="text-zinc-600 text-xs mt-0.5">{{rv_{k}.norma}}</div>}}
                  </div>
                  <div className="text-2xl font-black text-white ml-4">{{typeof rv_{k}.value === "number" ? rv_{k}.value.toLocaleString("pt-BR") : String(rv_{k}.value)}}</div>
                </div>'''
        for k in results_keys
    ])
    results_destructure = "\n".join([
        f'          const rv_{k} = resultado.results.{k};'
        for k in results_keys
    ])

    return f'''"use client";

import {{ useEffect, useState, Suspense }} from "react";
import {{ useParams, useRouter }} from "next/navigation";
import {{ createBrowserClient }} from "@supabase/ssr";
import {{ EventData }} from "@/types/monetization";

// @ts-ignore
import {{ {func_name} }} from "@/lib/calculators/calculations";

function CalculadoraContent() {{
  const params = useParams();
  const router = useRouter();

  const [evento, setEvento] = useState<EventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {{
    if (!params?.id) return;
    const fetchEvento = async () => {{
      const {{ data, error }} = await supabase.from("events").select("*").eq("id", params.id).single();
      if (!error && data) setEvento(data as EventData);
      setIsLoading(false);
    }};
    fetchEvento();
  }}, [params]);

  const handleCalcular = async (e: React.FormEvent) => {{
    e.preventDefault();
    if (!evento) return;
    setIsCalculating(true);
    setSalvo(false);

    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);

    const calcParams: Record<string, any> = {{ pax: evento.pax, area: parseFloat(fd.get("area") as string) || 0 }};
    fd.forEach((v, k) => {{ if (k !== "area") calcParams[k] = isNaN(Number(v)) ? v : Number(v); }});

    try {{
      const res = {func_name}(calcParams);
      setResultado(res);
      setSalvando(true);
      const {{ data: {{ session }} }} = await supabase.auth.getSession();
      if (session?.user) {{
        await supabase.from("calculations").insert({{
          event_id: params.id,
          user_id: session.user.id,
          calculator_type: "{calc_id}",
          params: calcParams,
          results: res.results,
          alerts: res.alerts,
        }});
        await supabase.from("events").update({{ uses_count: evento.uses_count + 1 }}).eq("id", params.id);
        setEvento(prev => prev ? {{ ...prev, uses_count: prev.uses_count + 1 }} : prev);
        setSalvo(true);
      }}
    }} catch (err) {{
      console.error("Erro:", err);
      alert("Ocorreu um erro ao processar o dimensionamento.");
    }}
    setSalvando(false);
    setIsCalculating(false);
  }};

  if (isLoading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{{{ borderColor: "{cor}", borderTopColor: "transparent" }}}} /></div>;
  if (!evento) return null;

  return (
    <div className="max-w-6xl mx-auto mt-6 pb-12 px-4">
      <button onClick={{() => router.push(`/eventos/${{evento.id}}`)}} className="text-zinc-400 hover:text-white mb-6 text-sm flex items-center gap-2 transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Voltar ao Hub do Evento
      </button>

      <div className="flex items-center gap-5 mb-8 bg-zinc-900/50 border border-zinc-800/80 p-6 rounded-3xl">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{nome}</h1>
          <p className="text-sm mt-1" style={{{{ color: "{cor}" }}}}>{norma}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 rounded-full" style={{{{ backgroundColor: "{cor}" }}}} />
            Parâmetros do Evento
          </h2>
          <form onSubmit={{handleCalcular}} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">PAX (público base)</label>
                <input type="text" value={{evento.pax.toLocaleString("pt-BR")}} disabled className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-400 cursor-not-allowed font-medium" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Área do evento (m²)</label>
                <input name="area" type="number" placeholder="ex: 5000" min={{1}} className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none transition-colors" style={{{{ outlineColor: "{cor}" }}}} />
              </div>
            </div>
{campos_jsx}
            <button type="submit" disabled={{isCalculating}} className="w-full text-white font-bold text-base py-4 rounded-xl transition-all disabled:opacity-50 mt-2" style={{{{ background: `linear-gradient(135deg, {cor}, {cor}99)` }}}}>
              {{isCalculating ? "Processando normas técnicas..." : "Processar dimensionamento"}}
            </button>
          </form>
        </div>

        <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 rounded-full bg-[#D4AF37]" />
            Memorial de Dimensionamento
          </h2>
          {{!resultado ? (
            <div className="flex-grow flex flex-col items-center justify-center text-zinc-600 text-center">
              <svg className="w-12 h-12 opacity-20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={{1.5}} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <p className="text-sm">Preencha os parâmetros e processe para ver o memorial técnico.</p>
            </div>
          ) : (
            <div className="space-y-3 flex-grow">
              {{Object.entries(resultado.results).map(([k, v]: [string, any]) => {{
                if (!v?.label) return null;
                const val = typeof v.value === "object" ? JSON.stringify(v.value) : typeof v.value === "number" ? v.value.toLocaleString("pt-BR") : String(v.value);
                return (
                  <div key={{k}} className="flex justify-between items-center p-4 bg-zinc-950/80 rounded-xl border border-zinc-800/80">
                    <div>
                      <div className="text-zinc-300 font-medium text-sm">{{v.label}}</div>
                      {{v.norma && <div className="text-zinc-600 text-xs mt-0.5">{{v.norma}}</div>}}
                    </div>
                    <div className="text-xl font-black text-white ml-4">{{val}}</div>
                  </div>
                );
              }})}}
              {{salvo && <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-900/40 rounded-xl"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3ecf8e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg><span className="text-green-400 text-sm font-medium">Cálculo salvo no histórico do evento</span></div>}}
              {{salvando && <div className="flex items-center gap-2 p-3 bg-zinc-800/50 rounded-xl"><div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" /><span className="text-zinc-400 text-sm">Salvando...</span></div>}}
            </div>
          )}}
          {{resultado?.alerts?.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Alertas normativos</h3>
              {{resultado.alerts.map((a: any, i: number) => (
                <div key={{i}} className={{`flex items-start gap-2 p-3 rounded-lg border ${{a.level === "critical" ? "bg-red-950/30 border-red-900/40 text-red-300" : a.level === "warning" ? "bg-amber-950/30 border-amber-900/40 text-amber-300" : "bg-blue-950/30 border-blue-900/40 text-blue-300"}}`}}>
                  <span className="text-sm">{{a.message}}</span>
                </div>
              ))}}
            </div>
          )}}
        </div>
      </div>
    </div>
  );
}}

export default function Page() {{
  return (
    <Suspense fallback={{<div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{{{ borderColor: "{cor}", borderTopColor: "transparent" }}}} /></div>}}>
      <CalculadoraContent />
    </Suspense>
  );
}}
'''

CALCULADORAS = [
    {
        "id": "publico",
        "nome": "Público & Capacidade",
        "cor": "#3ecf8e",
        "norma": "ABNT NBR 9077 · IT-12 CBPMESP · NT 5-04 CBMERJ",
        "func": "calcPublico",
        "campos": [
            '''            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Tipo de área</label>
                <select name="tipoArea" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                  <option value="em_pe">Em pé</option>
                  <option value="arquibancada">Arquibancada</option>
                  <option value="pista_danca">Pista de dança</option>
                  <option value="sentado">Sentado</option>
                  <option value="camarote">Camarote</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Norma aplicável</label>
                <select name="estado" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                  <option value="federal">Federal</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="SP">São Paulo</option>
                </select>
              </div>
            </div>''',
        ],
        "results": []
    },
    {
        "id": "seguranca",
        "nome": "Segurança Privada",
        "cor": "#D4AF37",
        "norma": "Portaria DPF 18.045/2023",
        "func": "calcSeguranca",
        "campos": [
            '''            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Tipo de evento</label>
                <select name="tipoEvento" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                  <option value="pago">Pago</option>
                  <option value="gratuito_aberto">Gratuito / Aberto</option>
                  <option value="fechado">Fechado / Corporativo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Perfil de risco</label>
                <select name="perfilRisco" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                  <option value="medio">Médio</option>
                  <option value="baixo">Baixo</option>
                  <option value="alto">Alto</option>
                </select>
              </div>
            </div>''',
        ],
        "results": []
    },
    {
        "id": "brigada",
        "nome": "Brigada de Incêndio",
        "cor": "#FF5722",
        "norma": "IT-17 CBPMESP · NT 5-04 CBMERJ",
        "func": "calcBrigada",
        "campos": [
            '''            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Norma aplicável</label>
                <select name="estado" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                  <option value="federal">Federal</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="SP">São Paulo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Risco de incêndio</label>
                <select name="riscoIncendio" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                  <option value="basico">Básico</option>
                  <option value="alto">Alto</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
              <input type="checkbox" id="estruturas" name="estruturasTemporarias" value="true" className="w-5 h-5 rounded bg-zinc-900" />
              <label htmlFor="estruturas" className="text-sm font-medium text-zinc-200 cursor-pointer">Estruturas temporárias (palcos, tendas, torres)</label>
            </div>''',
        ],
        "results": []
    },
    {
        "id": "equipeMedica",
        "nome": "Equipe Médica",
        "cor": "#E91E63",
        "norma": "Portaria MS 2.048/2002 · CFM Res. 2.228/2018",
        "func": "calcEquipeMedica",
        "campos": [
            '''            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Tipo de evento</label>
                <select name="tipoEvento" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                  <option value="show">Show / Festival</option>
                  <option value="esporte">Esportivo</option>
                  <option value="congresso">Congresso / Corporativo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Perfil do público</label>
                <select name="perfilPublico" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                  <option value="jovem">Jovem (18-35)</option>
                  <option value="geral">Geral</option>
                  <option value="idoso">Idoso (60+)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Local</label>
                <select name="indoorOutdoor" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                  <option value="outdoor">Externo (outdoor)</option>
                  <option value="indoor">Interno (indoor)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Época do ano</label>
                <select name="epocaAno" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                  <option value="outro">Outono / Inverno</option>
                  <option value="verao">Verão</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Duração (horas)</label>
              <select name="duracaoHoras" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                <option value="4">Até 4 horas</option>
                <option value="8">De 4 a 8 horas</option>
                <option value="12">Mais de 8 horas</option>
              </select>
            </div>''',
        ],
        "results": []
    },
    {
        "id": "residuos",
        "nome": "Resíduos Sólidos",
        "cor": "#4CAF50",
        "norma": "NBR 16366 · PNRS Lei 12.305/2010",
        "func": "calcResiduos",
        "campos": [
            '''            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Tipo de evento</label>
                <select name="tipoEvento" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                  <option value="show_bebida">Show com bebida</option>
                  <option value="festival">Festival</option>
                  <option value="congresso">Congresso</option>
                  <option value="corporativo">Corporativo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Coleta</label>
                <select name="coleta" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                  <option value="municipal">Municipal</option>
                  <option value="terceirizada">Terceirizada</option>
                  <option value="proprio">Própria</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Duração (horas)</label>
              <select name="duracaoHoras" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                <option value="4">Até 4 horas</option>
                <option value="8">De 4 a 8 horas</option>
                <option value="12">Mais de 8 horas</option>
              </select>
            </div>''',
        ],
        "results": []
    },
    {
        "id": "gerador",
        "nome": "Gerador de Energia",
        "cor": "#FFC107",
        "norma": "NBR 5410 · AES Standards",
        "func": "calcGerador",
        "campos": [
            '''            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Tipo de evento</label>
                <select name="tipoEvento" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                  <option value="show_pop">Show Pop</option>
                  <option value="rock_edm">Rock / EDM</option>
                  <option value="festival">Festival</option>
                  <option value="palestra">Palestra</option>
                  <option value="corporativo">Corporativo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Quantidade de palcos</label>
                <input name="quantidadePalcos" type="number" defaultValue={1} min={1} max={10} className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                <input type="checkbox" id="iluminacao" name="iluminacaoCenica" value="true" className="w-5 h-5 rounded bg-zinc-900" />
                <label htmlFor="iluminacao" className="text-sm font-medium text-zinc-200 cursor-pointer">Iluminação cênica profissional</label>
              </div>
              <div className="flex items-center gap-3 p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                <input type="checkbox" id="telao" name="telaoLed" value="true" className="w-5 h-5 rounded bg-zinc-900" />
                <label htmlFor="telao" className="text-sm font-medium text-zinc-200 cursor-pointer">Telão LED</label>
              </div>
              <div className="flex items-center gap-3 p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                <input type="checkbox" id="noturno" name="operacaoNoturna" value="true" className="w-5 h-5 rounded bg-zinc-900" />
                <label htmlFor="noturno" className="text-sm font-medium text-zinc-200 cursor-pointer">Operação noturna</label>
              </div>
            </div>''',
        ],
        "results": []
    },
    {
        "id": "sonorizacao",
        "nome": "Sonorização",
        "cor": "#9C27B0",
        "norma": "AES Standards · NR-15",
        "func": "calcSonorizacao",
        "campos": [
            '''            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Tipo de evento</label>
                <select name="tipoEvento" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                  <option value="show_pop">Show Pop</option>
                  <option value="rock_edm">Rock / EDM</option>
                  <option value="festival">Festival</option>
                  <option value="palestra">Palestra</option>
                  <option value="corporativo">Corporativo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Local</label>
                <select name="indoorOutdoor" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                  <option value="outdoor">Externo (outdoor)</option>
                  <option value="indoor">Interno (indoor)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Quantidade de palcos</label>
              <input name="quantidadePalcos" type="number" defaultValue={1} min={1} max={10} className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none" />
            </div>''',
        ],
        "results": []
    },
    {
        "id": "recepcao",
        "nome": "Recepção & Staff",
        "cor": "#00BCD4",
        "norma": "ABRAPE · Boas Práticas de Controle de Acesso",
        "func": "calcRecepcao",
        "campos": [
            '''            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Sistema de entrada</label>
                <select name="sistemaEntrada" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                  <option value="qrcode">QR Code</option>
                  <option value="rfid">RFID / Pulseira</option>
                  <option value="papel">Impresso / Papel</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Tempo de abertura (h)</label>
                <input name="tempoAberturaPortas_h" type="number" defaultValue={2} min={1} max={6} className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none" />
              </div>
            </div>''',
        ],
        "results": []
    },
    {
        "id": "gelo",
        "nome": "Gelo",
        "cor": "#03A9F4",
        "norma": "Senac Eventos · ABRAPE",
        "func": "calcGelo",
        "campos": [
            '''            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Época do ano</label>
                <select name="epocaAno" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                  <option value="outro">Outono / Inverno</option>
                  <option value="verao">Verão</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Consumo principal</label>
                <select name="tipoConsumoPrincipal" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                  <option value="misto">Misto</option>
                  <option value="cerveja">Cerveja</option>
                  <option value="destilado">Destilado</option>
                  <option value="agua">Água / Soft</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Duração (horas)</label>
                <select name="duracaoHoras" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                  <option value="4">Até 4 horas</option>
                  <option value="8">De 4 a 8 horas</option>
                  <option value="12">Mais de 8 horas</option>
                </select>
              </div>
              <div className="flex items-center gap-3 p-4 bg-zinc-950 border border-zinc-800 rounded-xl mt-6">
                <input type="checkbox" id="openbar_gelo" name="openBar" value="true" className="w-5 h-5 rounded bg-zinc-900" />
                <label htmlFor="openbar_gelo" className="text-sm font-medium text-zinc-200 cursor-pointer">Open Bar</label>
              </div>
            </div>''',
        ],
        "results": []
    },
    {
        "id": "insumos",
        "nome": "Insumos & Copos",
        "cor": "#795548",
        "norma": "ABRAPE · NR-24",
        "func": "calcInsumos",
        "campos": [
            '''            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Duração (horas)</label>
                <select name="duracaoHoras" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                  <option value="4">Até 4 horas</option>
                  <option value="8">De 4 a 8 horas</option>
                  <option value="12">Mais de 8 horas</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Época do ano</label>
                <select name="epocaAno" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                  <option value="outro">Outono / Inverno</option>
                  <option value="verao">Verão</option>
                </select>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                <input type="checkbox" id="openbar_insumos" name="openBar" value="true" className="w-5 h-5 rounded bg-zinc-900" />
                <label htmlFor="openbar_insumos" className="text-sm font-medium text-zinc-200 cursor-pointer">Open Bar</label>
              </div>
              <div className="flex items-center gap-3 p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                <input type="checkbox" id="alimentacao_insumos" name="incluiAlimentacao" value="true" className="w-5 h-5 rounded bg-zinc-900" />
                <label htmlFor="alimentacao_insumos" className="text-sm font-medium text-zinc-200 cursor-pointer">Inclui alimentação</label>
              </div>
            </div>''',
        ],
        "results": []
    },
    {
        "id": "alimentacao",
        "nome": "Alimentação",
        "cor": "#FF9800",
        "norma": "NR-24 24.3.1 · ABRAPE",
        "func": "calcAlimentacao",
        "campos": [
            '''            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Duração (horas)</label>
                <select name="duracaoHoras" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                  <option value="4">Até 4 horas</option>
                  <option value="8">De 4 a 8 horas</option>
                  <option value="12">Mais de 8 horas</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Total de staff</label>
                <input name="staffTotal" type="number" placeholder="ex: 50" min={0} className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none" />
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
              <input type="checkbox" id="inclui_publico" name="incluiPublico" value="true" defaultChecked className="w-5 h-5 rounded bg-zinc-900" />
              <label htmlFor="inclui_publico" className="text-sm font-medium text-zinc-200 cursor-pointer">Inclui alimentação para o público</label>
            </div>''',
        ],
        "results": []
    },
    {
        "id": "bebidas",
        "nome": "Bebidas",
        "cor": "#8BC34A",
        "norma": "Abrasel · ABRAPE",
        "func": "calcBebidas",
        "campos": [
            '''            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Época do ano</label>
                <select name="epocaAno" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                  <option value="outro">Outono / Inverno</option>
                  <option value="verao">Verão</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Duração (horas)</label>
                <select name="duracaoHoras" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                  <option value="4">Até 4 horas</option>
                  <option value="8">De 4 a 8 horas</option>
                  <option value="12">Mais de 8 horas</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
              <input type="checkbox" id="openbar_bebidas" name="openBar" value="true" className="w-5 h-5 rounded bg-zinc-900" />
              <label htmlFor="openbar_bebidas" className="text-sm font-medium text-zinc-200 cursor-pointer">Open Bar</label>
            </div>''',
        ],
        "results": []
    },
    {
        "id": "ingressos",
        "nome": "Valor do Ingresso",
        "cor": "#F44336",
        "norma": "Lei 14.697/2024 · ABRAPE",
        "func": "calcIngressos",
        "campos": [
            '''            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Plataforma de venda</label>
                <select name="plataformaVenda" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                  <option value="online">Online</option>
                  <option value="fisico">Físico</option>
                  <option value="misto">Misto</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">% Meia entrada</label>
                <input name="percentualMeia" type="number" defaultValue={40} min={0} max={100} className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">% Cortesia</label>
                <input name="percentualCourtesia" type="number" defaultValue={5} min={0} max={100} className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">% PCD (gratuito)</label>
                <input name="percentualPCD" type="number" defaultValue={2} min={0} max={100} className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none" />
              </div>
            </div>''',
        ],
        "results": []
    },
    {
        "id": "financeiro",
        "nome": "Financeiro & Lucro",
        "cor": "#3ecf8e",
        "norma": "DRE Simplificado · Break-even · ROI",
        "func": "calcFinanceiro",
        "campos": [
            '''            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Receita de ingressos (R$)</label>
                <input name="receitaIngressos" type="number" placeholder="ex: 500000" min={0} className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Receita de patrocínio (R$)</label>
                <input name="receitaPatrocinio" type="number" placeholder="ex: 100000" min={0} className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Receita A&B (R$)</label>
                <input name="receitaAeB" type="number" placeholder="ex: 200000" min={0} className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Custo atração (R$)</label>
                <input name="custoAtracao" type="number" placeholder="ex: 300000" min={0} className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Custo infraestrutura (R$)</label>
                <input name="custoInfraTotal" type="number" placeholder="ex: 150000" min={0} className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Custo operação (R$)</label>
                <input name="custoOperacao" type="number" placeholder="ex: 80000" min={0} className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Custo marketing (R$)</label>
                <input name="custoMarketing" type="number" placeholder="ex: 50000" min={0} className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Imposto (%)</label>
                <input name="impostoPercentual" type="number" defaultValue={15} min={0} max={100} className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none" />
              </div>
            </div>''',
        ],
        "results": []
    },
    {
        "id": "credenciamento",
        "nome": "Credenciamento",
        "cor": "#607D8B",
        "norma": "ABRAPE · Boas Práticas de Credenciamento",
        "func": "calcCredenciamento",
        "campos": [
            '''            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Sistema de credenciamento</label>
                <select name="sistemaCredenciamento" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none">
                  <option value="digital">Digital</option>
                  <option value="fisico">Físico</option>
                  <option value="hibrido">Híbrido</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Dias de evento</label>
                <input name="diasEvento" type="number" defaultValue={1} min={1} max={30} className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none" />
              </div>
            </div>''',
        ],
        "results": []
    },
]

created = []
for calc in CALCULADORAS:
    path = f'./app/eventos/[id]/calculadoras/{calc["id"]}'
    os.makedirs(path, exist_ok=True)
    filepath = f'{path}/page.tsx'
    content = make_calc(
        calc["id"], calc["nome"], calc["cor"], calc["norma"],
        calc["func"], calc["campos"], calc["results"]
    )
    with open(filepath, 'w') as f:
        f.write(content)
    created.append(filepath)

print(f"Criados {len(created)} arquivos:")
for f in created:
    print(f" ✓ {f}")