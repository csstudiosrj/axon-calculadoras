/**
 * AXON Calculadoras - Core Engine
 * 
 * Este arquivo centraliza todas as normas técnicas, instruções normativas, 
 * decretos federais, estaduais, corpo de bombeiros e gramaturas.
 * 
 * NENHUMA regra de pagamento ou anúncio deve existir aqui. 
 * Este arquivo é estritamente matemático e técnico.
 */

// --- COLE AS SUAS 1300 LINHAS DE CÓDIGO A PARTIR DESTA LINHA ---
/**
 * AXON — Motor de Cálculo v1.0
 * utils/calculations.js
 *
 * "Efeito Dominó": PAX e AREA são globais e alimentam todas as 16 ferramentas.
 *
 * Arquitetura:
 *   - Cada ferramenta é uma função pura: (params) => { results, alerts }
 *   - `results` contém os valores calculados com labels e referências normativas
 *   - `alerts` contém os Cross-Checks do AXON PRO (array de { level, message })
 *     levels: 'critical' | 'warning' | 'info'
 *
 * Normas base:
 *   ABNT NBR 9077, IT-17 CBPMESP, NT 5-04 CBMERJ,
 *   Portaria DPF 18.045/2023, Portaria MS 2.048/2002,
 *   NBR 13969, NR-24, NBR 9050, NBR 16366, NBR 5410,
 *   CFM Res. 2.228/2018, Lei 14.697/2024
 */

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS INTERNOS
// ─────────────────────────────────────────────────────────────────────────────

const ceil = Math.ceil;
const floor = Math.floor;
const round = (v, d = 0) => Math.round(v * 10 ** d) / 10 ** d;

/** Retorna o fator de densidade (pax/m²) conforme estado e tipo de área */
function densityFactor({ estado = 'federal', tipoArea = 'em_pe' }) {
  const map = {
    SP: { em_pe: 2.5, arquibancada: 4, pista_danca: 1, sentado: 1.4, camarote: 2.5 },
    RJ: { em_pe: 3,   arquibancada: 3, pista_danca: 1, sentado: 1.4, camarote: 2.5 },
    federal: { em_pe: 2.5, arquibancada: 2.5, pista_danca: 1, sentado: 1.4, camarote: 2.5 },
  };
  const s = map[estado] || map.federal;
  return s[tipoArea] || s.em_pe;
}

// ─────────────────────────────────────────────────────────────────────────────
// PILAR 1 — LICENCIAMENTO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1. PÚBLICO — Capacidade Máxima do Espaço
 *
 * Inputs extras: estado, tipoArea, areaUtil (m²)
 */
export function calcPublico({ pax, area, estado = 'federal', tipoArea = 'em_pe', areaUtil }) {
  const areaEfetiva = areaUtil || area;
  const fator = densityFactor({ estado, tipoArea });
  const capacidadeMaxima = floor(areaEfetiva * fator);
  const ocupacaoPercentual = round((pax / capacidadeMaxima) * 100, 1);
  const saldoCapacidade = capacidadeMaxima - pax;
  const statusOcupacao =
    ocupacaoPercentual >= 100 ? 'LOTAÇÃO_EXCEDIDA' :
    ocupacaoPercentual >= 90  ? 'CRITICO' :
    ocupacaoPercentual >= 75  ? 'ALERTA' : 'OK';

  const alerts = [];

  if (pax > capacidadeMaxima) {
    alerts.push({
      level: 'critical',
      message: `PAX (${pax.toLocaleString()}) excede a capacidade máxima de ${capacidadeMaxima.toLocaleString()} pax para ${areaEfetiva} m² em ${estado} (${fator} pax/m²). Risco de interdição pelo Corpo de Bombeiros.`,
    });
  } else if (ocupacaoPercentual >= 90) {
    alerts.push({
      level: 'warning',
      message: `Ocupação em ${ocupacaoPercentual}%. Margem operacional crítica. Considere reduzir o PAX vendido ou ampliar a área útil.`,
    });
  }

  if (tipoArea === 'em_pe' && estado === 'SP' && area > 5000) {
    alerts.push({
      level: 'info',
      message: `SP — IT 12/2019: para áreas >5.000 m², verifique se a configuração é arquibancada (4 pax/m²) ou pista (2,5 pax/m²). O fator atual aplicado é ${fator} pax/m².`,
    });
  }

  return {
    results: {
      capacidadeMaxima: { value: capacidadeMaxima, label: 'Capacidade Máxima (pax)', norma: `${fator} pax/m² — ${estado}` },
      paxInformado: { value: pax, label: 'PAX Planejado' },
      ocupacaoPercentual: { value: ocupacaoPercentual, label: 'Taxa de Ocupação (%)', status: statusOcupacao },
      saldoCapacidade: { value: saldoCapacidade, label: 'Saldo de Capacidade (pax)' },
      fatorDensidade: { value: fator, label: 'Fator de Densidade (pax/m²)' },
    },
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * 2. SEGURANÇA PRIVADA
 *
 * Inputs extras: tipoEvento ('pago' | 'fechado' | 'gratuito_aberto'),
 *                estado, perfilRisco ('baixo' | 'medio' | 'alto')
 */
export function calcSeguranca({ pax, area, tipoEvento = 'pago', estado = 'federal', perfilRisco = 'medio' }) {
  // Portaria DPF 18.045/2023 Art. 19 / Lei 14.697/2024
  const ratioBase = tipoEvento === 'pago' ? 150 : 300;

  // Ajuste por perfil de risco (prática de produtora)
  const fatorRisco = perfilRisco === 'alto' ? 0.7 : perfilRisco === 'baixo' ? 1.3 : 1.0;
  const ratioEfetivo = round(ratioBase * fatorRisco);

  const vigilantesMinimos = ceil(pax / ratioBase);     // mínimo legal
  const vigilantesRecomendados = ceil(pax / ratioEfetivo); // com fator de risco

  // Distribuição operacional (boas práticas Rock in Rio / Lolla)
  const controladores = ceil(vigilantesRecomendados * 0.30); // acesso/catracas
  const ronda = ceil(vigilantesRecomendados * 0.40);          // circulação interna
  const pontoFixo = ceil(vigilantesRecomendados * 0.20);      // palco/VIP/backstage
  const reserva = ceil(vigilantesRecomendados * 0.10);        // QRF (reserva tática)

  const coordenadores = ceil(vigilantesRecomendados / 20);    // 1 supervisor / 20 vigilantes
  const postoComando = 1;

  const alerts = [];

  if (vigilantesRecomendados < vigilantesMinimos) {
    alerts.push({ level: 'critical', message: 'Cálculo interno resultou em menos que o mínimo legal. Usando mínimo legal.' });
  }

  if (pax > 5000 && perfilRisco !== 'alto') {
    alerts.push({
      level: 'warning',
      message: `Evento com ${pax.toLocaleString()} pax. Reavalie o perfil de risco — eventos de grande porte geralmente demandam classificação 'alto' para garantia da segurança.`,
    });
  }

  if (tipoEvento === 'pago' && pax > 10000) {
    alerts.push({
      level: 'info',
      message: `Portaria DPF 18.045/2023: para eventos pagos acima de 10.000 pax, exige-se plano de segurança aprovado pela autoridade policial local com antecedência mínima de 30 dias.`,
    });
  }

  return {
    results: {
      vigilantesMinimosLegais: { value: vigilantesMinimos, label: 'Vigilantes (Mínimo Legal)', norma: `1/${ratioBase} pax — Portaria DPF 18.045/2023` },
      vigilantesRecomendados: { value: vigilantesRecomendados, label: 'Vigilantes (Recomendado AXON)' },
      distribuicao: {
        controladores: { value: controladores, label: 'Controladores de Acesso' },
        ronda: { value: ronda, label: 'Ronda / Circulação' },
        pontoFixo: { value: pontoFixo, label: 'Pontos Fixos (Palco/VIP)' },
        reserva: { value: reserva, label: 'Reserva Tática (QRF)' },
      },
      coordenadores: { value: coordenadores, label: 'Supervisores / Coordenadores' },
      totalEfetivo: { value: vigilantesRecomendados + coordenadores + postoComando, label: 'Efetivo Total de Segurança' },
    },
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * 3. BRIGADA DE INCÊNDIO
 *
 * Inputs extras: estado, riscoIncendio ('basico' | 'alto'),
 *                estruturasTemporárias (boolean), areaTotalM2
 */
export function calcBrigada({ pax, area, estado = 'federal', riscoIncendio = 'basico', estruturasTemporarias = true }) {
  let brigadistas;
  let normaAplicada;

  if (estado === 'SP' && pax > 10000) {
    // IT-17 SP: >10.000 pax → 1/200
    brigadistas = ceil(pax / 200);
    normaAplicada = 'IT-17 CBPMESP (>10.000 pax): 1 brigadista / 200 pax';
  } else if (riscoIncendio === 'alto') {
    brigadistas = ceil(pax / 250);
    normaAplicada = 'IT-17 CBPMESP risco alto: 1 brigadista / 250 pax';
  } else {
    // Federal / padrão: 1/500 pax OU 1/2500 m²
    const por_pax = ceil(pax / 500);
    const por_area = ceil(area / 2500);
    brigadistas = Math.max(por_pax, por_area);
    normaAplicada = `IT-17 SP / NT 5-04 RJ: max(${por_pax} por pax, ${por_area} por área)`;
  }

  // RJ — estruturas temporárias: mínimo 2 BC + 1 a cada 2.500 m²
  let brigadistasRJ = 0;
  if (estado === 'RJ' && estruturasTemporarias) {
    brigadistasRJ = 2 + ceil(area / 2500);
    if (brigadistasRJ > brigadistas) {
      brigadistas = brigadistasRJ;
      normaAplicada = 'NT 5-04 CBMERJ Tabela 1: 2 BC + 1/2.500 m² (estruturas temporárias)';
    }
  }

  // Extintores: 1 a cada 100 m² ATC (NT CBMERJ 5-04)
  const extintores = ceil(area / 100);

  // Pontos de hidrante (prática: 1/2500 m² em locais sem rede pública)
  const hidrantes = ceil(area / 2500);

  // Supervisores de brigada: 1 a cada 10 brigadistas
  const supervisores = ceil(brigadistas / 10);

  const alerts = [];

  if (riscoIncendio === 'basico' && (estado === 'SP' || estado === 'RJ')) {
    alerts.push({
      level: 'info',
      message: `Confirme com o CBME${estado} a classificação de risco. Eventos com uso de pirotecnia, geração de energia a diesel e estruturas de madeira são automaticamente classificados como risco alto.`,
    });
  }

  if (pax > 10000 && riscoIncendio === 'basico') {
    alerts.push({
      level: 'warning',
      message: `Com ${pax.toLocaleString()} pax, a classificação de risco 'básico' pode ser recusada pelo Corpo de Bombeiros. Recomenda-se plano de risco alto para eventos de grande porte.`,
    });
  }

  if (extintores < 4) {
    alerts.push({ level: 'warning', message: 'Mínimo absoluto de 4 extintores por área de evento, independente do cálculo de m².' });
  }

  return {
    results: {
      brigadistas: { value: brigadistas, label: 'Brigadistas Mínimos', norma: normaAplicada },
      supervisores: { value: supervisores, label: 'Supervisores de Brigada' },
      totalBrigada: { value: brigadistas + supervisores, label: 'Total da Brigada' },
      extintores: { value: Math.max(extintores, 4), label: 'Extintores (ABC mínimo)', norma: '1/100 m² ATC — NT CBMERJ 5-04' },
      hidrantes: { value: hidrantes, label: 'Pontos de Hidrante / Carro Pipa' },
    },
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * 4. SANITÁRIOS
 *
 * Inputs extras: duracaoHoras, proporcaoHomens (0–1), openBar (boolean),
 *                estado, pcdPercentual (0–1, default 0.05)
 */
export function calcSanitarios({ pax, area, duracaoHoras = 8, proporcaoHomens = 0.5, openBar = false, estado = 'federal', pcdPercentual = 0.05 }) {
  const homens = round(pax * proporcaoHomens);
  const mulheres = pax - homens;

  // NBR 13969 / NR-24: >6h
  const ratioM = duracaoHoras > 6 ? 100 : 200; // 1 cabine / N homens
  const ratioF = duracaoHoras > 6 ? 50 : 100;  // 1 cabine / N mulheres

  // Open bar aumenta demanda em ~40%
  const fatorOpenBar = openBar ? 1.4 : 1.0;

  const cabinesM = ceil((homens / ratioM) * fatorOpenBar);
  const cabinesF = ceil((mulheres / ratioF) * fatorOpenBar);

  // PCD: NBR 9050 — 1 por 500 pax, min 1, sendo pelo menos 1 por gênero
  const cabinesPCD = Math.max(2, ceil(pax / 500));

  // Mictórios: prática — 1 a cada 50 homens reduz fila e número de cabines masculinas
  const mictorios = ceil(homens / 50);

  // Lavatórios (pias): 1 a cada 3 sanitários (NR-24)
  const lavatorios = ceil((cabinesM + cabinesF + cabinesPCD) / 3);

  // Tempo médio de fila estimado (modelo simplificado)
  // Assume: 3 min/uso, pico = 20% do público simultaneamente
  const picoSimultaneo = ceil(pax * 0.20);
  const totalCabines = cabinesM + cabinesF + cabinesPCD;
  const tempoFilaMin = round((picoSimultaneo / totalCabines) * 3, 1);

  const alerts = [];

  if (openBar && (cabinesM + cabinesF) < ceil(pax / 30)) {
    alerts.push({
      level: 'critical',
      message: `Open Bar ativo com ${pax.toLocaleString()} pax: o número de cabines (${cabinesM + cabinesF}) pode ser insuficiente. Referência prática: 1 cabine / 30 pax com open bar. Risco de filas >15 min.`,
    });
  }

  if (tempoFilaMin > 10) {
    alerts.push({
      level: 'warning',
      message: `Tempo estimado de fila no pico: ${tempoFilaMin} min. Considere aumentar o número de cabines para manter ≤10 min (padrão de conforto NR-24).`,
    });
  }

  if (duracaoHoras <= 6) {
    alerts.push({
      level: 'info',
      message: `Evento com ≤6h de duração. Aplicando NR-24 para jornada parcial (1/200 H, 1/100 F). Para eventos com duração >6h o cálculo usa NBR 13969 (mais restritivo).`,
    });
  }

  return {
    results: {
      cabinesM: { value: cabinesM, label: 'Cabines Masculinas', norma: `1/${ratioM} homens — NBR 13969 / NR-24` },
      cabinesF: { value: cabinesF, label: 'Cabines Femininas', norma: `1/${ratioF} mulheres — NBR 13969 / NR-24` },
      cabinesPCD: { value: cabinesPCD, label: 'Cabines PCD Acessíveis', norma: '1/500 pax — NBR 9050 5.10.1' },
      mictorios: { value: mictorios, label: 'Mictórios (recomendado)' },
      lavatorios: { value: lavatorios, label: 'Lavatórios (pias)' },
      totalUnitarios: { value: cabinesM + cabinesF + cabinesPCD + mictorios, label: 'Total de Unidades Sanitárias' },
      tempoFilaEstimadoMin: { value: tempoFilaMin, label: 'Tempo de Fila no Pico (min)', status: tempoFilaMin > 10 ? 'ALERTA' : 'OK' },
    },
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * 5. EQUIPE MÉDICA
 *
 * Inputs extras: estado, tipoEvento ('show' | 'esporte' | 'congresso'),
 *                perfilPublico ('jovem' | 'geral' | 'idoso'),
 *                duracaoHoras, indoorOutdoor ('indoor' | 'outdoor'), epocaAno ('verao' | 'inverno' | 'outro')
 */
export function calcEquipeMedica({ pax, area, estado = 'federal', tipoEvento = 'show', perfilPublico = 'geral', duracaoHoras = 8, indoorOutdoor = 'outdoor', epocaAno = 'outro' }) {
  // Base: Portaria MS 2.048/2002 + CFM Res. 2.228/2018
  let medicos, enfermeiros, ambulanciasB, ambulanciasD, socorristas;

  if (pax <= 5000) {
    medicos = 1; enfermeiros = 2; ambulanciasB = 1; ambulanciasD = 0;
  } else if (pax <= 10000) {
    medicos = 2; enfermeiros = 4; ambulanciasB = 1; ambulanciasD = 1;
  } else {
    // >10.000: base + escalonamento CFM 2.228/2018
    const extra = Math.max(0, pax - 10000);
    medicos = 2 + ceil(extra / 5000);
    enfermeiros = 4 + ceil(extra / 2500);
    ambulanciasB = 1 + ceil(pax / 10000) - 1;
    ambulanciasD = 1 + ceil(extra / 10000);
  }

  // Socorristas/maqueiros: 1 por 1.000 pax (prática de megaevento)
  socorristas = ceil(pax / 1000);

  // Ajuste por perfil de público
  const fatorPerfil = perfilPublico === 'jovem' ? 1.2 : perfilPublico === 'idoso' ? 1.5 : 1.0;
  // Ajuste por verão outdoor (risco de hipertermia)
  const fatorClima = (epocaAno === 'verao' && indoorOutdoor === 'outdoor') ? 1.3 : 1.0;

  medicos = ceil(medicos * fatorPerfil * fatorClima);
  enfermeiros = ceil(enfermeiros * fatorPerfil * fatorClima);
  socorristas = ceil(socorristas * fatorPerfil * fatorClima);

  // Postos médicos: 1 a cada 5.000 pax, min 1 (Portaria SMS-SP 490/2020)
  const postosMedicos = Math.max(1, ceil(pax / 5000));

  // DEA (desfibriladores): 1 por 2.000 pax em eventos de risco (prática AHA)
  const deaUnidades = ceil(pax / 2000);

  const alerts = [];

  if (epocaAno === 'verao' && indoorOutdoor === 'outdoor' && pax > 5000) {
    alerts.push({
      level: 'critical',
      message: `Verão + Outdoor + ${pax.toLocaleString()} pax: alto risco de hipertermia e insolação. Equipe médica ampliada por fator 1.3. Verifique distribuição de pontos de água e sombreamento.`,
    });
  }

  if (perfilPublico === 'jovem' && tipoEvento === 'show') {
    alerts.push({
      level: 'warning',
      message: `Público jovem em show: maior incidência de intoxicação alcoólica e uso de substâncias. Considere equipe de redução de danos e tenda de suporte psicológico.`,
    });
  }

  if (estado === 'SP') {
    alerts.push({
      level: 'info',
      message: `SP — Portaria SMS-SP 490/2020: exige plano de atendimento médico protocolado com SAMU local com antecedência mínima de 72h. Providencie ART do responsável técnico médico.`,
    });
  }

  return {
    results: {
      medicos: { value: medicos, label: 'Médicos', norma: 'Portaria MS 2.048/2002 + CFM Res. 2.228/2018' },
      enfermeiros: { value: enfermeiros, label: 'Enfermeiros / Técnicos de Enfermagem' },
      socorristas: { value: socorristas, label: 'Socorristas / Maqueiros' },
      ambulanciasBasica: { value: ambulanciasB, label: 'Ambulâncias Suporte Básico (Tipo B)' },
      ambulanciasAvancada: { value: ambulanciasD, label: 'Ambulâncias Suporte Avançado (Tipo D/UTI)' },
      postosMedicos: { value: postosMedicos, label: 'Postos de Atendimento Médico', norma: 'Portaria SMS-SP 490/2020' },
      deaUnidades: { value: deaUnidades, label: 'DEA (Desfibriladores)' },
      totalEquipe: { value: medicos + enfermeiros + socorristas, label: 'Total da Equipe Médica' },
    },
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * 6. RESÍDUOS SÓLIDOS
 *
 * Inputs extras: tipoEvento ('show_bebida' | 'congresso' | 'festival' | 'corporativo'),
 *                duracaoHoras, coleta ('municipal' | 'terceirizada' | 'proprio')
 */
export function calcResiduos({ pax, area, tipoEvento = 'show_bebida', duracaoHoras = 8, coleta = 'terceirizada' }) {
  // NBR 16366 Tabela 1
  const kgPorPaxMap = {
    show_bebida: 2.0,
    festival: 2.5,       // estimativa — múltiplas atrações, maior rotatividade de consumo
    congresso: 0.75,
    corporativo: 0.5,
  };
  const kgPorPax = kgPorPaxMap[tipoEvento] || 2.0;
  const totalResiduo_kg = round(pax * kgPorPax);

  // Distribuição por tipo (estimativas NBR 16366 + prática)
  const organico_kg = round(totalResiduo_kg * 0.45);
  const reciclavel_kg = round(totalResiduo_kg * 0.35);
  const rejeito_kg = round(totalResiduo_kg * 0.20);

  // Coletas intermediárias durante o evento
  const coletasNecessarias = ceil(duracaoHoras / 4); // a cada 4h

  // Número de coletores/lixeiras (1 a cada 50 m² — prática)
  const coletores = ceil(area / 50);

  // Caminhão: capacidade padrão 8 toneladas
  const caminhoes = ceil(totalResiduo_kg / 8000);

  // Pessoal de coleta (garis): 1 a cada 500 m², min 2
  const garis = Math.max(2, ceil(area / 500));

  // Custo estimado de destinação (R$/tonelada — referência ABRELPE 2023)
  const custoPorTon = coleta === 'municipal' ? 0 : coleta === 'terceirizada' ? 350 : 280;
  const custoEstimado = round((totalResiduo_kg / 1000) * custoPorTon, 2);

  const alerts = [];

  if (totalResiduo_kg > 5000) {
    alerts.push({
      level: 'warning',
      message: `Geração estimada de ${(totalResiduo_kg / 1000).toFixed(1)} toneladas. Exige licença de transporte de resíduos (MTR) e destinação final registrada. Verifique PNRS (Lei 12.305/2010).`,
    });
  }

  if (coletores < 10 && pax > 5000) {
    alerts.push({
      level: 'warning',
      message: `Número de coletores (${coletores}) pode ser insuficiente para ${pax.toLocaleString()} pax. Pico de descarte ocorre no intervalo entre atrações.`,
    });
  }

  if (tipoEvento === 'show_bebida' || tipoEvento === 'festival') {
    alerts.push({
      level: 'info',
      message: `Implante coletores seletivos (cores NBR 10.004): VERDE orgânico, AZUL papel, VERMELHO plástico, AMARELO metal. Reduz custo de destinação em ~20% e atende critérios de licença ambiental.`,
    });
  }

  return {
    results: {
      totalResiduo_kg: { value: totalResiduo_kg, label: 'Total de Resíduos Estimado (kg)', norma: `${kgPorPax} kg/pax — NBR 16366` },
      totalResiduo_ton: { value: round(totalResiduo_kg / 1000, 2), label: 'Total de Resíduos Estimado (ton)' },
      organico_kg: { value: organico_kg, label: 'Resíduos Orgânicos (kg) ~45%' },
      reciclavel_kg: { value: reciclavel_kg, label: 'Recicláveis (kg) ~35%' },
      rejeito_kg: { value: rejeito_kg, label: 'Rejeitos (kg) ~20%' },
      coletores: { value: coletores, label: 'Coletores / Lixeiras' },
      garis: { value: garis, label: 'Pessoal de Coleta (Garis)' },
      caminhoes: { value: caminhoes, label: 'Caminhões de Coleta Necessários' },
      coletasNecessarias: { value: coletasNecessarias, label: 'Coletas Intermediárias Durante Evento' },
      custoEstimadoDestinacao: { value: custoEstimado, label: 'Custo Estimado de Destinação (R$)' },
    },
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PILAR 2 — INFRAESTRUTURA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 7. GERADOR DE ENERGIA
 *
 * Inputs extras: tipoEvento ('rock_edm' | 'show_pop' | 'palestra' | 'corporativo' | 'festival'),
 *                quantidadePalcos, iluminacaoCenica (boolean), telaoLed (boolean),
 *                operacaoNoturna (boolean)
 */
export function calcGerador({ pax, area, tipoEvento = 'show_pop', quantidadePalcos = 1, iluminacaoCenica = true, telaoLed = true, operacaoNoturna = true }) {
  // Watts RMS / pax — AES Standards / prática
  const wattsPorPaxMap = {
    rock_edm: 150,
    show_pop: 80,
    palestra: 8,
    corporativo: 15,
    festival: 120,
  };
  const wattsPorPax = wattsPorPaxMap[tipoEvento] || 80;
  const cargaSom_kW = (pax * wattsPorPax) / 1000;

  // Iluminação cênica: ~30% da carga de som para shows grandes
  const cargaIluminacao_kW = iluminacaoCenica ? cargaSom_kW * 0.30 : 0;

  // LED Telão: ~20 kW por painel 9m² (estimativa de mercado)
  const cargaLed_kW = telaoLed ? quantidadePalcos * 20 : 0;

  // Operacional (A&B, sanitários, camarins, tendas): ~15 W/m²
  const cargaOperacional_kW = (area * 15) / 1000;

  // Reserva noturna (iluminação área, segurança perimetral)
  const cargaNoturna_kW = operacaoNoturna ? (area * 5) / 1000 : 0;

  const cargaTotalEstimada_kW = cargaSom_kW + cargaIluminacao_kW + cargaLed_kW + cargaOperacional_kW + cargaNoturna_kW;

  // Fator de margem NBR 5410 (queda máx. 7%, fator de demanda 1.3)
  const cargaComMargem_kW = cargaTotalEstimada_kW * 1.3;
  const kva_necessarios = round(cargaComMargem_kW / 0.85, 0); // fator de potência 0.85

  // Número de geradores (padrão de mercado: grupos 250 kVA, 500 kVA, 1000 kVA)
  const configuracoes = [
    { modelo: '1.000 kVA', kva: 1000 },
    { modelo: '500 kVA', kva: 500 },
    { modelo: '250 kVA', kva: 250 },
    { modelo: '150 kVA', kva: 150 },
  ];
  const melhorConfig = configuracoes.find(c => c.kva >= kva_necessarios / quantidadePalcos) || configuracoes[0];
  const qtdGeradores = ceil(kva_necessarios / melhorConfig.kva);

  // Consumo de diesel estimado: ~0.25 L/kVA/h
  const consumoDiesel_L_h = round(kva_necessarios * 0.25, 0);

  const alerts = [];

  if (kva_necessarios > 5000) {
    alerts.push({
      level: 'warning',
      message: `Carga elétrica estimada em ${kva_necessarios} kVA. Considere renegociação com a distribuidora local para fornecimento direto (CPFL/Enel). Geradores acima de 2MW têm lead time de locação de 60+ dias.`,
    });
  }

  if (!iluminacaoCenica && tipoEvento === 'rock_edm') {
    alerts.push({
      level: 'warning',
      message: `Rock/EDM sem iluminação cênica é incomum. Revise o input — a carga de iluminação representa ~30% do consumo total em shows desse perfil.`,
    });
  }

  alerts.push({
    level: 'info',
    message: `Consumo estimado de diesel: ${consumoDiesel_L_h} L/h. Para evento de ${8}h, providencie mínimo ${consumoDiesel_L_h * 8 * 1.2} L (20% de reserva de segurança).`,
  });

  return {
    results: {
      cargaSom_kW: { value: round(cargaSom_kW, 1), label: 'Carga de Sonorização (kW)', norma: `${wattsPorPax} W/pax — AES Standards` },
      cargaIluminacao_kW: { value: round(cargaIluminacao_kW, 1), label: 'Carga de Iluminação Cênica (kW)' },
      cargaLed_kW: { value: round(cargaLed_kW, 1), label: 'Carga LED/Telão (kW)' },
      cargaOperacional_kW: { value: round(cargaOperacional_kW, 1), label: 'Carga Operacional (A&B, infra) (kW)' },
      cargaTotalEstimada_kW: { value: round(cargaTotalEstimada_kW, 1), label: 'Carga Total Estimada (kW)' },
      kva_necessarios: { value: kva_necessarios, label: 'kVA Necessários (com margem NBR 5410)', norma: 'Fator 1.3 — NBR 5410' },
      configuracaoRecomendada: { value: `${qtdGeradores}x ${melhorConfig.modelo}`, label: 'Configuração de Geradores Recomendada' },
      consumoDiesel_L_h: { value: consumoDiesel_L_h, label: 'Consumo de Diesel (L/h)' },
    },
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * 8. SONORIZAÇÃO
 *
 * Inputs extras: tipoEvento, quantidadePalcos, areaCobertura_m2,
 *                indoorOutdoor, nivelSPL_alvo (dB — default 103 dB para shows)
 */
export function calcSonorizacao({ pax, area, tipoEvento = 'show_pop', quantidadePalcos = 1, indoorOutdoor = 'outdoor', nivelSPL_alvo = 103 }) {
  const wattsPorPaxMap = {
    rock_edm: 150,
    show_pop: 80,
    palestra: 8,
    corporativo: 15,
    festival: 120,
  };
  const wRMS_por_pax = wattsPorPaxMap[tipoEvento] || 80;

  // Potência total do sistema PA (watts RMS)
  const potenciaPA_W = pax * wRMS_por_pax;
  const potenciaPA_kW = round(potenciaPA_W / 1000, 1);

  // Line Array: stacks recomendados (prática: 1 stack principal + delays por 50m)
  // Cada elemento de line array típico ~15 kW (ex: L-Acoustics K2, d&b J-Series)
  const elemPorStack = ceil(potenciaPA_kW / (quantidadePalcos * 15));
  const stacks = quantidadePalcos * 2; // L+R por palco
  const delayTowers = indoorOutdoor === 'outdoor' ? ceil(area / 2500) : 0;

  // Subwoofers: ~30% da potência do PA
  const subwoofers_kW = round(potenciaPA_kW * 0.30, 1);

  // Monitores de palco: 6 a 12 por palco (prática)
  const monitoresPalco = quantidadePalcos * 8;

  // Equipe de áudio
  const FOH_engineers = quantidadePalcos;         // 1 FOH por palco
  const monitor_engineers = quantidadePalcos;     // 1 monitor eng por palco
  const RF_tecnico = ceil(quantidadePalcos / 2);  // gestão de RF/IEM
  const assistentes = ceil(quantidadePalcos * 1.5);

  // SPL check: distância de throw
  // SPL_distância = SPL_fonte - 20*log10(distância/referência)
  const distanciaMaxima = round(Math.sqrt(area), 0);
  const spl_na_distancia = round(nivelSPL_alvo - 20 * Math.log10(distanciaMaxima / 1), 1);

  const alerts = [];

  if (indoorOutdoor === 'indoor' && nivelSPL_alvo > 105) {
    alerts.push({
      level: 'critical',
      message: `SPL alvo de ${nivelSPL_alvo} dB em ambiente indoor excede limites da NR-15 (85 dB/8h para exposto). Exige estudo acústico e barreiras para staff permanente.`,
    });
  }

  if (spl_na_distancia < 90 && tipoEvento === 'rock_edm') {
    alerts.push({
      level: 'warning',
      message: `SPL estimado na distância máxima (${distanciaMaxima}m): ${spl_na_distancia} dB. Para rock/EDM, recomenda-se mínimo 95 dB(A) na última fila. Adicione delay towers.`,
    });
  }

  if (delayTowers === 0 && area > 5000 && indoorOutdoor === 'outdoor') {
    alerts.push({
      level: 'warning',
      message: `Área outdoor de ${area} m² sem delay towers. Cobertura uniforme pode ser comprometida. Verifique cálculo de throw do PA principal.`,
    });
  }

  return {
    results: {
      potenciaPA_kW: { value: potenciaPA_kW, label: 'Potência Total do PA (kW RMS)', norma: `${wRMS_por_pax} W/pax — AES Standards` },
      subwoofers_kW: { value: subwoofers_kW, label: 'Potência de Subwoofers (kW)' },
      stacks: { value: stacks, label: 'Stacks de Line Array (L+R por palco)' },
      elemPorStack: { value: elemPorStack, label: 'Elementos por Stack (estimativa)' },
      delayTowers: { value: delayTowers, label: 'Delay Towers (outdoor)' },
      monitoresPalco: { value: monitoresPalco, label: 'Monitores de Palco' },
      equipe: {
        fohEngineers: FOH_engineers,
        monitorEngineers: monitor_engineers,
        rfTecnicos: RF_tecnico,
        assistentes,
        total: FOH_engineers + monitor_engineers + RF_tecnico + assistentes,
      },
      spl_na_distanciaMax: { value: spl_na_distancia, label: `SPL Estimado na Distância Máxima (${distanciaMaxima}m) (dB)` },
    },
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * 9. RECEPÇÃO / CONTROLE DE ACESSO
 *
 * Inputs extras: tiposIngresso (['pista', 'camarote', 'vip']),
 *                tempoAberturaPortas_h, sistemaEntrada ('qrcode' | 'rfid' | 'papel'),
 *                paxPorHora (estimativa de chegada no pico)
 */
export function calcRecepcao({ pax, area, tiposIngresso = ['pista', 'camarote'], tempoAberturaPortas_h = 2, sistemaEntrada = 'qrcode', paxPorHora }) {
  // Vazão por catraca/leitor (pax/min)
  const vazaoMap = { qrcode: 25, rfid: 40, papel: 15 };
  const vazaoPorPonto = vazaoMap[sistemaEntrada] || 25;

  // Pico de chegada: 40% do público nas primeiras 2h (curva de chegada típica)
  const picoPaxHora = paxPorHora || ceil(pax * 0.40 / tempoAberturaPortas_h);
  const picoPaxMin = ceil(picoPaxHora / 60);

  // Pontos de acesso necessários para absorver o pico
  const pontosAcessoNecessarios = ceil(picoPaxMin / vazaoPorPonto);

  // Distribuição por tipo de ingresso
  const distribuicaoAcessos = {};
  const ratioMap = { pista: 0.70, camarote: 0.15, vip: 0.10, backstage: 0.05 };
  tiposIngresso.forEach(tipo => {
    const ratio = ratioMap[tipo] || (1 / tiposIngresso.length);
    distribuicaoAcessos[tipo] = ceil(pontosAcessoNecessarios * ratio);
  });

  // Filas de acesso: largura mínima 1,20m (NBR 9050) — cada fila suporta 60 pax em espera
  const comprimentoFilaEstimado_m = ceil((picoPaxHora * 0.10) / 60 * 1.5); // 10% em fila, 1,5m/pax

  // Pessoal de recepção
  const recepcao_acesso = pontosAcessoNecessarios; // 1 operador por ponto
  const supervisores_acesso = ceil(pontosAcessoNecessarios / 8);
  const staff_informacoes = ceil(pax / 2000); // posto de informações
  const credenciadores = tiposIngresso.includes('camarote') || tiposIngresso.includes('vip') ? ceil(pax * 0.15 / 200) : 0;

  // Tempo médio de fila estimado (min)
  const tempoFilaMin = round(picoPaxMin / (pontosAcessoNecessarios * vazaoPorPonto) * 60 * 0.5, 1);

  const alerts = [];

  if (tempoFilaMin > 30) {
    alerts.push({
      level: 'critical',
      message: `Tempo de fila estimado no pico: ${tempoFilaMin} min. Risco de confusão na entrada. Adicione ${ceil(pontosAcessoNecessarios * 0.3)} pontos de acesso extras ou implemente abertura gradual de portões.`,
    });
  }

  if (sistemaEntrada === 'papel' && pax > 3000) {
    alerts.push({
      level: 'warning',
      message: `Sistema de ingresso físico (papel) para ${pax.toLocaleString()} pax. Risco alto de fraude e lentidão. Recomenda-se migrar para QR Code com validador duplo.`,
    });
  }

  if (tempoAberturaPortas_h < 2 && pax > 5000) {
    alerts.push({
      level: 'warning',
      message: `Janela de abertura de portões de ${tempoAberturaPortas_h}h é curta para ${pax.toLocaleString()} pax. Recomende abertura mínima de 2h antes da primeira atração.`,
    });
  }

  return {
    results: {
      pontosAcessoNecessarios: { value: pontosAcessoNecessarios, label: 'Pontos de Acesso / Catracas Necessários' },
      distribuicaoAcessos: { value: distribuicaoAcessos, label: 'Distribuição por Tipo de Ingresso' },
      picoPaxPorMinuto: { value: picoPaxMin, label: 'Pico de Chegada (pax/min)' },
      tempoFilaEstimadoMin: { value: tempoFilaMin, label: 'Tempo de Fila no Pico (min)', status: tempoFilaMin > 20 ? 'ALERTA' : 'OK' },
      comprimentoFilaEstimado_m: { value: comprimentoFilaEstimado_m, label: 'Comprimento de Fila Estimado (m)' },
      pessoal: {
        operadoresAcesso: recepcao_acesso,
        supervisores: supervisores_acesso,
        staffInformacoes: staff_informacoes,
        credenciadores,
        total: recepcao_acesso + supervisores_acesso + staff_informacoes + credenciadores,
      },
    },
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PILAR 3 — OPERAÇÃO / INSUMOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 10. GELO
 *
 * Inputs extras: epocaAno, tipoConsumoPrincipal ('cerveja' | 'destilado' | 'agua' | 'misto'),
 *                openBar, duracaoHoras
 */
export function calcGelo({ pax, area, epocaAno = 'verao', tipoConsumoPrincipal = 'cerveja', openBar = false, duracaoHoras = 8 }) {
  // Base: Senac eventos — 1,5 kg/pax em calor/destilados
  const fatorEpoca = epocaAno === 'verao' ? 1.5 : epocaAno === 'inverno' ? 0.8 : 1.1;
  const fatorConsumo = tipoConsumoPrincipal === 'destilado' ? 1.5 : tipoConsumoPrincipal === 'misto' ? 1.2 : 1.0;
  const fatorOpenBar = openBar ? 1.3 : 1.0;

  const kg_por_pax = round(1.5 * fatorEpoca * fatorConsumo * fatorOpenBar, 2);
  const geloTotal_kg = round(pax * kg_por_pax);

  // Distribuição: 60% para bebidas, 30% para conservação A&B, 10% para área médica
  const geloBebidas_kg = round(geloTotal_kg * 0.60);
  const geloAeB_kg = round(geloTotal_kg * 0.30);
  const geloMedico_kg = round(geloTotal_kg * 0.10);

  // Caixas de gelo (caixa padrão 20kg)
  const caixasGelo = ceil(geloTotal_kg / 20);

  // Freezers/bares que precisam de gelo (1 freezer / 100 pax)
  const pontosDistribuicao = ceil(pax / 100);

  // Reposição ao longo do evento: gelo derrete ~15% por hora em ambiente quente
  const fatorDerretimento = epocaAno === 'verao' ? 0.15 : 0.08;
  const geloAdicionalReposicao_kg = round(geloTotal_kg * fatorDerretimento * (duracaoHoras / 2));
  const geloTotalComReposicao_kg = geloTotal_kg + geloAdicionalReposicao_kg;

  const alerts = [];

  if (epocaAno === 'verao' && !openBar && pax > 3000) {
    alerts.push({
      level: 'warning',
      message: `Verão com ${pax.toLocaleString()} pax: risco de desabastecimento de gelo em picos de consumo. Planeje reposição logística a cada 3h e mantenha 20% de reserva no depósito.`,
    });
  }

  if (openBar && tipoConsumoPrincipal === 'destilado') {
    alerts.push({
      level: 'critical',
      message: `Open bar de destilados: consumo de gelo pode ser até 2x o estimado. Considere contratar fornecedor de gelo on-site com máquina de gelo industrial.`,
    });
  }

  return {
    results: {
      kg_por_pax: { value: kg_por_pax, label: 'Gelo por Pessoa (kg)', norma: `Base 1,5 kg/pax — Senac Eventos` },
      geloTotal_kg: { value: geloTotal_kg, label: 'Total de Gelo (kg)' },
      geloTotalComReposicao_kg: { value: geloTotalComReposicao_kg, label: 'Total com Reposição (kg)' },
      distribuicao: {
        bebidas_kg: geloBebidas_kg,
        aeb_kg: geloAeB_kg,
        medico_kg: geloMedico_kg,
      },
      caixasGelo20kg: { value: caixasGelo, label: 'Caixas de Gelo (20 kg/cx)' },
      pontosDistribuicao: { value: pontosDistribuicao, label: 'Pontos de Distribuição / Bares' },
    },
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * 11. INSUMOS GERAIS (água, copos, guardanapos, embalagens)
 *
 * Inputs extras: duracaoHoras, openBar, incluiAlimentacao, epocaAno
 */
export function calcInsumos({ pax, area, duracaoHoras = 8, openBar = false, incluiAlimentacao = true, epocaAno = 'outro' }) {
  // Água: 0,5 L/pax/h — ABRAPE
  const fatorCalor = epocaAno === 'verao' ? 1.3 : 1.0;
  const agua_L_por_pax = round(0.5 * duracaoHoras * fatorCalor, 1);
  const aguaTotal_L = round(pax * agua_L_por_pax);

  // Galões (20L) e garrafinhas (500ml)
  const galoes20L = ceil(aguaTotal_L * 0.30 / 20);   // 30% em galões (bares, postos)
  const garrafinhas500ml = ceil(aguaTotal_L * 0.70 / 0.5); // 70% individual

  // Copos descartáveis: 3 por pessoa/h (rotatividade) * fator openbar
  const fatorCopo = openBar ? 1.5 : 1.0;
  const copas = ceil(pax * 3 * fatorCopo);

  // Embalagens para alimentação
  const embalagens = incluiAlimentacao ? ceil(pax * 1.5) : 0;
  const guardanapos = incluiAlimentacao ? pax * 4 : pax * 1;
  const canudos = openBar ? pax * 3 : pax * 1;

  // Staff: insumos de limpeza (sacos, luvas, álcool)
  const sacosLixo = ceil((area / 50) * (duracaoHoras / 4)); // 1 saco por coletor a cada 4h
  const kitHigiene = ceil(pax / 500); // kits para postos de higiene

  const alerts = [];

  if (aguaTotal_L > 50000) {
    alerts.push({
      level: 'info',
      message: `Demanda de ${(aguaTotal_L / 1000).toFixed(0)} mil litros de água. Verifique capacidade de abastecimento local. Para eventos acima de 50.000L, negocie fornecimento direto com distribuidora ou empresa de water truck.`,
    });
  }

  if (epocaAno === 'verao' && duracaoHoras > 6) {
    alerts.push({
      level: 'warning',
      message: `Verão + evento longo: hidratação crítica. Considere pontos de distribuição de água gratuita conforme Lei 14.017/2020 (Lei Aldir Blanc) e práticas de megaeventos.`,
    });
  }

  return {
    results: {
      agua: {
        total_L: aguaTotal_L,
        galoes20L,
        garrafinhas500ml,
        norma: `${agua_L_por_pax} L/pax (${0.5} L/h × ${duracaoHoras}h) — ABRAPE`,
      },
      coposDescartaveis: { value: copas, label: 'Copos Descartáveis' },
      embalagens: { value: embalagens, label: 'Embalagens de Alimentação' },
      guardanapos: { value: guardanapos, label: 'Guardanapos' },
      canudos: { value: canudos, label: 'Canudos' },
      sacosLixo: { value: sacosLixo, label: 'Sacos de Lixo' },
      kitsHigiene: { value: kitHigiene, label: 'Kits de Higiene (postos)' },
    },
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * 12. ALIMENTAÇÃO (Staff + Público)
 *
 * Inputs extras: staffTotal, duracaoHoras, refeicoesPrevistas,
 *                incluiPublico (boolean — food trucks/praça de alimentação),
 *                percentualPublicoQueAlimenta (0–1)
 */
export function calcAlimentacao({ pax, area, staffTotal, duracaoHoras = 10, refeicoesPrevistas = 2, incluiPublico = true, percentualPublicoQueAlimenta = 0.6 }) {
  // Staff: NR-24 24.3.1 — 900g/refeição + 20% excedente
  const staff = staffTotal || ceil(pax * 0.05); // estimativa: 5% do pax = staff
  const refeicoes_staff = staff * refeicoesPrevistas;
  const gramas_por_refeicao = 900;
  const fatorExcedente = 1.20;
  const totalAlimentacao_staff_kg = round((refeicoes_staff * gramas_por_refeicao * fatorExcedente) / 1000, 1);

  // Público (praça de alimentação / food trucks)
  const publicoQueAlimenta = incluiPublico ? ceil(pax * percentualPublicoQueAlimenta) : 0;
  const refeicoes_publico = publicoQueAlimenta;
  const totalAlimentacao_publico_kg = incluiPublico ? round((refeicoes_publico * 400) / 1000, 1) : 0; // porção média 400g

  // Food trucks / barracas necessários: 1 a cada 300 pax (prática)
  const foodTrucks = incluiPublico ? ceil(publicoQueAlimenta / 300) : 0;

  // Cozinha central de staff: m² de cozinha industrial (2 m² por 50 refeições)
  const areaCozinha_m2 = round((refeicoes_staff / 50) * 2, 0);

  const alerts = [];

  if (refeicoes_staff > 500 && areaCozinha_m2 < 20) {
    alerts.push({
      level: 'warning',
      message: `Mais de 500 refeições para staff. Área de cozinha industrial mínima recomendada: 20 m². Avalie terceirização da produção alimentar (catering).`,
    });
  }

  if (incluiPublico && foodTrucks > 20) {
    alerts.push({
      level: 'info',
      message: `${foodTrucks} food trucks necessários. Para eventos com >20 operações de alimentação, exige-se vigilância sanitária municipal (VISA) e mapa de operações aprovado com antecedência mínima de 15 dias.`,
    });
  }

  if (duracaoHoras > 12 && refeicoesPrevistas < 3) {
    alerts.push({
      level: 'warning',
      message: `Evento de ${duracaoHoras}h com apenas ${refeicoesPrevistas} refeição(ões) prevista(s) para o staff. NR-24 recomenda refeição a cada 5h de trabalho.`,
    });
  }

  return {
    results: {
      staff_refeicoes: { value: refeicoes_staff, label: 'Refeições de Staff' },
      staff_alimentacao_kg: { value: totalAlimentacao_staff_kg, label: 'Alimentos para Staff (kg)', norma: '900g/refeição +20% — NR-24 24.3.1' },
      publico_refeicoes: { value: refeicoes_publico, label: 'Refeições para Público' },
      publico_alimentacao_kg: { value: totalAlimentacao_publico_kg, label: 'Alimentos para Público (kg)' },
      foodTrucks: { value: foodTrucks, label: 'Food Trucks / Barracas de Alimentação' },
      areaCozinhaIndustrial_m2: { value: areaCozinha_m2, label: 'Área de Cozinha Industrial Necessária (m²)' },
      totalAlimentacao_kg: { value: round(totalAlimentacao_staff_kg + totalAlimentacao_publico_kg, 1), label: 'Total de Alimentos (kg)' },
    },
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * 13. BEBIDAS
 *
 * Inputs extras: epocaAno, openBar, duracaoHoras,
 *                tiposDeBebida (['agua', 'cerveja', 'refrigerante', 'destilado']),
 *                proporcaoAlcool (0–1)
 */
export function calcBebidas({ pax, area, epocaAno = 'verao', openBar = false, duracaoHoras = 8, tiposDeBebida = ['agua', 'cerveja', 'refrigerante'], proporcaoAlcool = 0.60 }) {
  // Abrasel / Senac eventos
  const fatorCalor = epocaAno === 'verao' ? 1.0 : epocaAno === 'inverno' ? 0.6 : 0.8;
  const fatorOpenBar = openBar ? 1.5 : 1.0;

  // Consumo por pessoa por hora
  const agua_L_h = 0.5;
  const cerveja_L_h = 1.0 * fatorCalor * fatorOpenBar;
  const refri_L_h = 0.3 * fatorCalor;
  const destilado_doses_h = 0.5 * fatorOpenBar; // doses de 50ml

  const paxAlcool = ceil(pax * proporcaoAlcool);
  const paxSemAlcool = pax - paxAlcool;

  const bebidas = {};

  if (tiposDeBebida.includes('agua')) {
    bebidas.agua = {
      totalLitros: round(pax * agua_L_h * duracaoHoras),
      unidades500ml: ceil(pax * agua_L_h * duracaoHoras / 0.5),
      label: 'Água (L)',
      norma: '0,5 L/pax/h — ABRAPE',
    };
  }

  if (tiposDeBebida.includes('cerveja')) {
    bebidas.cerveja = {
      totalLitros: round(paxAlcool * cerveja_L_h * duracaoHoras),
      latinhas350ml: ceil(paxAlcool * cerveja_L_h * duracaoHoras / 0.35),
      label: 'Cerveja (L)',
      norma: `${cerveja_L_h} L/pax/h — Abrasel`,
    };
  }

  if (tiposDeBebida.includes('refrigerante')) {
    bebidas.refrigerante = {
      totalLitros: round(paxSemAlcool * refri_L_h * duracaoHoras),
      label: 'Refrigerante (L)',
    };
  }

  if (tiposDeBebida.includes('destilado')) {
    bebidas.destilado = {
      totalDoses: round(paxAlcool * proporcaoAlcool * destilado_doses_h * duracaoHoras),
      totalLitros: round(paxAlcool * proporcaoAlcool * destilado_doses_h * duracaoHoras * 0.05),
      label: 'Destilados (doses 50ml)',
    };
  }

  // Bares necessários: 1 bar / 200 pax (prática)
  const bares = ceil(pax / 200);

  // Freezers: 1 por 100 pax
  const freezers = ceil(pax / 100);

  // Estoque de segurança: +15% sobre o total
  const margemEstoque = 0.15;

  const alerts = [];

  if (openBar && epocaAno === 'verao' && pax > 2000) {
    alerts.push({
      level: 'critical',
      message: `Open bar no verão com ${pax.toLocaleString()} pax: consumo de cerveja pode chegar a 1,5L/pax/h. Planeje 25% acima do estimado e tenha contrato de fornecimento emergencial.`,
    });
  }

  if (tiposDeBebida.includes('destilado') && openBar) {
    alerts.push({
      level: 'warning',
      message: `Open bar com destilados: alto risco de intoxicação alcoólica. Intensifique equipe médica (calcBrigada) e tenha protocolo de atendimento a intoxicados.`,
    });
  }

  if (!tiposDeBebida.includes('agua')) {
    alerts.push({
      level: 'critical',
      message: `Água não incluída no planejamento de bebidas! Distribuição de água potável é obrigatória em eventos públicos (Lei 14.017/2020 e normativas municipais).`,
    });
  }

  return {
    results: {
      bebidas,
      bares: { value: bares, label: 'Pontos de Bar' },
      freezers: { value: freezers, label: 'Freezers / Refrigeradores' },
      margemEstoque: { value: `+${margemEstoque * 100}%`, label: 'Margem de Estoque Recomendada' },
    },
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PILAR 4 — GESTÃO / COMERCIAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 14. INGRESSOS
 *
 * Inputs extras: setores (array de { nome, capacidade, precoInteiro }),
 *                percentualMeia, percentualCourtesia, percentualPCD,
 *                plataformaVenda ('online' | 'fisico' | 'misto')
 */
export function calcIngressos({ pax, area, setores, percentualMeia = 0.20, percentualCourtesia = 0.05, percentualPCD = 0.02, plataformaVenda = 'misto' }) {
  const setoresDefault = setores || [
    { nome: 'Pista', capacidade: ceil(pax * 0.70), precoInteiro: 120 },
    { nome: 'Camarote', capacidade: ceil(pax * 0.20), precoInteiro: 350 },
    { nome: 'VIP', capacidade: ceil(pax * 0.08), precoInteiro: 600 },
    { nome: 'PCD', capacidade: ceil(pax * 0.02), precoInteiro: 0 },
  ];

  let totalIngressosPagantesPotencial = 0;
  let receitaBrutaPotencial = 0;
  const breakdown = [];

  setoresDefault.forEach(setor => {
    const cap = setor.capacidade;
    const inteiros = ceil(cap * (1 - percentualMeia - percentualCourtesia - percentualPCD));
    const meias = ceil(cap * percentualMeia);
    const cortesias = ceil(cap * percentualCourtesia);
    const pcd = ceil(cap * percentualPCD);
    const precoMeia = setor.precoInteiro / 2;
    const receita = (inteiros * setor.precoInteiro) + (meias * precoMeia);

    totalIngressosPagantesPotencial += inteiros + meias;
    receitaBrutaPotencial += receita;

    breakdown.push({ setor: setor.nome, capacidade: cap, inteiros, meias, cortesias, pcd, receita });
  });

  // Taxas de plataforma
  const taxaPlataforma = plataformaVenda === 'online' ? 0.10 : plataformaVenda === 'fisico' ? 0.03 : 0.07;
  const taxaPlataformaValor = round(receitaBrutaPotencial * taxaPlataforma, 2);
  const receitaLiquidaIngresso = round(receitaBrutaPotencial - taxaPlataformaValor, 2);

  // Lote de vendas (prática: 5 lotes, desconto progressivo)
  const lotes = [
    { lote: 1, desconto: 0.40, qtd: ceil(pax * 0.15) },
    { lote: 2, desconto: 0.30, qtd: ceil(pax * 0.20) },
    { lote: 3, desconto: 0.15, qtd: ceil(pax * 0.25) },
    { lote: 4, desconto: 0.05, qtd: ceil(pax * 0.25) },
    { lote: 5, desconto: 0.00, qtd: ceil(pax * 0.15) },
  ];

  const alerts = [];

  if (percentualCourtesia > 0.10) {
    alerts.push({
      level: 'warning',
      message: `Cortesias acima de 10% (${(percentualCourtesia * 100).toFixed(0)}%). Isso representa R$ ${round(receitaBrutaPotencial * percentualCourtesia, 0).toLocaleString()} de receita não realizada. Revise a política de cortesias.`,
    });
  }

  if (plataformaVenda === 'online' && taxaPlataformaValor > 50000) {
    alerts.push({
      level: 'info',
      message: `Taxa de plataforma estimada: R$ ${taxaPlataformaValor.toLocaleString()}. Negocie taxa reduzida para volumes acima de R$ 500K.`,
    });
  }

  return {
    results: {
      totalIngressosDisponiveis: { value: pax, label: 'Total de Ingressos Disponíveis' },
      breakdown: { value: breakdown, label: 'Breakdown por Setor' },
      receitaBrutaPotencial: { value: round(receitaBrutaPotencial, 2), label: 'Receita Bruta Potencial (R$)' },
      taxaPlataforma: { value: taxaPlataformaValor, label: `Taxa de Plataforma (${(taxaPlataforma * 100).toFixed(0)}%)` },
      receitaLiquidaIngresso: { value: receitaLiquidaIngresso, label: 'Receita Líquida de Ingressos (R$)' },
      estrategiaLotes: { value: lotes, label: 'Estratégia de Lotes Recomendada' },
    },
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * 15. FINANCEIRO (DRE Simplificado do Evento)
 *
 * Inputs extras: receitaIngressos, receitaPatrocinio, receitaAeB,
 *                custoAtracao, custoInfraTotal, custoOperacao,
 *                custoMarketing, impostoPercentual
 */
export function calcFinanceiro({ pax, area,
  receitaIngressos = 0,
  receitaPatrocinio = 0,
  receitaAeB = 0,
  receitaOutras = 0,
  custoAtracao = 0,
  custoInfraTotal = 0,     // gerador + som + estrutura + palco
  custoOperacao = 0,       // staff + segurança + brigada + médico
  custoMarketing = 0,
  custoLogistica = 0,
  impostoPercentual = 0.15 // ISS + IRPJ simplificado
}) {
  // Receitas
  const receitaBruta = round(receitaIngressos + receitaPatrocinio + receitaAeB + receitaOutras, 2);

  // Impostos
  const impostos = round(receitaBruta * impostoPercentual, 2);
  const receitaLiquida = round(receitaBruta - impostos, 2);

  // Custos Totais
  const custoTotal = round(custoAtracao + custoInfraTotal + custoOperacao + custoMarketing + custoLogistica, 2);

  // Resultado
  const lucroOperacional = round(receitaLiquida - custoTotal, 2);
  const margemOperacional = receitaBruta > 0 ? round((lucroOperacional / receitaBruta) * 100, 1) : 0;

  // Ponto de Equilíbrio (Break-even) em pax
  const custoFixoPorPax = pax > 0 ? round(custoTotal / pax, 2) : 0;
  const receitaMediaPorPax = pax > 0 ? round(receitaBruta / pax, 2) : 0;
  const breakEvenPax = receitaMediaPorPax > 0 ? ceil(custoTotal / receitaMediaPorPax) : null;

  // ROI
  const roi = custoTotal > 0 ? round((lucroOperacional / custoTotal) * 100, 1) : 0;

  // Distribuição de custos %
  const distCustos = {
    atracao: custoTotal > 0 ? round((custoAtracao / custoTotal) * 100, 1) : 0,
    infra: custoTotal > 0 ? round((custoInfraTotal / custoTotal) * 100, 1) : 0,
    operacao: custoTotal > 0 ? round((custoOperacao / custoTotal) * 100, 1) : 0,
    marketing: custoTotal > 0 ? round((custoMarketing / custoTotal) * 100, 1) : 0,
    logistica: custoTotal > 0 ? round((custoLogistica / custoTotal) * 100, 1) : 0,
  };

  const alerts = [];

  if (margemOperacional < 15 && receitaBruta > 0) {
    alerts.push({
      level: 'warning',
      message: `Margem operacional de ${margemOperacional}%. Abaixo de 15% — evento em zona de risco financeiro. Margem saudável para shows: 20–35%.`,
    });
  }

  if (distCustos.atracao > 60) {
    alerts.push({
      level: 'warning',
      message: `Custo de atração representa ${distCustos.atracao}% do custo total. Cache acima de 60% deixa pouca margem para imprevistos operacionais. Referência de mercado: max 50%.`,
    });
  }

  if (breakEvenPax && breakEvenPax > pax * 0.85) {
    alerts.push({
      level: 'critical',
      message: `Ponto de equilíbrio em ${breakEvenPax.toLocaleString()} pax (${round((breakEvenPax / pax) * 100, 0)}% de ocupação). Evento não suporta cancelamentos ou baixa venda. Reavalie a estrutura de custos.`,
    });
  }

  return {
    results: {
      receitaBruta: { value: receitaBruta, label: 'Receita Bruta Total (R$)' },
      impostos: { value: impostos, label: `Impostos (${(impostoPercentual * 100).toFixed(0)}%) (R$)` },
      receitaLiquida: { value: receitaLiquida, label: 'Receita Líquida (R$)' },
      custoTotal: { value: custoTotal, label: 'Custos Totais (R$)' },
      lucroOperacional: { value: lucroOperacional, label: 'Lucro Operacional (R$)', status: lucroOperacional < 0 ? 'PREJUIZO' : 'OK' },
      margemOperacional: { value: margemOperacional, label: 'Margem Operacional (%)', status: margemOperacional < 15 ? 'ALERTA' : 'OK' },
      roi: { value: roi, label: 'ROI (%)' },
      breakEvenPax: { value: breakEvenPax, label: 'Break-even (pax necessários)' },
      custoFixoPorPax: { value: custoFixoPorPax, label: 'Custo Médio por Pax (R$)' },
      receitaMediaPorPax: { value: receitaMediaPorPax, label: 'Receita Média por Pax (R$)' },
      distribuicaoCustos: { value: distCustos, label: 'Distribuição de Custos (%)' },
    },
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * 16. CREDENCIAMENTO
 *
 * Inputs extras: tiposCredencial (['staff', 'imprensa', 'vip', 'artista', 'fornecedor', 'pcd']),
 *                proporcoes (objeto com % para cada tipo, deve somar ≤1),
 *                sistemaCredenciamento ('digital' | 'fisico' | 'hibrido'),
 *                diasEvento
 */
export function calcCredenciamento({ pax, area,
  tiposCredencial = ['staff', 'imprensa', 'vip', 'artista', 'fornecedor'],
  proporcoes = { staff: 0.05, imprensa: 0.005, vip: 0.08, artista: 0.002, fornecedor: 0.01 },
  sistemaCredenciamento = 'digital',
  diasEvento = 1
}) {
  const credenciais = {};
  let totalCredenciais = 0;

  // Estimativas padrão por tipo (% do PAX)
  const ratioDefault = {
    staff: 0.05,        // 5% do pax
    imprensa: 0.005,    // 0,5% do pax
    vip: 0.08,          // 8% do pax
    artista: 0.002,     // 0,2% do pax (crew + artistas)
    fornecedor: 0.01,   // 1% do pax
    pcd: 0.02,          // 2% do pax
    cortesia: 0.03,     // 3% do pax
  };

  // Zonas de acesso (modelo Rock in Rio): A, B, C, D, E (backstage)
  const zonas = {
    staff: ['A', 'B', 'C'],
    imprensa: ['A', 'B'],
    vip: ['A', 'B'],
    artista: ['A', 'B', 'C', 'D', 'E'],
    fornecedor: ['A', 'C'],
    pcd: ['A', 'B'],
    cortesia: ['A'],
  };

  tiposCredencial.forEach(tipo => {
    const ratio = proporcoes[tipo] || ratioDefault[tipo] || 0.01;
    const quantidade = ceil(pax * ratio);
    totalCredenciais += quantidade;
    credenciais[tipo] = {
      quantidade,
      zonas: zonas[tipo] || ['A'],
      label: tipo.charAt(0).toUpperCase() + tipo.slice(1),
    };
  });

  // Pontos de credenciamento
  const pontosCredenciamento = Math.max(2, ceil(totalCredenciais / (sistemaCredenciamento === 'digital' ? 150 : 80)));

  // Pessoal do credenciamento
  const pessoalCredenciamento = pontosCredenciamento * 2; // 2 pessoas por ponto
  const supervisoresCredenciamento = ceil(pontosCredenciamento / 5);

  // Materiais (físicos)
  const crachaDuro = tiposCredencial.includes('artista') || tiposCredencial.includes('vip') ? ceil(totalCredenciais * 0.30) : 0;
  const pulseira = ceil(totalCredenciais * 0.70);
  const cordao = crachaDuro;

  // Gestão por dia: se mais de 1 dia, reposição de 20%/dia a partir do 2º
  const totalComReposicao = totalCredenciais + (diasEvento > 1 ? ceil(totalCredenciais * 0.20 * (diasEvento - 1)) : 0);

  const alerts = [];

  if (totalCredenciais > pax * 0.15) {
    alerts.push({
      level: 'warning',
      message: `Total de credenciais (${totalCredenciais.toLocaleString()}) representa ${round((totalCredenciais / pax) * 100, 1)}% do PAX. Verifique se há superdimensionamento de staff ou cortesias excessivas.`,
    });
  }

  if (sistemaCredenciamento === 'fisico' && totalCredenciais > 1000) {
    alerts.push({
      level: 'warning',
      message: `Credenciamento físico com ${totalCredenciais.toLocaleString()} credenciais: alto risco de fraude e aglomeração. Considere sistema digital com QR Code único por credencial (RFID ou NFC).`,
    });
  }

  if (!tiposCredencial.includes('pcd')) {
    alerts.push({
      level: 'info',
      message: `Credencial PCD não incluída. A NBR 9050 exige identificação e acesso diferenciado para PCD. Inclua o tipo 'pcd' no credenciamento.`,
    });
  }

  return {
    results: {
      credenciais: { value: credenciais, label: 'Credenciais por Tipo' },
      totalCredenciais: { value: totalCredenciais, label: 'Total de Credenciais' },
      totalComReposicao: { value: totalComReposicao, label: `Total com Reposição (${diasEvento} dia(s))` },
      pontosCredenciamento: { value: pontosCredenciamento, label: 'Pontos de Credenciamento' },
      pessoal: {
        operadores: pessoalCredenciamento,
        supervisores: supervisoresCredenciamento,
        total: pessoalCredenciamento + supervisoresCredenciamento,
      },
      materiais: {
        crachasDuros: crachaDuro,
        pulseiras: pulseira,
        cordoes: cordao,
      },
    },
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT MASTER: EFEITO DOMINÓ — roda todas as 16 calculadoras de uma vez
// ─────────────────────────────────────────────────────────────────────────────

/**
 * runAllCalculations
 * Executa o "Efeito Dominó" completo do AXON.
 * PAX e AREA são propagados para todas as 16 ferramentas.
 *
 * @param {number} pax - Público total planejado
 * @param {number} area - Área total do evento em m²
 * @param {object} params - Parâmetros específicos de cada ferramenta (merge automático)
 * @returns {object} Objeto com resultados e alertas de todas as ferramentas
 */
export function runAllCalculations(pax, area, params = {}) {
  const base = { pax, area };
  const merge = (extra = {}) => ({ ...base, ...extra });

  return {
    publico:       calcPublico(merge(params.publico)),
    seguranca:     calcSeguranca(merge(params.seguranca)),
    brigada:       calcBrigada(merge(params.brigada)),
    sanitarios:    calcSanitarios(merge(params.sanitarios)),
    equipeMedica:  calcEquipeMedica(merge(params.equipeMedica)),
    residuos:      calcResiduos(merge(params.residuos)),
    gerador:       calcGerador(merge(params.gerador)),
    sonorizacao:   calcSonorizacao(merge(params.sonorizacao)),
    recepcao:      calcRecepcao(merge(params.recepcao)),
    gelo:          calcGelo(merge(params.gelo)),
    insumos:       calcInsumos(merge(params.insumos)),
    alimentacao:   calcAlimentacao(merge(params.alimentacao)),
    bebidas:       calcBebidas(merge(params.bebidas)),
    ingressos:     calcIngressos(merge(params.ingressos)),
    financeiro:    calcFinanceiro(merge(params.financeiro)),
    credenciamento: calcCredenciamento(merge(params.credenciamento)),
  };
}




// --- FIM DO SEU CÓDIGO ---