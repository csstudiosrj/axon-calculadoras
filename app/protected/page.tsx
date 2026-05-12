import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const calculadoras = [
  {
    id: "publico",
    nome: "Público & Capacidade",
    descricao: "Valida a lotação conforme CBMERJ, CBPMESP e normas federais",
    cor: "#3ecf8e",
    icone: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    categoria: "Licenciamento",
  },
  {
    id: "seguranca",
    nome: "Segurança Privada",
    descricao: "Vigilantes habilitados conforme Portaria DPF 18.045/2023",
    cor: "#f43f5e",
    icone: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    categoria: "Licenciamento",
  },
  {
    id: "brigada",
    nome: "Brigada de Incêndio",
    descricao: "Brigadistas e extintores conforme IT-17 CBPMESP e NT 5-04 CBMERJ",
    cor: "#f59e0b",
    icone: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
    categoria: "Licenciamento",
  },
  {
    id: "sanitarios",
    nome: "Sanitários",
    descricao: "Cabines, mictórios e lavatórios conforme ABNT NBR 9050 e NR-24",
    cor: "#38bdf8",
    icone: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><polyline points="8 10 12 14 16 10"/></svg>`,
    categoria: "Licenciamento",
  },
  {
    id: "equipeMedica",
    nome: "Equipe Médica",
    descricao: "Médicos, enfermeiros e ambulâncias conforme Portaria MS 2.048/2002",
    cor: "#a78bfa",
    icone: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
    categoria: "Licenciamento",
  },
  {
    id: "residuos",
    nome: "Resíduos Sólidos",
    descricao: "Geração de resíduos, coletores e garis conforme NBR 13969",
    cor: "#3ecf8e",
    icone: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
    categoria: "Operacional",
  },
  {
    id: "gerador",
    nome: "Gerador de Energia",
    descricao: "Dimensionamento de carga elétrica conforme NBR 5410",
    cor: "#f59e0b",
    icone: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    categoria: "Operacional",
  },
  {
    id: "sonorizacao",
    nome: "Sonorização",
    descricao: "Potência de som, cobertura e cabos conforme NBR 16366",
    cor: "#38bdf8",
    icone: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`,
    categoria: "Operacional",
  },
  {
    id: "recepcao",
    nome: "Recepção & Staff",
    descricao: "Equipe de recepção, credenciamento e logística de pessoas",
    cor: "#a78bfa",
    icone: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    categoria: "Operacional",
  },
  {
    id: "gelo",
    nome: "Gelo",
    descricao: "Quantidade de gelo por bebida e temperatura do evento",
    cor: "#38bdf8",
    icone: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="m17 7-5-5-5 5"/><path d="m17 17-5 5-5-5"/><path d="M2 12h20"/><path d="m7 7-5 5 5 5"/><path d="m17 7 5 5-5 5"/></svg>`,
    categoria: "Consumo",
  },
  {
    id: "insumos",
    nome: "Insumos & Copos",
    descricao: "Copos, guardanapos, pratos e descartáveis necessários",
    cor: "#3ecf8e",
    icone: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>`,
    categoria: "Consumo",
  },
  {
    id: "alimentacao",
    nome: "Alimentação",
    descricao: "Refeições, porções e pontos de venda por tipo de serviço",
    cor: "#f59e0b",
    icone: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>`,
    categoria: "Consumo",
  },
  {
    id: "bebidas",
    nome: "Bebidas",
    descricao: "Cerveja, destilados, água e refrigerante por perfil de público",
    cor: "#f43f5e",
    icone: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 11H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1Z"/><path d="M15.5 11V6.5a2.5 2.5 0 0 1 5 0v4.9"/><path d="M6 11V4"/><path d="M10 11V4"/></svg>`,
    categoria: "Consumo",
  },
  {
    id: "ingressos",
    nome: "Valor do Ingresso",
    descricao: "Precificação, ponto de equilíbrio e projeção de receita",
    cor: "#3ecf8e",
    icone: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>`,
    categoria: "Financeiro",
  },
  {
    id: "financeiro",
    nome: "Financeiro & Lucro",
    descricao: "Receitas, despesas, margem operacional e ROI do evento",
    cor: "#a78bfa",
    icone: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    categoria: "Financeiro",
  },
  {
    id: "credenciamento",
    nome: "Credenciamento",
    descricao: "Tipos de credencial, zonas de acesso e pontos de credenciamento",
    cor: "#38bdf8",
    icone: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>`,
    categoria: "Operacional",
  },
];

const categorias = ["Licenciamento", "Operacional", "Consumo", "Financeiro"];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier, extra_credits")
    .eq("id", user.id)
    .single();

  const tier = profile?.tier ?? "free";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#07090c",
        color: "#d8e4f0",
        fontFamily: "'DM Sans', sans-serif",
        padding: "0 0 80px 0",
      }}
    >
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .calc-card {
          background: #111820;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
          overflow: hidden;
        }
        .calc-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: var(--accent);
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .calc-card:hover {
          background: #182030;
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .calc-card:hover::before {
          opacity: 1;
        }
        .calc-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.05);
        }
        .categoria-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #5e7a94;
          margin-bottom: 4px;
          margin-top: 32px;
        }
        .categoria-label:first-of-type {
          margin-top: 0;
        }
      `}</style>

      {/* Header */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "0 40px",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        background: "#07090c",
        zIndex: 10,
      }}>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#3ecf8e", letterSpacing: "-0.02em" }}>
          AXON
        </span>
        <span style={{ fontSize: 13, color: "#5e7a94" }}>
          {user.email}
        </span>
      </div>

      {/* Conteúdo */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 32, color: "#d8e4f0", letterSpacing: "-0.02em", marginBottom: 8 }}>
            Ferramentas
          </h1>
          <p style={{ color: "#5e7a94", fontSize: 15 }}>
            16 calculadoras técnicas baseadas em normas ABNT, CBMERJ, CBPMESP e legislação federal
          </p>
        </div>

        {categorias.map((cat) => {
          const calcs = calculadoras.filter((c) => c.categoria === cat);
          return (
            <div key={cat}>
              <p className="categoria-label">{cat}</p>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 16,
                marginBottom: 8,
              }}>
                {calcs.map((calc) => (
                  <Link
                    key={calc.id}
                    href={`/protected/${calc.id}`}
                    className="calc-card"
                    style={{ "--accent": calc.cor } as React.CSSProperties}
                  >
                    <div className="calc-icon" style={{ color: calc.cor }}>
                      <span dangerouslySetInnerHTML={{ __html: calc.icone }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: "#d8e4f0", marginBottom: 4 }}>
                        {calc.nome}
                      </div>
                      <div style={{ fontSize: 13, color: "#5e7a94", lineHeight: 1.5 }}>
                        {calc.descricao}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}