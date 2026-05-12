"use client";

import { useState } from "react";
import Link from "next/link";
import { calcSanitarios } from "@/lib/calculations";
import type { SanitariosParams, SanitariosResults, AlertItem } from "@/lib/calculations";

// ─── helpers de estilo ────────────────────────────────────────────────────────

const S = {
  page: {
    minHeight: "100vh",
    background: "#07090c",
    color: "#d8e4f0",
    fontFamily: "'DM Sans', sans-serif",
    paddingBottom: 80,
  } as React.CSSProperties,

  header: {
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    padding: "0 32px",
    height: 56,
    display: "flex",
    alignItems: "center",
    gap: 12,
    position: "sticky" as const,
    top: 0,
    background: "#07090c",
    zIndex: 10,
  },

  wrap: {
    maxWidth: 760,
    margin: "0 auto",
    padding: "40px 24px",
  },

  card: {
    background: "#111820",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 12,
    padding: 28,
    marginBottom: 20,
  },

  fieldset: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginBottom: 4,
  } as React.CSSProperties,

  field: { display: "flex", flexDirection: "column" as const, gap: 6 },

  label: { fontSize: 12, fontWeight: 600, color: "#5e7a94", letterSpacing: "0.06em", textTransform: "uppercase" as const },

  input: {
    background: "#0d1520",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#d8e4f0",
    fontSize: 15,
    outline: "none",
    width: "100%",
  } as React.CSSProperties,

  select: {
    background: "#0d1520",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#d8e4f0",
    fontSize: 15,
    outline: "none",
    width: "100%",
    appearance: "none" as const,
  } as React.CSSProperties,

  checkRow: { display: "flex", alignItems: "center", gap: 10, marginTop: 8 },

  btn: {
    background: "#3ecf8e",
    color: "#07090c",
    fontWeight: 700,
    fontSize: 15,
    border: "none",
    borderRadius: 8,
    padding: "13px 32px",
    cursor: "pointer",
    width: "100%",
    marginTop: 8,
  } as React.CSSProperties,

  resultGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: 14,
    marginTop: 8,
  } as React.CSSProperties,

  resultCard: {
    background: "#0d1520",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 10,
    padding: 16,
  },

  bigNum: { fontSize: 32, fontWeight: 800, color: "#3ecf8e", fontFamily: "'Syne', sans-serif", lineHeight: 1 },
  resultLabel: { fontSize: 12, color: "#5e7a94", marginTop: 6, lineHeight: 1.4 },
  norma: { fontSize: 11, color: "#3a5268", marginTop: 4 },

  alertBox: (level: AlertItem["level"]) => ({
    display: "flex",
    gap: 12,
    borderRadius: 8,
    padding: "12px 16px",
    marginTop: 10,
    background:
      level === "critical" ? "rgba(239,68,68,0.10)" :
      level === "warning"  ? "rgba(245,158,11,0.10)" :
                             "rgba(56,189,248,0.10)",
    border: `1px solid ${
      level === "critical" ? "rgba(239,68,68,0.3)" :
      level === "warning"  ? "rgba(245,158,11,0.3)" :
                             "rgba(56,189,248,0.3)"
    }`,
    color:
      level === "critical" ? "#ef4444" :
      level === "warning"  ? "#f59e0b" :
                             "#38bdf8",
    fontSize: 13,
    lineHeight: 1.5,
  }),
};

// ─── componente ──────────────────────────────────────────────────────────────

export default function SanitariosPage() {
  const [pax, setPax]               = useState("");
  const [area, setArea]             = useState("");
  const [duracao, setDuracao]       = useState("8");
  const [propHomens, setPropHomens] = useState("50");
  const [openBar, setOpenBar]       = useState(false);
  const [result, setResult]         = useState<{ results: SanitariosResults; alerts: AlertItem[] } | null>(null);
  const [error, setError]           = useState("");

  function calcular() {
    setError("");
    const paxN  = parseInt(pax);
    const areaN = parseFloat(area);

    if (!paxN || paxN < 1)    { setError("Informe o número de pessoas (PAX)."); return; }
    if (!areaN || areaN < 1)  { setError("Informe a área do evento em m²."); return; }

    const params: SanitariosParams = {
      pax:              paxN,
      area:             areaN,
      duracaoHoras:     parseFloat(duracao) || 8,
      proporcaoHomens:  (parseFloat(propHomens) || 50) / 100,
      openBar,
    };

    setResult(calcSanitarios(params));
  }

  const r = result?.results;

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        input:focus, select:focus { border-color: rgba(62,207,142,0.5) !important; }
        input[type=checkbox] { accent-color: #3ecf8e; width: 16px; height: 16px; cursor: pointer; }
      `}</style>

      {/* Header */}
      <div style={S.header}>
        <Link href="/protected" style={{ color: "#5e7a94", textDecoration: "none", fontSize: 13 }}>
          ← Ferramentas
        </Link>
        <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#d8e4f0" }}>Sanitários</span>
      </div>

      <div style={S.wrap}>
        {/* Título */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26, color: "#d8e4f0", letterSpacing: "-0.02em", marginBottom: 6 }}>
            Sanitários
          </h1>
          <p style={{ color: "#5e7a94", fontSize: 14 }}>
            NBR 13969 · NR-24 · NBR 9050
          </p>
        </div>

        {/* Formulário */}
        <div style={S.card}>
          <div style={S.fieldset}>
            <div style={S.field}>
              <label style={S.label}>PAX (pessoas)</label>
              <input
                style={S.input}
                type="number"
                min={1}
                placeholder="ex: 5000"
                value={pax}
                onChange={(e) => setPax(e.target.value)}
              />
            </div>
            <div style={S.field}>
              <label style={S.label}>Área do evento (m²)</label>
              <input
                style={S.input}
                type="number"
                min={1}
                placeholder="ex: 2000"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>
            <div style={S.field}>
              <label style={S.label}>Duração (horas)</label>
              <input
                style={S.input}
                type="number"
                min={1}
                max={72}
                placeholder="ex: 8"
                value={duracao}
                onChange={(e) => setDuracao(e.target.value)}
              />
            </div>
            <div style={S.field}>
              <label style={S.label}>% Público Masculino</label>
              <select style={S.select} value={propHomens} onChange={(e) => setPropHomens(e.target.value)}>
                <option value="30">30% masculino / 70% feminino</option>
                <option value="40">40% masculino / 60% feminino</option>
                <option value="50">50% masculino / 50% feminino</option>
                <option value="60">60% masculino / 40% feminino</option>
                <option value="70">70% masculino / 30% feminino</option>
              </select>
            </div>
          </div>

          <div style={S.checkRow}>
            <input
              type="checkbox"
              id="openbar"
              checked={openBar}
              onChange={(e) => setOpenBar(e.target.checked)}
            />
            <label htmlFor="openbar" style={{ fontSize: 14, color: "#d8e4f0", cursor: "pointer" }}>
              Open Bar (aumenta demanda em 40%)
            </label>
          </div>

          {error && (
            <p style={{ color: "#ef4444", fontSize: 13, marginTop: 14 }}>{error}</p>
          )}

          <button style={S.btn} onClick={calcular}>
            Calcular
          </button>
        </div>

        {/* Resultados */}
        {r && (
          <>
            <div style={S.card}>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, color: "#d8e4f0", marginBottom: 18 }}>
                Resultado
              </h2>

              <div style={S.resultGrid}>
                {[
                  r.cabinesM,
                  r.cabinesF,
                  r.cabinesPCD,
                  r.mictorios,
                  r.lavatorios,
                  r.totalUnitarios,
                  r.tempoFilaEstimadoMin,
                ].map((rv) => (
                  <div key={rv.label} style={S.resultCard}>
                    <div style={S.bigNum}>{typeof rv.value === "number" ? rv.value.toLocaleString("pt-BR") : rv.value}</div>
                    <div style={S.resultLabel}>{rv.label}</div>
                    {rv.norma && <div style={S.norma}>{rv.norma}</div>}
                  </div>
                ))}
              </div>
            </div>

            {result.alerts.length > 0 && (
              <div style={S.card}>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, color: "#d8e4f0", marginBottom: 4 }}>
                  Alertas AXON
                </h2>
                {result.alerts.map((a, i) => (
                  <div key={i} style={S.alertBox(a.level)}>
                    {a.level === "critical" ? "⛔ " : a.level === "warning" ? "⚠️ " : "ℹ️ "}
                    {a.message}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}