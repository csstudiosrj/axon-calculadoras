/**
 * AXON — Motor de Cálculo v2.0
 * calculations.ts
 *
 * "Efeito Dominó": PAX e AREA são globais e alimentam todas as 16 ferramentas.
 *
 * Arquitetura:
 *   - NormsConfig: interface com todos os valores numéricos configuráveis por módulo
 *   - DEFAULT_NORMS: objeto com os valores atuais (será migrado para Supabase futuramente)
 *   - Cada ferramenta é uma função pura: (params, normsConfig?) => { results, alerts }
 *   - `results` contém os valores calculados com labels e referências normativas
 *   - `alerts` contém os Cross-Checks do AXON PRO (array de AlertItem)
 *
 * Normas base:
 *   ABNT NBR 9077, IT-17 CBPMESP, NT 5-04 CBMERJ,
 *   Portaria DPF 18.045/2023, Portaria MS 2.048/2002,
 *   NBR 13969, NR-24, NBR 9050, NBR 16366, NBR 5410,
 *   CFM Res. 2.228/2018, Lei 14.697/2024
 */

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS PRIMITIVOS COMPARTILHADOS
// ─────────────────────────────────────────────────────────────────────────────

export type AlertLevel = 'critical' | 'warning' | 'info';
export type Estado = 'SP' | 'RJ' | 'federal';
export type TipoArea = 'em_pe' | 'arquibancada' | 'pista_danca' | 'sentado' | 'camarote';
export type PerfilRisco = 'baixo' | 'medio' | 'alto';
export type EpocaAno = 'verao' | 'inverno' | 'outro';
export type IndoorOutdoor = 'indoor' | 'outdoor';
export type PerfilPublico = 'jovem' | 'geral' | 'idoso';
export type TipoEvento =
  | 'show'
  | 'show_bebida'
  | 'show_pop'
  | 'rock_edm'
  | 'festival'
  | 'congresso'
  | 'corporativo'
  | 'esporte'
  | 'palestra';
export type TipoIngressoEvento = 'pago' | 'fechado' | 'gratuito_aberto';
export type SistemaEntrada = 'qrcode' | 'rfid' | 'papel';
export type SistemaCredenciamento = 'digital' | 'fisico' | 'hibrido';
export type TipoColeta = 'municipal' | 'terceirizada' | 'proprio';
export type PlataformaVenda = 'online' | 'fisico' | 'misto';
export type TipoConsumo = 'cerveja' | 'destilado' | 'agua' | 'misto';

export interface AlertItem {
  level: AlertLevel;
  message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// NORMS CONFIG — TODOS OS VALORES NUMÉRICOS HARDCODED POR MÓDULO
// ─────────────────────────────────────────────────────────────────────────────

export interface DensityStateConfig {
  em_pe: number;
  arquibancada: number;
  pista_danca: number;
  sentado: number;
  camarote: number;
}

export interface NormsConfig {
  /** Fatores de densidade por estado e tipo de área (pax/m²) */
  density: {
    SP: DensityStateConfig;
    RJ: DensityStateConfig;
    federal: DensityStateConfig;
  };

  /** 1. Público — Capacidade Máxima */
  publico: {
    alertaOcupacaoCritica: number;   // 90 — limiar de alerta de ocupação crítica (%)
    alertaOcupacaoAlerta: number;    // 75 — limiar de alerta de ocupação (%)
    areaGrandePorteSP: number;       // 5000 — m² a partir do qual aviso IT-12/2019 SP é emitido
  };

  /** 2. Segurança Privada */
  seguranca: {
    ratioBasePago: number;           // 150 — 1 vigilante / N pax (evento pago) — DPF 18.045/2023
    ratioBaseNaoPago: number;        // 300 — 1 vigilante / N pax (evento não-pago)
    fatorRiscoAlto: number;          // 0.70 — reduz o ratio efetivo em 30%
    fatorRiscoBaixo: number;         // 1.30 — aumenta o ratio efetivo em 30%
    propControladores: number;       // 0.30 — 30% do efetivo no controle de acesso
    propRonda: number;               // 0.40 — 40% do efetivo em ronda
    propPontoFixo: number;           // 0.20 — 20% do efetivo em pontos fixos
    propReserva: number;             // 0.10 — 10% do efetivo como reserva tática (QRF)
    vigilantesPorSupervisor: number; // 20 — 1 coordenador a cada N vigilantes
    alertaPaxGrandePorte: number;    // 5000 — limiar de alerta para reavaliação de risco
    paxExigePlanoPolicia: number;    // 10000 — eventos pagos acima desse PAX exigem plano policial
  };

  /** 3. Brigada de Incêndio */
  brigada: {
    ratioSPGrandePorte: number;      // 200 — 1 brigadista / N pax para SP > paxLimiteSPGrandePorte
    paxLimiteSPGrandePorte: number;  // 10000
    ratioRiscoAlto: number;          // 250 — 1 brigadista / N pax em risco alto
    ratioPaxPadrao: number;          // 500 — 1 brigadista / N pax (padrão federal)
    ratioAreaPadrao: number;         // 2500 — 1 brigadista / N m² (padrão federal)
    brigadistasRJBase: number;       // 2 — mínimo absoluto RJ estruturas temporárias
    ratioRJArea: number;             // 2500 — 1 brigadista extra / N m² (RJ estruturas temporárias)
    ratioExtintores: number;         // 100 — 1 extintor / N m² ATC
    ratioHidrantes: number;          // 2500 — 1 hidrante / N m²
    brigadistasPorSupervisor: number; // 10 — 1 supervisor / N brigadistas
    minExtintores: number;           // 4 — mínimo absoluto de extintores
    alertaPaxRiscoGrandePorte: number; // 10000 — limiar de warning para risco básico
  };

  /** 4. Sanitários */
  sanitarios: {
    ratioCabineMHorasLongas: number;   // 100 — 1 cabine masculina / N homens (evento > 6h)
    ratioCabineMHorasCurtas: number;   // 200 — 1 cabine masculina / N homens (evento ≤ 6h)
    ratioCabineFHorasLongas: number;   // 50  — 1 cabine feminina / N mulheres (evento > 6h)
    ratioCabineFHorasCurtas: number;   // 100 — 1 cabine feminina / N mulheres (evento ≤ 6h)
    limiteHorasLonga: number;          // 6 — horas a partir das quais se aplica o ratio mais restritivo
    fatorOpenBar: number;              // 1.40 — multiplica demanda de cabines com open bar
    ratioCabinePCD: number;            // 500 — 1 cabine PCD / N pax
    minCabinesPCD: number;             // 2 — mínimo absoluto de cabines PCD (1 por gênero)
    ratioMictorios: number;            // 50 — 1 mictório / N homens
    ratioCabinesPorLavatorio: number;  // 3 — 1 lavatório / N cabines
    propPicoSimultaneo: number;        // 0.20 — 20% do público usando sanitários simultaneamente no pico
    minUsoPorPessoa_min: number;       // 3 — tempo médio de uso por pessoa (minutos)
    alertaFilaMax_min: number;         // 10 — tempo máximo aceitável de fila (minutos)
    alertaCabinesOpenBar: number;      // 30 — referência prática: 1 cabine / N pax com open bar
  };

  /** 5. Equipe Médica */
  equipeMedica: {
    limite1: number;                   // 5000 — PAX até o qual aplica config1
    limite2: number;                   // 10000 — PAX até o qual aplica config2
    config1: {                         // até 5.000 pax
      medicos: number;
      enfermeiros: number;
      ambulanciasB: number;
      ambulanciasD: number;
    };
    config2: {                         // até 10.000 pax
      medicos: number;
      enfermeiros: number;
      ambulanciasB: number;
      ambulanciasD: number;
    };
    escalonamentoMedico: number;       // 5000 — 1 médico extra a cada N pax acima de 10k
    escalonamentoEnfermeiro: number;   // 2500 — 1 enfermeiro extra a cada N pax acima de 10k
    escalonamentoAmbulanciaB: number;  // 10000 — 1 ambulância B extra a cada N pax
    escalonamentoAmbulanciaD: number;  // 10000 — 1 ambulância D extra a cada N pax acima de 10k
    ratioSocorristas: number;          // 1000 — 1 socorrista / N pax
    fatorPerfilJovem: number;          // 1.20
    fatorPerfilIdoso: number;          // 1.50
    fatorClima: number;                // 1.30 — verão outdoor
    ratioPostosMedicos: number;        // 5000 — 1 posto médico / N pax
    ratioDEA: number;                  // 2000 — 1 DEA / N pax
    alertaPaxVeraoOutdoor: number;     // 5000
  };

  /** 6. Resíduos Sólidos */
  residuos: {
    kgPorPax: {
      show_bebida: number;   // 2.0
      festival: number;      // 2.5
      congresso: number;     // 0.75
      corporativo: number;   // 0.5
    };
    propOrganico: number;            // 0.45
    propReciclavel: number;          // 0.35
    propRejeito: number;             // 0.20
    intervaloColeta_h: number;       // 4
    ratioColetores: number;          // 50 — 1 coletor / N m²
    capacidadeCaminhao_kg: number;   // 8000
    ratioGaris: number;              // 500 — 1 gari / N m²
    minGaris: number;                // 2
    custoDestinacao: {
      municipal: number;    // 0
      terceirizada: number; // 350 — R$/tonelada
      proprio: number;      // 280
    };
    alertaLimite_kg: number;         // 5000
    alertaMinColetores: number;      // 10 — avisa se < N coletores com pax > 5000
    alertaPaxMinColetores: number;   // 5000
  };

  /** 7. Gerador de Energia */
  gerador: {
    wattsPorPax: {
      rock_edm: number;    // 150
      show_pop: number;    // 80
      palestra: number;    // 8
      corporativo: number; // 15
      festival: number;    // 120
    };
    propIluminacaoCenica: number;  // 0.30 — % da carga de som
    kWLedPorPalco: number;         // 20
    wattsOperacionalM2: number;    // 15 — W/m² para A&B, sanitários, tendas
    wattsNoturnoM2: number;        // 5 — W/m² para iluminação de área
    fatorMargem: number;           // 1.30 — NBR 5410
    fatorPotencia: number;         // 0.85 — fp médio para conversão W→VA
    consumoDiesel_L_kVA_h: number; // 0.25
    modelos: Array<{ modelo: string; kva: number }>;
    alertaKVA: number;             // 5000 — acima desse valor sugere fornecimento direto
    horasReferenciaAlerta: number; // 8 — horas para cálculo de reserva de diesel no alerta
    propReservaDiesel: number;     // 1.20 — +20% de reserva de segurança
  };

  /** 8. Sonorização */
  sonorizacao: {
    wattsPorPax: {
      rock_edm: number;    // 150
      show_pop: number;    // 80
      palestra: number;    // 8
      corporativo: number; // 15
      festival: number;    // 120
    };
    propSubwoofers: number;          // 0.30 — % da potência do PA
    kWPorElementoStack: number;      // 15 — kW por elemento típico de line array
    monitoresPorPalco: number;       // 8
    ratioDelayTowers: number;        // 2500 — 1 delay tower / N m² outdoor
    propAssistentesAudio: number;    // 1.5 — assistentes por palco
    rfPorPalcos: number;             // 2 — 1 técnico RF a cada N palcos
    alertaSPLIndoor_dB: number;      // 105
    alertaSPLRockMin_dB: number;     // 95 — SPL mínimo na última fila para rock/EDM
    nivelSPLAlvoPadrao: number;      // 103
  };

  /** 9. Recepção / Controle de Acesso */
  recepcao: {
    vazao: {
      qrcode: number; // 25 — pax/min por ponto
      rfid: number;   // 40
      papel: number;  // 15
    };
    propPicoChegada: number;          // 0.40 — 40% do público nas primeiras horas
    ratioStaffInfo: number;           // 2000 — 1 posto de informações / N pax
    ratioCredenciadores: number;      // 200 — 1 credenciador / N pax VIP/camarote
    propCredenciadoresCapacidade: number; // 0.15 — 15% do pax vai para setores VIP/camarote
    supervisoresPorPontos: number;    // 8 — 1 supervisor / N pontos de acesso
    alertaFilaMax_min: number;        // 30
    propFilaEmEspera: number;         // 0.10 — 10% do pico fica em fila no instante de pico
    espacoFilaPorPax_m: number;       // 1.50 — metros por pax na fila
    tempoAberturaMinima_h: number;    // 2 — mínimo recomendado de abertura de portões
    paxMinimoAvisoAberturaPortas: number; // 5000
    paxMinimoPapelAviso: number;      // 3000
  };

  /** 10. Gelo */
  gelo: {
    kgBasePorPax: number;            // 1.5
    fatorEpoca: {
      verao: number;   // 1.50
      inverno: number; // 0.80
      outro: number;   // 1.10
    };
    fatorConsumo: {
      destilado: number; // 1.50
      misto: number;     // 1.20
      outros: number;    // 1.00
    };
    fatorOpenBar: number;            // 1.30
    propGeloBebidas: number;         // 0.60
    propGeloAeB: number;             // 0.30
    propGeloMedico: number;          // 0.10
    pesoCaixaGelo_kg: number;        // 20
    ratioPontosDistribuicao: number; // 100 — 1 ponto / N pax
    fatorDerretimento: {
      verao: number;  // 0.15 — 15%/hora
      outros: number; // 0.08 — 8%/hora
    };
    alertaPaxVerao: number;          // 3000
  };

  /** 11. Insumos Gerais */
  insumos: {
    aguaL_pax_h: number;          // 0.5
    fatorCalorAgua: number;       // 1.30
    propGaloesAgua: number;       // 0.30 — 30% em galões
    propGarrafinhas: number;      // 0.70 — 70% em garrafinhas
    volGalao_L: number;           // 20
    volGarrafinha_L: number;      // 0.5
    copasPorPaxPorHora: number;   // 3
    fatorOpenBarCopas: number;    // 1.50
    embalagensPorPax: number;     // 1.5
    guardanaposPorPax: number;    // 4 — com alimentação
    guardanaposSemAlim: number;   // 1 — sem alimentação
    canudosOpenBar: number;       // 3
    canudosPadrao: number;        // 1
    ratioSacosLixo_m2: number;    // 50 — m² por saco
    intervaloSacosLixo_h: number; // 4
    ratioKitHigiene: number;      // 500 — 1 kit / N pax
    alertaAguaLitros: number;     // 50000
    alertaDuracaoAgua_h: number;  // 6
  };

  /** 12. Alimentação */
  alimentacao: {
    propStaffDoPax: number;              // 0.05 — estimativa de staff quando não informado
    gramas_por_refeicao: number;         // 900
    fatorExcedente: number;              // 1.20 — +20% de excedente NR-24
    porcaoPublico_g: number;             // 400
    ratioFoodTrucks: number;             // 300 — 1 food truck / N pax (público que come)
    m2CozinhaPor50Refeicoes: number;     // 2
    alertaRefeicoesCozinha: number;      // 500 — acima disso sugere terceirização
    minAreaCozinhaAlerta_m2: number;     // 20
    alertaFoodTrucksVISA: number;        // 20 — acima disso exige VISA
    alertaHorasSemRefeicao: number;      // 12 — evento longo com poucas refeições
    alertaRefeicoesMinimoLongo: number;  // 3 — mínimo de refeições para eventos > alertaHorasSemRefeicao
    intervaloRefeicaoNR24_h: number;     // 5 — NR-24: refeição a cada N horas de trabalho
  };

  /** 13. Bebidas */
  bebidas: {
    aguaL_pax_h: number;         // 0.5
    cervejaL_pax_h: number;      // 1.0
    refriL_pax_h: number;        // 0.3
    destiladoDoses_pax_h: number; // 0.5
    volDose_L: number;           // 0.05
    fatorCalor: {
      verao: number;   // 1.00
      inverno: number; // 0.60
      outro: number;   // 0.80
    };
    fatorOpenBar: number;        // 1.50
    ratioBares: number;          // 200 — 1 bar / N pax
    ratioFreezers: number;       // 100 — 1 freezer / N pax
    margemEstoque: number;       // 0.15
    alertaPaxOpenBarVerao: number; // 2000
    cervejaAlertaFator: number;  // 1.5 — consumo pode chegar a N L/pax/h no pico
    alertaAcrescimoVerao: number; // 0.25 — planeje 25% acima no verão
  };

  /** 14. Ingressos */
  ingressos: {
    setoresDefault: Array<{
      nome: string;
      propCapacidade: number;
      precoInteiro: number;
    }>;
    taxaPlataforma: {
      online: number;  // 0.10
      fisico: number;  // 0.03
      misto: number;   // 0.07
    };
    lotes: Array<{
      lote: number;
      desconto: number;
      propQtd: number;
    }>;
    alertaCortezia: number;            // 0.10 — acima de 10% emite warning
    alertaTaxaPlataformaValor: number; // 50000 — acima desse valor sugere negociação
  };

  /** 15. Financeiro */
  financeiro: {
    impostoPercentual: number;         // 0.15 — ISS + IRPJ simplificado
    margemMinimaAlerta: number;        // 0.15 — abaixo disso emite warning
    margemIdealMin: number;            // 0.20
    margemIdealMax: number;            // 0.35
    alertaCacheMaxPercent: number;     // 0.60 — custo de atração máximo % dos custos totais
    alertaBreakevenPercent: number;    // 0.85 — break-even como % do PAX
  };

  /** 16. Credenciamento */
  credenciamento: {
    ratioDefault: {
      staff: number;      // 0.050
      imprensa: number;   // 0.005
      vip: number;        // 0.080
      artista: number;    // 0.002
      fornecedor: number; // 0.010
      pcd: number;        // 0.020
      cortesia: number;   // 0.030
    };
    zonas: Record<string, string[]>;
    vazaoPonto: {
      digital: number; // 150 — credenciais processadas / ponto
      fisico: number;  // 80
    };
    operadoresPorPonto: number;          // 2
    supervisoresPorPontos: number;       // 5 — 1 supervisor / N pontos
    propCrachaDuro: number;              // 0.30
    propPulseira: number;                // 0.70
    alertaTotalCredenciaisPercent: number; // 0.15 — avisa se credenciais > 15% do PAX
    propReposicaoDia: number;            // 0.20 — reposição de 20% por dia adicional
    alertaFisicoMin: number;             // 1000 — acima disso avisa sobre fraude
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT_NORMS — valores atuais (fonte única de verdade, futuro: Supabase)
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_NORMS: NormsConfig = {
  density: {
    SP:      { em_pe: 2.5, arquibancada: 4,   pista_danca: 1, sentado: 1.4, camarote: 2.5 },
    RJ:      { em_pe: 3.0, arquibancada: 3,   pista_danca: 1, sentado: 1.4, camarote: 2.5 },
    federal: { em_pe: 2.5, arquibancada: 2.5, pista_danca: 1, sentado: 1.4, camarote: 2.5 },
  },

  publico: {
    alertaOcupacaoCritica: 90,
    alertaOcupacaoAlerta: 75,
    areaGrandePorteSP: 5000,
  },

  seguranca: {
    ratioBasePago: 150,
    ratioBaseNaoPago: 300,
    fatorRiscoAlto: 0.70,
    fatorRiscoBaixo: 1.30,
    propControladores: 0.30,
    propRonda: 0.40,
    propPontoFixo: 0.20,
    propReserva: 0.10,
    vigilantesPorSupervisor: 20,
    alertaPaxGrandePorte: 5000,
    paxExigePlanoPolicia: 10000,
  },

  brigada: {
    ratioSPGrandePorte: 200,
    paxLimiteSPGrandePorte: 10000,
    ratioRiscoAlto: 250,
    ratioPaxPadrao: 500,
    ratioAreaPadrao: 2500,
    brigadistasRJBase: 2,
    ratioRJArea: 2500,
    ratioExtintores: 100,
    ratioHidrantes: 2500,
    brigadistasPorSupervisor: 10,
    minExtintores: 4,
    alertaPaxRiscoGrandePorte: 10000,
  },

  sanitarios: {
    ratioCabineMHorasLongas: 100,
    ratioCabineMHorasCurtas: 200,
    ratioCabineFHorasLongas: 50,
    ratioCabineFHorasCurtas: 100,
    limiteHorasLonga: 6,
    fatorOpenBar: 1.40,
    ratioCabinePCD: 500,
    minCabinesPCD: 2,
    ratioMictorios: 50,
    ratioCabinesPorLavatorio: 3,
    propPicoSimultaneo: 0.20,
    minUsoPorPessoa_min: 3,
    alertaFilaMax_min: 10,
    alertaCabinesOpenBar: 30,
  },

  equipeMedica: {
    limite1: 5000,
    limite2: 10000,
    config1: { medicos: 1, enfermeiros: 2, ambulanciasB: 1, ambulanciasD: 0 },
    config2: { medicos: 2, enfermeiros: 4, ambulanciasB: 1, ambulanciasD: 1 },
    escalonamentoMedico: 5000,
    escalonamentoEnfermeiro: 2500,
    escalonamentoAmbulanciaB: 10000,
    escalonamentoAmbulanciaD: 10000,
    ratioSocorristas: 1000,
    fatorPerfilJovem: 1.20,
    fatorPerfilIdoso: 1.50,
    fatorClima: 1.30,
    ratioPostosMedicos: 5000,
    ratioDEA: 2000,
    alertaPaxVeraoOutdoor: 5000,
  },

  residuos: {
    kgPorPax: { show_bebida: 2.0, festival: 2.5, congresso: 0.75, corporativo: 0.5 },
    propOrganico: 0.45,
    propReciclavel: 0.35,
    propRejeito: 0.20,
    intervaloColeta_h: 4,
    ratioColetores: 50,
    capacidadeCaminhao_kg: 8000,
    ratioGaris: 500,
    minGaris: 2,
    custoDestinacao: { municipal: 0, terceirizada: 350, proprio: 280 },
    alertaLimite_kg: 5000,
    alertaMinColetores: 10,
    alertaPaxMinColetores: 5000,
  },

  gerador: {
    wattsPorPax: { rock_edm: 150, show_pop: 80, palestra: 8, corporativo: 15, festival: 120 },
    propIluminacaoCenica: 0.30,
    kWLedPorPalco: 20,
    wattsOperacionalM2: 15,
    wattsNoturnoM2: 5,
    fatorMargem: 1.30,
    fatorPotencia: 0.85,
    consumoDiesel_L_kVA_h: 0.25,
    modelos: [
      { modelo: '1.000 kVA', kva: 1000 },
      { modelo: '500 kVA',   kva: 500  },
      { modelo: '250 kVA',   kva: 250  },
      { modelo: '150 kVA',   kva: 150  },
    ],
    alertaKVA: 5000,
    horasReferenciaAlerta: 8,
    propReservaDiesel: 1.20,
  },

  sonorizacao: {
    wattsPorPax: { rock_edm: 150, show_pop: 80, palestra: 8, corporativo: 15, festival: 120 },
    propSubwoofers: 0.30,
    kWPorElementoStack: 15,
    monitoresPorPalco: 8,
    ratioDelayTowers: 2500,
    propAssistentesAudio: 1.5,
    rfPorPalcos: 2,
    alertaSPLIndoor_dB: 105,
    alertaSPLRockMin_dB: 95,
    nivelSPLAlvoPadrao: 103,
  },

  recepcao: {
    vazao: { qrcode: 25, rfid: 40, papel: 15 },
    propPicoChegada: 0.40,
    ratioStaffInfo: 2000,
    ratioCredenciadores: 200,
    propCredenciadoresCapacidade: 0.15,
    supervisoresPorPontos: 8,
    alertaFilaMax_min: 30,
    propFilaEmEspera: 0.10,
    espacoFilaPorPax_m: 1.50,
    tempoAberturaMinima_h: 2,
    paxMinimoAvisoAberturaPortas: 5000,
    paxMinimoPapelAviso: 3000,
  },

  gelo: {
    kgBasePorPax: 1.5,
    fatorEpoca: { verao: 1.50, inverno: 0.80, outro: 1.10 },
    fatorConsumo: { destilado: 1.50, misto: 1.20, outros: 1.00 },
    fatorOpenBar: 1.30,
    propGeloBebidas: 0.60,
    propGeloAeB: 0.30,
    propGeloMedico: 0.10,
    pesoCaixaGelo_kg: 20,
    ratioPontosDistribuicao: 100,
    fatorDerretimento: { verao: 0.15, outros: 0.08 },
    alertaPaxVerao: 3000,
  },

  insumos: {
    aguaL_pax_h: 0.5,
    fatorCalorAgua: 1.30,
    propGaloesAgua: 0.30,
    propGarrafinhas: 0.70,
    volGalao_L: 20,
    volGarrafinha_L: 0.5,
    copasPorPaxPorHora: 3,
    fatorOpenBarCopas: 1.50,
    embalagensPorPax: 1.5,
    guardanaposPorPax: 4,
    guardanaposSemAlim: 1,
    canudosOpenBar: 3,
    canudosPadrao: 1,
    ratioSacosLixo_m2: 50,
    intervaloSacosLixo_h: 4,
    ratioKitHigiene: 500,
    alertaAguaLitros: 50000,
    alertaDuracaoAgua_h: 6,
  },

  alimentacao: {
    propStaffDoPax: 0.05,
    gramas_por_refeicao: 900,
    fatorExcedente: 1.20,
    porcaoPublico_g: 400,
    ratioFoodTrucks: 300,
    m2CozinhaPor50Refeicoes: 2,
    alertaRefeicoesCozinha: 500,
    minAreaCozinhaAlerta_m2: 20,
    alertaFoodTrucksVISA: 20,
    alertaHorasSemRefeicao: 12,
    alertaRefeicoesMinimoLongo: 3,
    intervaloRefeicaoNR24_h: 5,
  },

  bebidas: {
    aguaL_pax_h: 0.5,
    cervejaL_pax_h: 1.0,
    refriL_pax_h: 0.3,
    destiladoDoses_pax_h: 0.5,
    volDose_L: 0.05,
    fatorCalor: { verao: 1.00, inverno: 0.60, outro: 0.80 },
    fatorOpenBar: 1.50,
    ratioBares: 200,
    ratioFreezers: 100,
    margemEstoque: 0.15,
    alertaPaxOpenBarVerao: 2000,
    cervejaAlertaFator: 1.5,
    alertaAcrescimoVerao: 0.25,
  },

  ingressos: {
    setoresDefault: [
      { nome: 'Pista',    propCapacidade: 0.70, precoInteiro: 120 },
      { nome: 'Camarote', propCapacidade: 0.20, precoInteiro: 350 },
      { nome: 'VIP',      propCapacidade: 0.08, precoInteiro: 600 },
      { nome: 'PCD',      propCapacidade: 0.02, precoInteiro: 0   },
    ],
    taxaPlataforma: { online: 0.10, fisico: 0.03, misto: 0.07 },
    lotes: [
      { lote: 1, desconto: 0.40, propQtd: 0.15 },
      { lote: 2, desconto: 0.30, propQtd: 0.20 },
      { lote: 3, desconto: 0.15, propQtd: 0.25 },
      { lote: 4, desconto: 0.05, propQtd: 0.25 },
      { lote: 5, desconto: 0.00, propQtd: 0.15 },
    ],
    alertaCortezia: 0.10,
    alertaTaxaPlataformaValor: 50000,
  },

  financeiro: {
    impostoPercentual: 0.15,
    margemMinimaAlerta: 0.15,
    margemIdealMin: 0.20,
    margemIdealMax: 0.35,
    alertaCacheMaxPercent: 0.60,
    alertaBreakevenPercent: 0.85,
  },

  credenciamento: {
    ratioDefault: {
      staff: 0.050, imprensa: 0.005, vip: 0.080,
      artista: 0.002, fornecedor: 0.010, pcd: 0.020, cortesia: 0.030,
    },
    zonas: {
      staff:      ['A', 'B', 'C'],
      imprensa:   ['A', 'B'],
      vip:        ['A', 'B'],
      artista:    ['A', 'B', 'C', 'D', 'E'],
      fornecedor: ['A', 'C'],
      pcd:        ['A', 'B'],
      cortesia:   ['A'],
    },
    vazaoPonto: { digital: 150, fisico: 80 },
    operadoresPorPonto: 2,
    supervisoresPorPontos: 5,
    propCrachaDuro: 0.30,
    propPulseira: 0.70,
    alertaTotalCredenciaisPercent: 0.15,
    propReposicaoDia: 0.20,
    alertaFisicoMin: 1000,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS INTERNOS
// ─────────────────────────────────────────────────────────────────────────────

const ceil  = Math.ceil;
const floor = Math.floor;
const round = (v: number, d = 0): number => Math.round(v * 10 ** d) / 10 ** d;

/** Mescla normas fornecidas com DEFAULT_NORMS (deep merge por módulo) */
function mergeNorms(normsConfig?: Partial<NormsConfig>): NormsConfig {
  if (!normsConfig) return DEFAULT_NORMS;
  const merged = { ...DEFAULT_NORMS } as NormsConfig;
  for (const key of Object.keys(normsConfig) as Array<keyof NormsConfig>) {
    if (normsConfig[key] !== undefined) {
      (merged as Record<string, unknown>)[key] = {
        ...(DEFAULT_NORMS[key] as object),
        ...(normsConfig[key] as object),
      };
    }
  }
  return merged;
}

/** Retorna o fator de densidade (pax/m²) conforme estado e tipo de área */
function densityFactor(
  estado: Estado,
  tipoArea: TipoArea,
  norms: NormsConfig,
): number {
  const stateMap = norms.density[estado] ?? norms.density.federal;
  return stateMap[tipoArea] ?? stateMap.em_pe;
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACES DE PARÂMETROS DE ENTRADA
// ─────────────────────────────────────────────────────────────────────────────

export interface BaseParams {
  pax: number;
  area: number;
}

export interface PublicoParams extends BaseParams {
  estado?: Estado;
  tipoArea?: TipoArea;
  areaUtil?: number;
}

export interface SegurancaParams extends BaseParams {
  tipoEvento?: TipoIngressoEvento;
  estado?: Estado;
  perfilRisco?: PerfilRisco;
}

export interface BrigadaParams extends BaseParams {
  estado?: Estado;
  riscoIncendio?: 'basico' | 'alto';
  estruturasTemporarias?: boolean;
}

export interface SanitariosParams extends BaseParams {
  duracaoHoras?: number;
  proporcaoHomens?: number;
  openBar?: boolean;
  estado?: Estado;
  pcdPercentual?: number;
}

export interface EquipeMedicaParams extends BaseParams {
  estado?: Estado;
  tipoEvento?: 'show' | 'esporte' | 'congresso';
  perfilPublico?: PerfilPublico;
  duracaoHoras?: number;
  indoorOutdoor?: IndoorOutdoor;
  epocaAno?: EpocaAno;
}

export interface ResiduosParams extends BaseParams {
  tipoEvento?: 'show_bebida' | 'festival' | 'congresso' | 'corporativo';
  duracaoHoras?: number;
  coleta?: TipoColeta;
}

export interface GeradorParams extends BaseParams {
  tipoEvento?: 'rock_edm' | 'show_pop' | 'palestra' | 'corporativo' | 'festival';
  quantidadePalcos?: number;
  iluminacaoCenica?: boolean;
  telaoLed?: boolean;
  operacaoNoturna?: boolean;
}

export interface SonorizacaoParams extends BaseParams {
  tipoEvento?: 'rock_edm' | 'show_pop' | 'palestra' | 'corporativo' | 'festival';
  quantidadePalcos?: number;
  indoorOutdoor?: IndoorOutdoor;
  nivelSPL_alvo?: number;
}

export interface RecepcaoParams extends BaseParams {
  tiposIngresso?: string[];
  tempoAberturaPortas_h?: number;
  sistemaEntrada?: SistemaEntrada;
  paxPorHora?: number;
}

export interface GeloParams extends BaseParams {
  epocaAno?: EpocaAno;
  tipoConsumoPrincipal?: TipoConsumo;
  openBar?: boolean;
  duracaoHoras?: number;
}

export interface InsumosParams extends BaseParams {
  duracaoHoras?: number;
  openBar?: boolean;
  incluiAlimentacao?: boolean;
  epocaAno?: EpocaAno;
}

export interface AlimentacaoParams extends BaseParams {
  staffTotal?: number;
  duracaoHoras?: number;
  refeicoesPrevistas?: number;
  incluiPublico?: boolean;
  percentualPublicoQueAlimenta?: number;
}

export interface BebidasParams extends BaseParams {
  epocaAno?: EpocaAno;
  openBar?: boolean;
  duracaoHoras?: number;
  tiposDeBebida?: Array<'agua' | 'cerveja' | 'refrigerante' | 'destilado'>;
  proporcaoAlcool?: number;
}

export interface SetorIngresso {
  nome: string;
  capacidade: number;
  precoInteiro: number;
}

export interface IngressosParams extends BaseParams {
  setores?: SetorIngresso[];
  percentualMeia?: number;
  percentualCourtesia?: number;
  percentualPCD?: number;
  plataformaVenda?: PlataformaVenda;
}

export interface FinanceiroParams extends BaseParams {
  receitaIngressos?: number;
  receitaPatrocinio?: number;
  receitaAeB?: number;
  receitaOutras?: number;
  custoAtracao?: number;
  custoInfraTotal?: number;
  custoOperacao?: number;
  custoMarketing?: number;
  custoLogistica?: number;
  impostoPercentual?: number;
}

export interface CredenciamentoParams extends BaseParams {
  tiposCredencial?: string[];
  proporcoes?: Record<string, number>;
  sistemaCredenciamento?: SistemaCredenciamento;
  diasEvento?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACES DE RETORNO
// ─────────────────────────────────────────────────────────────────────────────

export interface ResultValue<T = number> {
  value: T;
  label: string;
  norma?: string;
  status?: string;
}

export interface CalcResult<R extends object> {
  results: R;
  alerts: AlertItem[];
}

// — Retornos específicos por ferramenta —

export interface PublicoResults {
  capacidadeMaxima: ResultValue;
  paxInformado: ResultValue;
  ocupacaoPercentual: ResultValue;
  saldoCapacidade: ResultValue;
  fatorDensidade: ResultValue;
}

export interface SegurancaDistribuicao {
  controladores: ResultValue;
  ronda: ResultValue;
  pontoFixo: ResultValue;
  reserva: ResultValue;
}

export interface SegurancaResults {
  vigilantesMinimosLegais: ResultValue;
  vigilantesRecomendados: ResultValue;
  distribuicao: SegurancaDistribuicao;
  coordenadores: ResultValue;
  totalEfetivo: ResultValue;
}

export interface BrigadaResults {
  brigadistas: ResultValue;
  supervisores: ResultValue;
  totalBrigada: ResultValue;
  extintores: ResultValue;
  hidrantes: ResultValue;
}

export interface SanitariosResults {
  cabinesM: ResultValue;
  cabinesF: ResultValue;
  cabinesPCD: ResultValue;
  mictorios: ResultValue;
  lavatorios: ResultValue;
  totalUnitarios: ResultValue;
  tempoFilaEstimadoMin: ResultValue;
}

export interface EquipeMedicaResults {
  medicos: ResultValue;
  enfermeiros: ResultValue;
  socorristas: ResultValue;
  ambulanciasBasica: ResultValue;
  ambulanciasAvancada: ResultValue;
  postosMedicos: ResultValue;
  deaUnidades: ResultValue;
  totalEquipe: ResultValue;
}

export interface ResiduosResults {
  totalResiduo_kg: ResultValue;
  totalResiduo_ton: ResultValue;
  organico_kg: ResultValue;
  reciclavel_kg: ResultValue;
  rejeito_kg: ResultValue;
  coletores: ResultValue;
  garis: ResultValue;
  caminhoes: ResultValue;
  coletasNecessarias: ResultValue;
  custoEstimadoDestinacao: ResultValue;
}

export interface GeradorResults {
  cargaSom_kW: ResultValue;
  cargaIluminacao_kW: ResultValue;
  cargaLed_kW: ResultValue;
  cargaOperacional_kW: ResultValue;
  cargaTotalEstimada_kW: ResultValue;
  kva_necessarios: ResultValue;
  configuracaoRecomendada: ResultValue<string>;
  consumoDiesel_L_h: ResultValue;
}

export interface EquipeAudio {
  fohEngineers: number;
  monitorEngineers: number;
  rfTecnicos: number;
  assistentes: number;
  total: number;
}

export interface SonorizacaoResults {
  potenciaPA_kW: ResultValue;
  subwoofers_kW: ResultValue;
  stacks: ResultValue;
  elemPorStack: ResultValue;
  delayTowers: ResultValue;
  monitoresPalco: ResultValue;
  equipe: EquipeAudio;
  spl_na_distanciaMax: ResultValue;
}

export interface RecepcaoPessoal {
  operadoresAcesso: number;
  supervisores: number;
  staffInformacoes: number;
  credenciadores: number;
  total: number;
}

export interface RecepcaoResults {
  pontosAcessoNecessarios: ResultValue;
  distribuicaoAcessos: ResultValue<Record<string, number>>;
  picoPaxPorMinuto: ResultValue;
  tempoFilaEstimadoMin: ResultValue;
  comprimentoFilaEstimado_m: ResultValue;
  pessoal: RecepcaoPessoal;
}

export interface GeloDistribuicao {
  bebidas_kg: number;
  aeb_kg: number;
  medico_kg: number;
}

export interface GeloResults {
  kg_por_pax: ResultValue;
  geloTotal_kg: ResultValue;
  geloTotalComReposicao_kg: ResultValue;
  distribuicao: GeloDistribuicao;
  caixasGelo20kg: ResultValue;
  pontosDistribuicao: ResultValue;
}

export interface AguaInfo {
  total_L: number;
  galoes20L: number;
  garrafinhas500ml: number;
  norma: string;
}

export interface InsumosResults {
  agua: AguaInfo;
  coposDescartaveis: ResultValue;
  embalagens: ResultValue;
  guardanapos: ResultValue;
  canudos: ResultValue;
  sacosLixo: ResultValue;
  kitsHigiene: ResultValue;
}

export interface AlimentacaoResults {
  staff_refeicoes: ResultValue;
  staff_alimentacao_kg: ResultValue;
  publico_refeicoes: ResultValue;
  publico_alimentacao_kg: ResultValue;
  foodTrucks: ResultValue;
  areaCozinhaIndustrial_m2: ResultValue;
  totalAlimentacao_kg: ResultValue;
}

export interface BebidaInfo {
  totalLitros: number;
  unidades500ml?: number;
  latinhas350ml?: number;
  totalDoses?: number;
  label: string;
  norma?: string;
}

export interface BebidasResults {
  bebidas: Record<string, BebidaInfo>;
  bares: ResultValue;
  freezers: ResultValue;
  margemEstoque: ResultValue<string>;
}

export interface SetorBreakdown {
  setor: string;
  capacidade: number;
  inteiros: number;
  meias: number;
  cortesias: number;
  pcd: number;
  receita: number;
}

export interface LoteEstrategia {
  lote: number;
  desconto: number;
  qtd: number;
}

export interface IngressosResults {
  totalIngressosDisponiveis: ResultValue;
  breakdown: ResultValue<SetorBreakdown[]>;
  receitaBrutaPotencial: ResultValue;
  taxaPlataforma: ResultValue;
  receitaLiquidaIngresso: ResultValue;
  estrategiaLotes: ResultValue<LoteEstrategia[]>;
}

export interface DistribuicaoCustos {
  atracao: number;
  infra: number;
  operacao: number;
  marketing: number;
  logistica: number;
}

export interface FinanceiroResults {
  receitaBruta: ResultValue;
  impostos: ResultValue;
  receitaLiquida: ResultValue;
  custoTotal: ResultValue;
  lucroOperacional: ResultValue;
  margemOperacional: ResultValue;
  roi: ResultValue;
  breakEvenPax: ResultValue<number | null>;
  custoFixoPorPax: ResultValue;
  receitaMediaPorPax: ResultValue;
  distribuicaoCustos: ResultValue<DistribuicaoCustos>;
}

export interface CredencialInfo {
  quantidade: number;
  zonas: string[];
  label: string;
}

export interface CredenciamentoPessoal {
  operadores: number;
  supervisores: number;
  total: number;
}

export interface CredenciamentoMateriais {
  crachasDuros: number;
  pulseiras: number;
  cordoes: number;
}

export interface CredenciamentoResults {
  credenciais: ResultValue<Record<string, CredencialInfo>>;
  totalCredenciais: ResultValue;
  totalComReposicao: ResultValue;
  pontosCredenciamento: ResultValue;
  pessoal: CredenciamentoPessoal;
  materiais: CredenciamentoMateriais;
}

// ─────────────────────────────────────────────────────────────────────────────
// PILAR 1 — LICENCIAMENTO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1. PÚBLICO — Capacidade Máxima do Espaço
 * Norma: IT-17 CBPMESP / NT 5-04 CBMERJ / Federal
 */
export function calcPublico(
  params: PublicoParams,
  normsConfig?: Partial<NormsConfig>,
): CalcResult<PublicoResults> {
  const { pax, area, estado = 'federal', tipoArea = 'em_pe', areaUtil } = params;
  const norms = mergeNorms(normsConfig);
  const n = norms.publico;

  const areaEfetiva = areaUtil ?? area;
  const fator = densityFactor(estado, tipoArea, norms);
  const capacidadeMaxima = floor(areaEfetiva * fator);
  const ocupacaoPercentual = round((pax / capacidadeMaxima) * 100, 1);
  const saldoCapacidade = capacidadeMaxima - pax;
  const statusOcupacao =
    ocupacaoPercentual >= 100         ? 'LOTAÇÃO_EXCEDIDA' :
    ocupacaoPercentual >= n.alertaOcupacaoCritica ? 'CRITICO'          :
    ocupacaoPercentual >= n.alertaOcupacaoAlerta  ? 'ALERTA'           : 'OK';

  const alerts: AlertItem[] = [];

  if (pax > capacidadeMaxima) {
    alerts.push({
      level: 'critical',
      message: `PAX (${pax.toLocaleString()}) excede a capacidade máxima de ${capacidadeMaxima.toLocaleString()} pax para ${areaEfetiva} m² em ${estado} (${fator} pax/m²). Risco de interdição pelo Corpo de Bombeiros.`,
    });
  } else if (ocupacaoPercentual >= n.alertaOcupacaoCritica) {
    alerts.push({
      level: 'warning',
      message: `Ocupação em ${ocupacaoPercentual}%. Margem operacional crítica. Considere reduzir o PAX vendido ou ampliar a área útil.`,
    });
  }

  if (tipoArea === 'em_pe' && estado === 'SP' && area > n.areaGrandePorteSP) {
    alerts.push({
      level: 'info',
      message: `SP — IT 12/2019: para áreas >${n.areaGrandePorteSP.toLocaleString()} m², verifique se a configuração é arquibancada (${norms.density.SP.arquibancada} pax/m²) ou pista (${norms.density.SP.em_pe} pax/m²). O fator atual aplicado é ${fator} pax/m².`,
    });
  }

  return {
    results: {
      capacidadeMaxima:   { value: capacidadeMaxima, label: 'Capacidade Máxima (pax)', norma: `${fator} pax/m² — ${estado}` },
      paxInformado:       { value: pax, label: 'PAX Planejado' },
      ocupacaoPercentual: { value: ocupacaoPercentual, label: 'Taxa de Ocupação (%)', status: statusOcupacao },
      saldoCapacidade:    { value: saldoCapacidade, label: 'Saldo de Capacidade (pax)' },
      fatorDensidade:     { value: fator, label: 'Fator de Densidade (pax/m²)' },
    },
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * 2. SEGURANÇA PRIVADA
 * Norma: Portaria DPF 18.045/2023 Art. 19 / Lei 14.697/2024
 */
export function calcSeguranca(
  params: SegurancaParams,
  normsConfig?: Partial<NormsConfig>,
): CalcResult<SegurancaResults> {
  const { pax, tipoEvento = 'pago', perfilRisco = 'medio' } = params;
  const norms = mergeNorms(normsConfig);
  const n = norms.seguranca;

  const ratioBase = tipoEvento === 'pago' ? n.ratioBasePago : n.ratioBaseNaoPago;

  const fatorRisco =
    perfilRisco === 'alto'  ? n.fatorRiscoAlto  :
    perfilRisco === 'baixo' ? n.fatorRiscoBaixo : 1.0;
  const ratioEfetivo = round(ratioBase * fatorRisco);

  const vigilantesMinimos     = ceil(pax / ratioBase);
  const vigilantesRecomendados = ceil(pax / ratioEfetivo);

  const controladores = ceil(vigilantesRecomendados * n.propControladores);
  const ronda         = ceil(vigilantesRecomendados * n.propRonda);
  const pontoFixo     = ceil(vigilantesRecomendados * n.propPontoFixo);
  const reserva       = ceil(vigilantesRecomendados * n.propReserva);

  const coordenadores = ceil(vigilantesRecomendados / n.vigilantesPorSupervisor);
  const postoComando  = 1;

  const alerts: AlertItem[] = [];

  if (vigilantesRecomendados < vigilantesMinimos) {
    alerts.push({ level: 'critical', message: 'Cálculo interno resultou em menos que o mínimo legal. Usando mínimo legal.' });
  }

  if (pax > n.alertaPaxGrandePorte && perfilRisco !== 'alto') {
    alerts.push({
      level: 'warning',
      message: `Evento com ${pax.toLocaleString()} pax. Reavalie o perfil de risco — eventos de grande porte geralmente demandam classificação 'alto' para garantia da segurança.`,
    });
  }

  if (tipoEvento === 'pago' && pax > n.paxExigePlanoPolicia) {
    alerts.push({
      level: 'info',
      message: `Portaria DPF 18.045/2023: para eventos pagos acima de ${n.paxExigePlanoPolicia.toLocaleString()} pax, exige-se plano de segurança aprovado pela autoridade policial local com antecedência mínima de 30 dias.`,
    });
  }

  return {
    results: {
      vigilantesMinimosLegais: { value: vigilantesMinimos, label: 'Vigilantes (Mínimo Legal)', norma: `1/${ratioBase} pax — Portaria DPF 18.045/2023` },
      vigilantesRecomendados:  { value: vigilantesRecomendados, label: 'Vigilantes (Recomendado AXON)' },
      distribuicao: {
        controladores: { value: controladores, label: 'Controladores de Acesso' },
        ronda:         { value: ronda,         label: 'Ronda / Circulação' },
        pontoFixo:     { value: pontoFixo,     label: 'Pontos Fixos (Palco/VIP)' },
        reserva:       { value: reserva,       label: 'Reserva Tática (QRF)' },
      },
      coordenadores: { value: coordenadores, label: 'Supervisores / Coordenadores' },
      totalEfetivo:  { value: vigilantesRecomendados + coordenadores + postoComando, label: 'Efetivo Total de Segurança' },
    },
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * 3. BRIGADA DE INCÊNDIO
 * Norma: IT-17 CBPMESP / NT 5-04 CBMERJ
 */
export function calcBrigada(
  params: BrigadaParams,
  normsConfig?: Partial<NormsConfig>,
): CalcResult<BrigadaResults> {
  const { pax, area, estado = 'federal', riscoIncendio = 'basico', estruturasTemporarias = true } = params;
  const norms = mergeNorms(normsConfig);
  const n = norms.brigada;

  let brigadistas: number;
  let normaAplicada: string;

  if (estado === 'SP' && pax > n.paxLimiteSPGrandePorte) {
    brigadistas  = ceil(pax / n.ratioSPGrandePorte);
    normaAplicada = `IT-17 CBPMESP (>${n.paxLimiteSPGrandePorte.toLocaleString()} pax): 1 brigadista / ${n.ratioSPGrandePorte} pax`;
  } else if (riscoIncendio === 'alto') {
    brigadistas  = ceil(pax / n.ratioRiscoAlto);
    normaAplicada = `IT-17 CBPMESP risco alto: 1 brigadista / ${n.ratioRiscoAlto} pax`;
  } else {
    const por_pax  = ceil(pax  / n.ratioPaxPadrao);
    const por_area = ceil(area / n.ratioAreaPadrao);
    brigadistas   = Math.max(por_pax, por_area);
    normaAplicada  = `IT-17 SP / NT 5-04 RJ: max(${por_pax} por pax, ${por_area} por área)`;
  }

  if (estado === 'RJ' && estruturasTemporarias) {
    const brigadistasRJ = n.brigadistasRJBase + ceil(area / n.ratioRJArea);
    if (brigadistasRJ > brigadistas) {
      brigadistas  = brigadistasRJ;
      normaAplicada = `NT 5-04 CBMERJ Tabela 1: ${n.brigadistasRJBase} BC + 1/${n.ratioRJArea} m² (estruturas temporárias)`;
    }
  }

  const extintores  = ceil(area / n.ratioExtintores);
  const hidrantes   = ceil(area / n.ratioHidrantes);
  const supervisores = ceil(brigadistas / n.brigadistasPorSupervisor);

  const alerts: AlertItem[] = [];

  if (riscoIncendio === 'basico' && (estado === 'SP' || estado === 'RJ')) {
    alerts.push({
      level: 'info',
      message: `Confirme com o CBME${estado} a classificação de risco. Eventos com uso de pirotecnia, geração de energia a diesel e estruturas de madeira são automaticamente classificados como risco alto.`,
    });
  }

  if (pax > n.alertaPaxRiscoGrandePorte && riscoIncendio === 'basico') {
    alerts.push({
      level: 'warning',
      message: `Com ${pax.toLocaleString()} pax, a classificação de risco 'básico' pode ser recusada pelo Corpo de Bombeiros. Recomenda-se plano de risco alto para eventos de grande porte.`,
    });
  }

  if (extintores < n.minExtintores) {
    alerts.push({ level: 'warning', message: `Mínimo absoluto de ${n.minExtintores} extintores por área de evento, independente do cálculo de m².` });
  }

  return {
    results: {
      brigadistas:  { value: brigadistas,                            label: 'Brigadistas Mínimos', norma: normaAplicada },
      supervisores: { value: supervisores,                           label: 'Supervisores de Brigada' },
      totalBrigada: { value: brigadistas + supervisores,             label: 'Total da Brigada' },
      extintores:   { value: Math.max(extintores, n.minExtintores),  label: 'Extintores (ABC mínimo)', norma: `1/${n.ratioExtintores} m² ATC — NT CBMERJ 5-04` },
      hidrantes:    { value: hidrantes,                              label: 'Pontos de Hidrante / Carro Pipa' },
    },
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * 4. SANITÁRIOS
 * Norma: NBR 13969 / NR-24 / NBR 9050
 */
export function calcSanitarios(
  params: SanitariosParams,
  normsConfig?: Partial<NormsConfig>,
): CalcResult<SanitariosResults> {
  const {
    pax, duracaoHoras = 8, proporcaoHomens = 0.5,
    openBar = false, pcdPercentual = 0.05,
  } = params;
  const norms = mergeNorms(normsConfig);
  const n = norms.sanitarios;

  const homens   = round(pax * proporcaoHomens);
  const mulheres = pax - homens;

  const ratioM = duracaoHoras > n.limiteHorasLonga ? n.ratioCabineMHorasLongas : n.ratioCabineMHorasCurtas;
  const ratioF = duracaoHoras > n.limiteHorasLonga ? n.ratioCabineFHorasLongas : n.ratioCabineFHorasCurtas;

  const fatorOpenBar = openBar ? n.fatorOpenBar : 1.0;

  const cabinesM   = ceil((homens   / ratioM) * fatorOpenBar);
  const cabinesF   = ceil((mulheres / ratioF) * fatorOpenBar);
  const cabinesPCD = Math.max(n.minCabinesPCD, ceil(pax / n.ratioCabinePCD));
  const mictorios  = ceil(homens / n.ratioMictorios);
  const lavatorios = ceil((cabinesM + cabinesF + cabinesPCD) / n.ratioCabinesPorLavatorio);

  const picoSimultaneo = ceil(pax * n.propPicoSimultaneo);
  const totalCabines   = cabinesM + cabinesF + cabinesPCD;
  const tempoFilaMin   = round((picoSimultaneo / totalCabines) * n.minUsoPorPessoa_min, 1);

  const alerts: AlertItem[] = [];

  if (openBar && (cabinesM + cabinesF) < ceil(pax / n.alertaCabinesOpenBar)) {
    alerts.push({
      level: 'critical',
      message: `Open Bar ativo com ${pax.toLocaleString()} pax: o número de cabines (${cabinesM + cabinesF}) pode ser insuficiente. Referência prática: 1 cabine / ${n.alertaCabinesOpenBar} pax com open bar. Risco de filas >${n.alertaFilaMax_min + 5} min.`,
    });
  }

  if (tempoFilaMin > n.alertaFilaMax_min) {
    alerts.push({
      level: 'warning',
      message: `Tempo estimado de fila no pico: ${tempoFilaMin} min. Considere aumentar o número de cabines para manter ≤${n.alertaFilaMax_min} min (padrão de conforto NR-24).`,
    });
  }

  if (duracaoHoras <= n.limiteHorasLonga) {
    alerts.push({
      level: 'info',
      message: `Evento com ≤${n.limiteHorasLonga}h de duração. Aplicando NR-24 para jornada parcial (1/${n.ratioCabineMHorasCurtas} H, 1/${n.ratioCabineFHorasCurtas} F). Para eventos com duração >${n.limiteHorasLonga}h o cálculo usa NBR 13969 (mais restritivo).`,
    });
  }

  return {
    results: {
      cabinesM:             { value: cabinesM,   label: 'Cabines Masculinas',  norma: `1/${ratioM} homens — NBR 13969 / NR-24` },
      cabinesF:             { value: cabinesF,   label: 'Cabines Femininas',   norma: `1/${ratioF} mulheres — NBR 13969 / NR-24` },
      cabinesPCD:           { value: cabinesPCD, label: 'Cabines PCD Acessíveis', norma: `1/${n.ratioCabinePCD} pax — NBR 9050 5.10.1` },
      mictorios:            { value: mictorios,  label: 'Mictórios (recomendado)' },
      lavatorios:           { value: lavatorios, label: 'Lavatórios (pias)' },
      totalUnitarios:       { value: cabinesM + cabinesF + cabinesPCD + mictorios, label: 'Total de Unidades Sanitárias' },
      tempoFilaEstimadoMin: { value: tempoFilaMin, label: 'Tempo de Fila no Pico (min)', status: tempoFilaMin > n.alertaFilaMax_min ? 'ALERTA' : 'OK' },
    },
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * 5. EQUIPE MÉDICA
 * Norma: Portaria MS 2.048/2002 + CFM Res. 2.228/2018
 */
export function calcEquipeMedica(
  params: EquipeMedicaParams,
  normsConfig?: Partial<NormsConfig>,
): CalcResult<EquipeMedicaResults> {
  const {
    pax, estado = 'federal', tipoEvento = 'show', perfilPublico = 'geral',
    indoorOutdoor = 'outdoor', epocaAno = 'outro',
  } = params;
  const norms = mergeNorms(normsConfig);
  const n = norms.equipeMedica;

  let medicos: number, enfermeiros: number, ambulanciasB: number, ambulanciasD: number;

  if (pax <= n.limite1) {
    ({ medicos, enfermeiros, ambulanciasB, ambulanciasD } = n.config1);
  } else if (pax <= n.limite2) {
    ({ medicos, enfermeiros, ambulanciasB, ambulanciasD } = n.config2);
  } else {
    const extra = Math.max(0, pax - n.limite2);
    medicos       = n.config2.medicos      + ceil(extra / n.escalonamentoMedico);
    enfermeiros   = n.config2.enfermeiros  + ceil(extra / n.escalonamentoEnfermeiro);
    ambulanciasB  = n.config2.ambulanciasB + ceil(pax  / n.escalonamentoAmbulanciaB) - 1;
    ambulanciasD  = n.config2.ambulanciasD + ceil(extra / n.escalonamentoAmbulanciaD);
  }

  let socorristas = ceil(pax / n.ratioSocorristas);

  const fatorPerfil =
    perfilPublico === 'jovem' ? n.fatorPerfilJovem :
    perfilPublico === 'idoso' ? n.fatorPerfilIdoso : 1.0;
  const fatorClima = (epocaAno === 'verao' && indoorOutdoor === 'outdoor') ? n.fatorClima : 1.0;

  medicos      = ceil(medicos      * fatorPerfil * fatorClima);
  enfermeiros  = ceil(enfermeiros  * fatorPerfil * fatorClima);
  socorristas  = ceil(socorristas  * fatorPerfil * fatorClima);

  const postosMedicos = Math.max(1, ceil(pax / n.ratioPostosMedicos));
  const deaUnidades   = ceil(pax / n.ratioDEA);

  const alerts: AlertItem[] = [];

  if (epocaAno === 'verao' && indoorOutdoor === 'outdoor' && pax > n.alertaPaxVeraoOutdoor) {
    alerts.push({
      level: 'critical',
      message: `Verão + Outdoor + ${pax.toLocaleString()} pax: alto risco de hipertermia e insolação. Equipe médica ampliada por fator ${n.fatorClima}. Verifique distribuição de pontos de água e sombreamento.`,
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
      medicos:             { value: medicos,       label: 'Médicos',                                     norma: 'Portaria MS 2.048/2002 + CFM Res. 2.228/2018' },
      enfermeiros:         { value: enfermeiros,   label: 'Enfermeiros / Técnicos de Enfermagem' },
      socorristas:         { value: socorristas,   label: 'Socorristas / Maqueiros' },
      ambulanciasBasica:   { value: ambulanciasB,  label: 'Ambulâncias Suporte Básico (Tipo B)' },
      ambulanciasAvancada: { value: ambulanciasD,  label: 'Ambulâncias Suporte Avançado (Tipo D/UTI)' },
      postosMedicos:       { value: postosMedicos, label: 'Postos de Atendimento Médico',               norma: 'Portaria SMS-SP 490/2020' },
      deaUnidades:         { value: deaUnidades,   label: 'DEA (Desfibriladores)' },
      totalEquipe:         { value: medicos + enfermeiros + socorristas, label: 'Total da Equipe Médica' },
    },
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * 6. RESÍDUOS SÓLIDOS
 * Norma: NBR 16366 / PNRS Lei 12.305/2010
 */
export function calcResiduos(
  params: ResiduosParams,
  normsConfig?: Partial<NormsConfig>,
): CalcResult<ResiduosResults> {
  const { pax, area, tipoEvento = 'show_bebida', duracaoHoras = 8, coleta = 'terceirizada' } = params;
  const norms = mergeNorms(normsConfig);
  const n = norms.residuos;

  const kgPorPax       = n.kgPorPax[tipoEvento] ?? n.kgPorPax.show_bebida;
  const totalResiduo_kg = round(pax * kgPorPax);

  const organico_kg   = round(totalResiduo_kg * n.propOrganico);
  const reciclavel_kg = round(totalResiduo_kg * n.propReciclavel);
  const rejeito_kg    = round(totalResiduo_kg * n.propRejeito);

  const coletasNecessarias = ceil(duracaoHoras / n.intervaloColeta_h);
  const coletores          = ceil(area / n.ratioColetores);
  const caminhoes          = ceil(totalResiduo_kg / n.capacidadeCaminhao_kg);
  const garis              = Math.max(n.minGaris, ceil(area / n.ratioGaris));

  const custoPorTon    = n.custoDestinacao[coleta] ?? 0;
  const custoEstimado  = round((totalResiduo_kg / 1000) * custoPorTon, 2);

  const alerts: AlertItem[] = [];

  if (totalResiduo_kg > n.alertaLimite_kg) {
    alerts.push({
      level: 'warning',
      message: `Geração estimada de ${(totalResiduo_kg / 1000).toFixed(1)} toneladas. Exige licença de transporte de resíduos (MTR) e destinação final registrada. Verifique PNRS (Lei 12.305/2010).`,
    });
  }

  if (coletores < n.alertaMinColetores && pax > n.alertaPaxMinColetores) {
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
      totalResiduo_kg:            { value: totalResiduo_kg,                          label: 'Total de Resíduos Estimado (kg)', norma: `${kgPorPax} kg/pax — NBR 16366` },
      totalResiduo_ton:           { value: round(totalResiduo_kg / 1000, 2),         label: 'Total de Resíduos Estimado (ton)' },
      organico_kg:                { value: organico_kg,                              label: `Resíduos Orgânicos (kg) ~${n.propOrganico * 100}%` },
      reciclavel_kg:              { value: reciclavel_kg,                            label: `Recicláveis (kg) ~${n.propReciclavel * 100}%` },
      rejeito_kg:                 { value: rejeito_kg,                              label: `Rejeitos (kg) ~${n.propRejeito * 100}%` },
      coletores:                  { value: coletores,                                label: 'Coletores / Lixeiras' },
      garis:                      { value: garis,                                    label: 'Pessoal de Coleta (Garis)' },
      caminhoes:                  { value: caminhoes,                                label: 'Caminhões de Coleta Necessários' },
      coletasNecessarias:         { value: coletasNecessarias,                       label: 'Coletas Intermediárias Durante Evento' },
      custoEstimadoDestinacao:    { value: custoEstimado,                            label: 'Custo Estimado de Destinação (R$)' },
    },
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PILAR 2 — INFRAESTRUTURA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 7. GERADOR DE ENERGIA
 * Norma: NBR 5410 / AES Standards
 */
export function calcGerador(
  params: GeradorParams,
  normsConfig?: Partial<NormsConfig>,
): CalcResult<GeradorResults> {
  const {
    pax, area, tipoEvento = 'show_pop', quantidadePalcos = 1,
    iluminacaoCenica = true, telaoLed = true, operacaoNoturna = true,
  } = params;
  const norms = mergeNorms(normsConfig);
  const n = norms.gerador;

  const wattsPorPax      = n.wattsPorPax[tipoEvento] ?? n.wattsPorPax.show_pop;
  const cargaSom_kW       = (pax * wattsPorPax) / 1000;
  const cargaIluminacao_kW = iluminacaoCenica ? cargaSom_kW * n.propIluminacaoCenica : 0;
  const cargaLed_kW        = telaoLed ? quantidadePalcos * n.kWLedPorPalco : 0;
  const cargaOperacional_kW = (area * n.wattsOperacionalM2) / 1000;
  const cargaNoturna_kW     = operacaoNoturna ? (area * n.wattsNoturnoM2) / 1000 : 0;

  const cargaTotalEstimada_kW = cargaSom_kW + cargaIluminacao_kW + cargaLed_kW + cargaOperacional_kW + cargaNoturna_kW;
  const cargaComMargem_kW     = cargaTotalEstimada_kW * n.fatorMargem;
  const kva_necessarios        = round(cargaComMargem_kW / n.fatorPotencia, 0);

  const melhorConfig = n.modelos.find(c => c.kva >= kva_necessarios / quantidadePalcos) ?? n.modelos[0];
  const qtdGeradores = ceil(kva_necessarios / melhorConfig.kva);

  const consumoDiesel_L_h = round(kva_necessarios * n.consumoDiesel_L_kVA_h, 0);
  const reservaDiesel     = round(consumoDiesel_L_h * n.horasReferenciaAlerta * n.propReservaDiesel);

  const alerts: AlertItem[] = [];

  if (kva_necessarios > n.alertaKVA) {
    alerts.push({
      level: 'warning',
      message: `Carga elétrica estimada em ${kva_necessarios} kVA. Considere renegociação com a distribuidora local para fornecimento direto (CPFL/Enel). Geradores acima de 2MW têm lead time de locação de 60+ dias.`,
    });
  }

  if (!iluminacaoCenica && tipoEvento === 'rock_edm') {
    alerts.push({
      level: 'warning',
      message: `Rock/EDM sem iluminação cênica é incomum. Revise o input — a carga de iluminação representa ~${n.propIluminacaoCenica * 100}% do consumo total em shows desse perfil.`,
    });
  }

  alerts.push({
    level: 'info',
    message: `Consumo estimado de diesel: ${consumoDiesel_L_h} L/h. Para evento de ${n.horasReferenciaAlerta}h, providencie mínimo ${reservaDiesel} L (${((n.propReservaDiesel - 1) * 100).toFixed(0)}% de reserva de segurança).`,
  });

  return {
    results: {
      cargaSom_kW:              { value: round(cargaSom_kW, 1),            label: 'Carga de Sonorização (kW)',                norma: `${wattsPorPax} W/pax — AES Standards` },
      cargaIluminacao_kW:       { value: round(cargaIluminacao_kW, 1),     label: 'Carga de Iluminação Cênica (kW)' },
      cargaLed_kW:              { value: round(cargaLed_kW, 1),            label: 'Carga LED/Telão (kW)' },
      cargaOperacional_kW:      { value: round(cargaOperacional_kW, 1),    label: 'Carga Operacional (A&B, infra) (kW)' },
      cargaTotalEstimada_kW:    { value: round(cargaTotalEstimada_kW, 1),  label: 'Carga Total Estimada (kW)' },
      kva_necessarios:          { value: kva_necessarios,                   label: 'kVA Necessários (com margem NBR 5410)',    norma: `Fator ${n.fatorMargem} — NBR 5410` },
      configuracaoRecomendada:  { value: `${qtdGeradores}x ${melhorConfig.modelo}`, label: 'Configuração de Geradores Recomendada' },
      consumoDiesel_L_h:        { value: consumoDiesel_L_h,                 label: 'Consumo de Diesel (L/h)' },
    },
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * 8. SONORIZAÇÃO
 * Norma: AES Standards / NR-15
 */
export function calcSonorizacao(
  params: SonorizacaoParams,
  normsConfig?: Partial<NormsConfig>,
): CalcResult<SonorizacaoResults> {
  const {
    pax, area, tipoEvento = 'show_pop', quantidadePalcos = 1,
    indoorOutdoor = 'outdoor', nivelSPL_alvo,
  } = params;
  const norms = mergeNorms(normsConfig);
  const n = norms.sonorizacao;

  const splAlvo        = nivelSPL_alvo ?? n.nivelSPLAlvoPadrao;
  const wRMS_por_pax   = n.wattsPorPax[tipoEvento] ?? n.wattsPorPax.show_pop;
  const potenciaPA_W   = pax * wRMS_por_pax;
  const potenciaPA_kW  = round(potenciaPA_W / 1000, 1);

  const elemPorStack  = ceil(potenciaPA_kW / (quantidadePalcos * n.kWPorElementoStack));
  const stacks        = quantidadePalcos * 2;
  const delayTowers   = indoorOutdoor === 'outdoor' ? ceil(area / n.ratioDelayTowers) : 0;
  const subwoofers_kW = round(potenciaPA_kW * n.propSubwoofers, 1);
  const monitoresPalco = quantidadePalcos * n.monitoresPorPalco;

  const FOH_engineers    = quantidadePalcos;
  const monitor_engineers = quantidadePalcos;
  const RF_tecnico        = ceil(quantidadePalcos / n.rfPorPalcos);
  const assistentes       = ceil(quantidadePalcos * n.propAssistentesAudio);

  const distanciaMaxima   = round(Math.sqrt(area), 0);
  const spl_na_distancia  = round(splAlvo - 20 * Math.log10(distanciaMaxima / 1), 1);

  const alerts: AlertItem[] = [];

  if (indoorOutdoor === 'indoor' && splAlvo > n.alertaSPLIndoor_dB) {
    alerts.push({
      level: 'critical',
      message: `SPL alvo de ${splAlvo} dB em ambiente indoor excede limites da NR-15 (85 dB/8h para exposto). Exige estudo acústico e barreiras para staff permanente.`,
    });
  }

  if (spl_na_distancia < n.alertaSPLRockMin_dB && tipoEvento === 'rock_edm') {
    alerts.push({
      level: 'warning',
      message: `SPL estimado na distância máxima (${distanciaMaxima}m): ${spl_na_distancia} dB. Para rock/EDM, recomenda-se mínimo ${n.alertaSPLRockMin_dB} dB(A) na última fila. Adicione delay towers.`,
    });
  }

  if (delayTowers === 0 && area > n.ratioDelayTowers * 2 && indoorOutdoor === 'outdoor') {
    alerts.push({
      level: 'warning',
      message: `Área outdoor de ${area} m² sem delay towers. Cobertura uniforme pode ser comprometida. Verifique cálculo de throw do PA principal.`,
    });
  }

  return {
    results: {
      potenciaPA_kW:        { value: potenciaPA_kW,    label: 'Potência Total do PA (kW RMS)',                   norma: `${wRMS_por_pax} W/pax — AES Standards` },
      subwoofers_kW:        { value: subwoofers_kW,    label: 'Potência de Subwoofers (kW)' },
      stacks:               { value: stacks,            label: 'Stacks de Line Array (L+R por palco)' },
      elemPorStack:         { value: elemPorStack,      label: 'Elementos por Stack (estimativa)' },
      delayTowers:          { value: delayTowers,       label: 'Delay Towers (outdoor)' },
      monitoresPalco:       { value: monitoresPalco,    label: 'Monitores de Palco' },
      equipe: {
        fohEngineers:     FOH_engineers,
        monitorEngineers: monitor_engineers,
        rfTecnicos:       RF_tecnico,
        assistentes,
        total:            FOH_engineers + monitor_engineers + RF_tecnico + assistentes,
      },
      spl_na_distanciaMax: { value: spl_na_distancia,  label: `SPL Estimado na Distância Máxima (${distanciaMaxima}m) (dB)` },
    },
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * 9. RECEPÇÃO / CONTROLE DE ACESSO
 * Norma: NBR 9050
 */
export function calcRecepcao(
  params: RecepcaoParams,
  normsConfig?: Partial<NormsConfig>,
): CalcResult<RecepcaoResults> {
  const {
    pax, tiposIngresso = ['pista', 'camarote'],
    tempoAberturaPortas_h = 2, sistemaEntrada = 'qrcode', paxPorHora,
  } = params;
  const norms = mergeNorms(normsConfig);
  const n = norms.recepcao;

  const vazaoPorPonto = n.vazao[sistemaEntrada] ?? n.vazao.qrcode;

  const picoPaxHora = paxPorHora ?? ceil(pax * n.propPicoChegada / tempoAberturaPortas_h);
  const picoPaxMin  = ceil(picoPaxHora / 60);

  const pontosAcessoNecessarios = ceil(picoPaxMin / vazaoPorPonto);

  const ratioMap: Record<string, number> = { pista: 0.70, camarote: 0.15, vip: 0.10, backstage: 0.05 };
  const distribuicaoAcessos: Record<string, number> = {};
  tiposIngresso.forEach(tipo => {
    const ratio = ratioMap[tipo] ?? (1 / tiposIngresso.length);
    distribuicaoAcessos[tipo] = ceil(pontosAcessoNecessarios * ratio);
  });

  const comprimentoFilaEstimado_m = ceil(
    (picoPaxHora * n.propFilaEmEspera) / 60 * n.espacoFilaPorPax_m,
  );

  const recepcao_acesso   = pontosAcessoNecessarios;
  const supervisores_acesso = ceil(pontosAcessoNecessarios / n.supervisoresPorPontos);
  const staff_informacoes   = ceil(pax / n.ratioStaffInfo);
  const credenciadores      =
    (tiposIngresso.includes('camarote') || tiposIngresso.includes('vip'))
      ? ceil(pax * n.propCredenciadoresCapacidade / n.ratioCredenciadores)
      : 0;

  const tempoFilaMin = round(picoPaxMin / (pontosAcessoNecessarios * vazaoPorPonto) * 60 * 0.5, 1);

  const alerts: AlertItem[] = [];

  if (tempoFilaMin > n.alertaFilaMax_min) {
    alerts.push({
      level: 'critical',
      message: `Tempo de fila estimado no pico: ${tempoFilaMin} min. Risco de confusão na entrada. Adicione ${ceil(pontosAcessoNecessarios * 0.3)} pontos de acesso extras ou implemente abertura gradual de portões.`,
    });
  }

  if (sistemaEntrada === 'papel' && pax > n.paxMinimoPapelAviso) {
    alerts.push({
      level: 'warning',
      message: `Sistema de ingresso físico (papel) para ${pax.toLocaleString()} pax. Risco alto de fraude e lentidão. Recomenda-se migrar para QR Code com validador duplo.`,
    });
  }

  if (tempoAberturaPortas_h < n.tempoAberturaMinima_h && pax > n.paxMinimoAvisoAberturaPortas) {
    alerts.push({
      level: 'warning',
      message: `Janela de abertura de portões de ${tempoAberturaPortas_h}h é curta para ${pax.toLocaleString()} pax. Recomende abertura mínima de ${n.tempoAberturaMinima_h}h antes da primeira atração.`,
    });
  }

  return {
    results: {
      pontosAcessoNecessarios:     { value: pontosAcessoNecessarios,  label: 'Pontos de Acesso / Catracas Necessários' },
      distribuicaoAcessos:         { value: distribuicaoAcessos,       label: 'Distribuição por Tipo de Ingresso' },
      picoPaxPorMinuto:            { value: picoPaxMin,                label: 'Pico de Chegada (pax/min)' },
      tempoFilaEstimadoMin:        { value: tempoFilaMin,              label: 'Tempo de Fila no Pico (min)', status: tempoFilaMin > 20 ? 'ALERTA' : 'OK' },
      comprimentoFilaEstimado_m:   { value: comprimentoFilaEstimado_m, label: 'Comprimento de Fila Estimado (m)' },
      pessoal: {
        operadoresAcesso: recepcao_acesso,
        supervisores:     supervisores_acesso,
        staffInformacoes: staff_informacoes,
        credenciadores,
        total:            recepcao_acesso + supervisores_acesso + staff_informacoes + credenciadores,
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
 * Norma: Senac Eventos
 */
export function calcGelo(
  params: GeloParams,
  normsConfig?: Partial<NormsConfig>,
): CalcResult<GeloResults> {
  const {
    pax, epocaAno = 'verao', tipoConsumoPrincipal = 'cerveja',
    openBar = false, duracaoHoras = 8,
  } = params;
  const norms = mergeNorms(normsConfig);
  const n = norms.gelo;

  const fatorEpoca   = n.fatorEpoca[epocaAno] ?? n.fatorEpoca.outro;
  const fatorConsumo =
    tipoConsumoPrincipal === 'destilado' ? n.fatorConsumo.destilado :
    tipoConsumoPrincipal === 'misto'     ? n.fatorConsumo.misto     : n.fatorConsumo.outros;
  const fatorOpenBar = openBar ? n.fatorOpenBar : 1.0;

  const kg_por_pax = round(n.kgBasePorPax * fatorEpoca * fatorConsumo * fatorOpenBar, 2);
  const geloTotal_kg = round(pax * kg_por_pax);

  const geloBebidas_kg = round(geloTotal_kg * n.propGeloBebidas);
  const geloAeB_kg     = round(geloTotal_kg * n.propGeloAeB);
  const geloMedico_kg  = round(geloTotal_kg * n.propGeloMedico);

  const caixasGelo          = ceil(geloTotal_kg / n.pesoCaixaGelo_kg);
  const pontosDistribuicao  = ceil(pax / n.ratioPontosDistribuicao);

  const fatorDerretimento   = epocaAno === 'verao' ? n.fatorDerretimento.verao : n.fatorDerretimento.outros;
  const geloAdicionalReposicao_kg  = round(geloTotal_kg * fatorDerretimento * (duracaoHoras / 2));
  const geloTotalComReposicao_kg   = geloTotal_kg + geloAdicionalReposicao_kg;

  const alerts: AlertItem[] = [];

  if (epocaAno === 'verao' && !openBar && pax > n.alertaPaxVerao) {
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
      kg_por_pax:                 { value: kg_por_pax,                  label: 'Gelo por Pessoa (kg)', norma: `Base ${n.kgBasePorPax} kg/pax — Senac Eventos` },
      geloTotal_kg:               { value: geloTotal_kg,                label: 'Total de Gelo (kg)' },
      geloTotalComReposicao_kg:   { value: geloTotalComReposicao_kg,    label: 'Total com Reposição (kg)' },
      distribuicao: {
        bebidas_kg: geloBebidas_kg,
        aeb_kg:     geloAeB_kg,
        medico_kg:  geloMedico_kg,
      },
      caixasGelo20kg:       { value: caixasGelo,         label: `Caixas de Gelo (${n.pesoCaixaGelo_kg} kg/cx)` },
      pontosDistribuicao:   { value: pontosDistribuicao,  label: 'Pontos de Distribuição / Bares' },
    },
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * 11. INSUMOS GERAIS (água, copos, guardanapos, embalagens)
 * Norma: ABRAPE / NR-24
 */
export function calcInsumos(
  params: InsumosParams,
  normsConfig?: Partial<NormsConfig>,
): CalcResult<InsumosResults> {
  const {
    pax, area, duracaoHoras = 8, openBar = false,
    incluiAlimentacao = true, epocaAno = 'outro',
  } = params;
  const norms = mergeNorms(normsConfig);
  const n = norms.insumos;

  const fatorCalor  = epocaAno === 'verao' ? n.fatorCalorAgua : 1.0;
  const agua_L_por_pax = round(n.aguaL_pax_h * duracaoHoras * fatorCalor, 1);
  const aguaTotal_L    = round(pax * agua_L_por_pax);

  const galoes20L        = ceil(aguaTotal_L * n.propGaloesAgua  / n.volGalao_L);
  const garrafinhas500ml = ceil(aguaTotal_L * n.propGarrafinhas / n.volGarrafinha_L);

  const fatorCopo = openBar ? n.fatorOpenBarCopas : 1.0;
  const copas     = ceil(pax * n.copasPorPaxPorHora * fatorCopo);

  const embalagens   = incluiAlimentacao ? ceil(pax * n.embalagensPorPax) : 0;
  const guardanapos  = incluiAlimentacao ? pax * n.guardanaposPorPax : pax * n.guardanaposSemAlim;
  const canudos      = openBar           ? pax * n.canudosOpenBar    : pax * n.canudosPadrao;

  const sacosLixo  = ceil((area / n.ratioSacosLixo_m2) * (duracaoHoras / n.intervaloSacosLixo_h));
  const kitHigiene = ceil(pax / n.ratioKitHigiene);

  const alerts: AlertItem[] = [];

  if (aguaTotal_L > n.alertaAguaLitros) {
    alerts.push({
      level: 'info',
      message: `Demanda de ${(aguaTotal_L / 1000).toFixed(0)} mil litros de água. Verifique capacidade de abastecimento local. Para eventos acima de ${(n.alertaAguaLitros / 1000).toFixed(0)}k L, negocie fornecimento direto com distribuidora ou empresa de water truck.`,
    });
  }

  if (epocaAno === 'verao' && duracaoHoras > n.alertaDuracaoAgua_h) {
    alerts.push({
      level: 'warning',
      message: `Verão + evento longo: hidratação crítica. Considere pontos de distribuição de água gratuita conforme Lei 14.017/2020 (Lei Aldir Blanc) e práticas de megaeventos.`,
    });
  }

  return {
    results: {
      agua: {
        total_L:        aguaTotal_L,
        galoes20L,
        garrafinhas500ml,
        norma: `${agua_L_por_pax} L/pax (${n.aguaL_pax_h} L/h × ${duracaoHoras}h) — ABRAPE`,
      },
      coposDescartaveis: { value: copas,       label: 'Copos Descartáveis' },
      embalagens:        { value: embalagens,  label: 'Embalagens de Alimentação' },
      guardanapos:       { value: guardanapos, label: 'Guardanapos' },
      canudos:           { value: canudos,     label: 'Canudos' },
      sacosLixo:         { value: sacosLixo,   label: 'Sacos de Lixo' },
      kitsHigiene:       { value: kitHigiene,  label: 'Kits de Higiene (postos)' },
    },
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * 12. ALIMENTAÇÃO (Staff + Público)
 * Norma: NR-24 24.3.1 / VISA municipal
 */
export function calcAlimentacao(
  params: AlimentacaoParams,
  normsConfig?: Partial<NormsConfig>,
): CalcResult<AlimentacaoResults> {
  const {
    pax, duracaoHoras = 10, refeicoesPrevistas = 2,
    incluiPublico = true, percentualPublicoQueAlimenta = 0.6, staffTotal,
  } = params;
  const norms = mergeNorms(normsConfig);
  const n = norms.alimentacao;

  const staff           = staffTotal ?? ceil(pax * n.propStaffDoPax);
  const refeicoes_staff = staff * refeicoesPrevistas;
  const totalAlimentacao_staff_kg = round(
    (refeicoes_staff * n.gramas_por_refeicao * n.fatorExcedente) / 1000,
    1,
  );

  const publicoQueAlimenta       = incluiPublico ? ceil(pax * percentualPublicoQueAlimenta) : 0;
  const refeicoes_publico        = publicoQueAlimenta;
  const totalAlimentacao_publico_kg = incluiPublico
    ? round((refeicoes_publico * n.porcaoPublico_g) / 1000, 1)
    : 0;

  const foodTrucks      = incluiPublico ? ceil(publicoQueAlimenta / n.ratioFoodTrucks) : 0;
  const areaCozinha_m2  = round((refeicoes_staff / 50) * n.m2CozinhaPor50Refeicoes, 0);

  const alerts: AlertItem[] = [];

  if (refeicoes_staff > n.alertaRefeicoesCozinha && areaCozinha_m2 < n.minAreaCozinhaAlerta_m2) {
    alerts.push({
      level: 'warning',
      message: `Mais de ${n.alertaRefeicoesCozinha} refeições para staff. Área de cozinha industrial mínima recomendada: ${n.minAreaCozinhaAlerta_m2} m². Avalie terceirização da produção alimentar (catering).`,
    });
  }

  if (incluiPublico && foodTrucks > n.alertaFoodTrucksVISA) {
    alerts.push({
      level: 'info',
      message: `${foodTrucks} food trucks necessários. Para eventos com >${n.alertaFoodTrucksVISA} operações de alimentação, exige-se vigilância sanitária municipal (VISA) e mapa de operações aprovado com antecedência mínima de 15 dias.`,
    });
  }

  if (duracaoHoras > n.alertaHorasSemRefeicao && refeicoesPrevistas < n.alertaRefeicoesMinimoLongo) {
    alerts.push({
      level: 'warning',
      message: `Evento de ${duracaoHoras}h com apenas ${refeicoesPrevistas} refeição(ões) prevista(s) para o staff. NR-24 recomenda refeição a cada ${n.intervaloRefeicaoNR24_h}h de trabalho.`,
    });
  }

  return {
    results: {
      staff_refeicoes:          { value: refeicoes_staff,             label: 'Refeições de Staff' },
      staff_alimentacao_kg:     { value: totalAlimentacao_staff_kg,   label: 'Alimentos para Staff (kg)', norma: `${n.gramas_por_refeicao}g/refeição +${((n.fatorExcedente - 1) * 100).toFixed(0)}% — NR-24 24.3.1` },
      publico_refeicoes:        { value: refeicoes_publico,           label: 'Refeições para Público' },
      publico_alimentacao_kg:   { value: totalAlimentacao_publico_kg, label: 'Alimentos para Público (kg)' },
      foodTrucks:               { value: foodTrucks,                   label: 'Food Trucks / Barracas de Alimentação' },
      areaCozinhaIndustrial_m2: { value: areaCozinha_m2,               label: 'Área de Cozinha Industrial Necessária (m²)' },
      totalAlimentacao_kg:      { value: round(totalAlimentacao_staff_kg + totalAlimentacao_publico_kg, 1), label: 'Total de Alimentos (kg)' },
    },
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * 13. BEBIDAS
 * Norma: Abrasel / Senac Eventos
 */
export function calcBebidas(
  params: BebidasParams,
  normsConfig?: Partial<NormsConfig>,
): CalcResult<BebidasResults> {
  const {
    pax, epocaAno = 'verao', openBar = false, duracaoHoras = 8,
    tiposDeBebida = ['agua', 'cerveja', 'refrigerante'], proporcaoAlcool = 0.60,
  } = params;
  const norms = mergeNorms(normsConfig);
  const n = norms.bebidas;

  const fatorCalor   = n.fatorCalor[epocaAno] ?? n.fatorCalor.outro;
  const fatorOpenBar = openBar ? n.fatorOpenBar : 1.0;

  const cerveja_L_h       = n.cervejaL_pax_h * fatorCalor * fatorOpenBar;
  const refri_L_h         = n.refriL_pax_h   * fatorCalor;
  const destilado_doses_h = n.destiladoDoses_pax_h * fatorOpenBar;

  const paxAlcool    = ceil(pax * proporcaoAlcool);
  const paxSemAlcool = pax - paxAlcool;

  const bebidas: Record<string, BebidaInfo> = {};

  if (tiposDeBebida.includes('agua')) {
    bebidas.agua = {
      totalLitros:   round(pax * n.aguaL_pax_h * duracaoHoras),
      unidades500ml: ceil(pax * n.aguaL_pax_h * duracaoHoras / 0.5),
      label: 'Água (L)',
      norma: `${n.aguaL_pax_h} L/pax/h — ABRAPE`,
    };
  }

  if (tiposDeBebida.includes('cerveja')) {
    bebidas.cerveja = {
      totalLitros:  round(paxAlcool * cerveja_L_h * duracaoHoras),
      latinhas350ml: ceil(paxAlcool * cerveja_L_h * duracaoHoras / 0.35),
      label: 'Cerveja (L)',
      norma: `${cerveja_L_h.toFixed(2)} L/pax/h — Abrasel`,
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
      totalDoses:  round(paxAlcool * proporcaoAlcool * destilado_doses_h * duracaoHoras),
      totalLitros: round(paxAlcool * proporcaoAlcool * destilado_doses_h * duracaoHoras * n.volDose_L),
      label: 'Destilados (doses 50ml)',
    };
  }

  const bares    = ceil(pax / n.ratioBares);
  const freezers = ceil(pax / n.ratioFreezers);

  const alerts: AlertItem[] = [];

  if (openBar && epocaAno === 'verao' && pax > n.alertaPaxOpenBarVerao) {
    alerts.push({
      level: 'critical',
      message: `Open bar no verão com ${pax.toLocaleString()} pax: consumo de cerveja pode chegar a ${n.cervejaAlertaFator}L/pax/h. Planeje ${((n.alertaAcrescimoVerao) * 100).toFixed(0)}% acima do estimado e tenha contrato de fornecimento emergencial.`,
    });
  }

  if (tiposDeBebida.includes('destilado') && openBar) {
    alerts.push({
      level: 'warning',
      message: `Open bar com destilados: alto risco de intoxicação alcoólica. Intensifique equipe médica (calcEquipeMedica) e tenha protocolo de atendimento a intoxicados.`,
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
      bares:         { value: bares,    label: 'Pontos de Bar' },
      freezers:      { value: freezers, label: 'Freezers / Refrigeradores' },
      margemEstoque: { value: `+${n.margemEstoque * 100}%`, label: 'Margem de Estoque Recomendada' },
    },
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PILAR 4 — GESTÃO / COMERCIAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 14. INGRESSOS
 * Norma: Lei 14.697/2024
 */
export function calcIngressos(
  params: IngressosParams,
  normsConfig?: Partial<NormsConfig>,
): CalcResult<IngressosResults> {
  const {
    pax, setores, percentualMeia = 0.20,
    percentualCourtesia = 0.05, percentualPCD = 0.02, plataformaVenda = 'misto',
  } = params;
  const norms = mergeNorms(normsConfig);
  const n = norms.ingressos;

  const setoresResolvidos: SetorIngresso[] = setores ?? n.setoresDefault.map(s => ({
    nome: s.nome,
    capacidade: ceil(pax * s.propCapacidade),
    precoInteiro: s.precoInteiro,
  }));

  let totalIngressosPagantesPotencial = 0;
  let receitaBrutaPotencial = 0;
  const breakdown: SetorBreakdown[] = [];

  setoresResolvidos.forEach(setor => {
    const cap      = setor.capacidade;
    const inteiros = ceil(cap * (1 - percentualMeia - percentualCourtesia - percentualPCD));
    const meias    = ceil(cap * percentualMeia);
    const cortesias = ceil(cap * percentualCourtesia);
    const pcd      = ceil(cap * percentualPCD);
    const receita  = (inteiros * setor.precoInteiro) + (meias * (setor.precoInteiro / 2));

    totalIngressosPagantesPotencial += inteiros + meias;
    receitaBrutaPotencial += receita;

    breakdown.push({ setor: setor.nome, capacidade: cap, inteiros, meias, cortesias, pcd, receita });
  });

  const taxaPlataformaRate = n.taxaPlataforma[plataformaVenda] ?? n.taxaPlataforma.misto;
  const taxaPlataformaValor = round(receitaBrutaPotencial * taxaPlataformaRate, 2);
  const receitaLiquidaIngresso = round(receitaBrutaPotencial - taxaPlataformaValor, 2);

  const lotes: LoteEstrategia[] = n.lotes.map(l => ({
    lote: l.lote,
    desconto: l.desconto,
    qtd: ceil(pax * l.propQtd),
  }));

  const alerts: AlertItem[] = [];

  if (percentualCourtesia > n.alertaCortezia) {
    alerts.push({
      level: 'warning',
      message: `Cortesias acima de ${n.alertaCortezia * 100}% (${(percentualCourtesia * 100).toFixed(0)}%). Isso representa R$ ${round(receitaBrutaPotencial * percentualCourtesia, 0).toLocaleString()} de receita não realizada. Revise a política de cortesias.`,
    });
  }

  if (plataformaVenda === 'online' && taxaPlataformaValor > n.alertaTaxaPlataformaValor) {
    alerts.push({
      level: 'info',
      message: `Taxa de plataforma estimada: R$ ${taxaPlataformaValor.toLocaleString()}. Negocie taxa reduzida para volumes acima de R$ ${(n.alertaTaxaPlataformaValor * 10).toLocaleString()}.`,
    });
  }

  return {
    results: {
      totalIngressosDisponiveis: { value: pax,                          label: 'Total de Ingressos Disponíveis' },
      breakdown:                 { value: breakdown,                     label: 'Breakdown por Setor' },
      receitaBrutaPotencial:     { value: round(receitaBrutaPotencial, 2), label: 'Receita Bruta Potencial (R$)' },
      taxaPlataforma:            { value: taxaPlataformaValor,           label: `Taxa de Plataforma (${(taxaPlataformaRate * 100).toFixed(0)}%)` },
      receitaLiquidaIngresso:    { value: receitaLiquidaIngresso,        label: 'Receita Líquida de Ingressos (R$)' },
      estrategiaLotes:           { value: lotes,                         label: 'Estratégia de Lotes Recomendada' },
    },
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * 15. FINANCEIRO (DRE Simplificado do Evento)
 * Norma: ISS + IRPJ / Simples Nacional
 */
export function calcFinanceiro(
  params: FinanceiroParams,
  normsConfig?: Partial<NormsConfig>,
): CalcResult<FinanceiroResults> {
  const {
    pax,
    receitaIngressos  = 0, receitaPatrocinio = 0, receitaAeB   = 0, receitaOutras  = 0,
    custoAtracao      = 0, custoInfraTotal   = 0, custoOperacao = 0,
    custoMarketing    = 0, custoLogistica    = 0,
  } = params;
  const norms = mergeNorms(normsConfig);
  const n = norms.financeiro;

  // Permite override de imposto via params (retrocompatibilidade) ou norms
  const impostoPercentualFinal = params.impostoPercentual ?? n.impostoPercentual;

  const receitaBruta  = round(receitaIngressos + receitaPatrocinio + receitaAeB + receitaOutras, 2);
  const impostos      = round(receitaBruta  * impostoPercentualFinal, 2);
  const receitaLiquida = round(receitaBruta - impostos, 2);

  const custoTotal        = round(custoAtracao + custoInfraTotal + custoOperacao + custoMarketing + custoLogistica, 2);
  const lucroOperacional  = round(receitaLiquida - custoTotal, 2);
  const margemOperacional = receitaBruta > 0 ? round((lucroOperacional / receitaBruta) * 100, 1) : 0;

  const custoFixoPorPax    = pax > 0 ? round(custoTotal    / pax, 2) : 0;
  const receitaMediaPorPax = pax > 0 ? round(receitaBruta  / pax, 2) : 0;
  const breakEvenPax: number | null = receitaMediaPorPax > 0
    ? ceil(custoTotal / receitaMediaPorPax)
    : null;

  const roi = custoTotal > 0 ? round((lucroOperacional / custoTotal) * 100, 1) : 0;

  const distCustos: DistribuicaoCustos = {
    atracao:  custoTotal > 0 ? round((custoAtracao   / custoTotal) * 100, 1) : 0,
    infra:    custoTotal > 0 ? round((custoInfraTotal / custoTotal) * 100, 1) : 0,
    operacao: custoTotal > 0 ? round((custoOperacao  / custoTotal) * 100, 1) : 0,
    marketing:custoTotal > 0 ? round((custoMarketing / custoTotal) * 100, 1) : 0,
    logistica:custoTotal > 0 ? round((custoLogistica / custoTotal) * 100, 1) : 0,
  };

  const alerts: AlertItem[] = [];

  if (margemOperacional < n.margemMinimaAlerta * 100 && receitaBruta > 0) {
    alerts.push({
      level: 'warning',
      message: `Margem operacional de ${margemOperacional}%. Abaixo de ${n.margemMinimaAlerta * 100}% — evento em zona de risco financeiro. Margem saudável para shows: ${n.margemIdealMin * 100}–${n.margemIdealMax * 100}%.`,
    });
  }

  if (distCustos.atracao > n.alertaCacheMaxPercent * 100) {
    alerts.push({
      level: 'warning',
      message: `Custo de atração representa ${distCustos.atracao}% do custo total. Cache acima de ${n.alertaCacheMaxPercent * 100}% deixa pouca margem para imprevistos operacionais. Referência de mercado: max ${n.alertaCacheMaxPercent * 100}%.`,
    });
  }

  if (breakEvenPax !== null && breakEvenPax > pax * n.alertaBreakevenPercent) {
    alerts.push({
      level: 'critical',
      message: `Ponto de equilíbrio em ${breakEvenPax.toLocaleString()} pax (${round((breakEvenPax / pax) * 100, 0)}% de ocupação). Evento não suporta cancelamentos ou baixa venda. Reavalie a estrutura de custos.`,
    });
  }

  return {
    results: {
      receitaBruta:        { value: receitaBruta,       label: 'Receita Bruta Total (R$)' },
      impostos:            { value: impostos,            label: `Impostos (${(impostoPercentualFinal * 100).toFixed(0)}%) (R$)` },
      receitaLiquida:      { value: receitaLiquida,      label: 'Receita Líquida (R$)' },
      custoTotal:          { value: custoTotal,          label: 'Custos Totais (R$)' },
      lucroOperacional:    { value: lucroOperacional,    label: 'Lucro Operacional (R$)',  status: lucroOperacional < 0 ? 'PREJUIZO' : 'OK' },
      margemOperacional:   { value: margemOperacional,   label: 'Margem Operacional (%)', status: margemOperacional < n.margemMinimaAlerta * 100 ? 'ALERTA' : 'OK' },
      roi:                 { value: roi,                 label: 'ROI (%)' },
      breakEvenPax:        { value: breakEvenPax,        label: 'Break-even (pax necessários)' },
      custoFixoPorPax:     { value: custoFixoPorPax,     label: 'Custo Médio por Pax (R$)' },
      receitaMediaPorPax:  { value: receitaMediaPorPax,  label: 'Receita Média por Pax (R$)' },
      distribuicaoCustos:  { value: distCustos,          label: 'Distribuição de Custos (%)' },
    },
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * 16. CREDENCIAMENTO
 * Norma: NBR 9050
 */
export function calcCredenciamento(
  params: CredenciamentoParams,
  normsConfig?: Partial<NormsConfig>,
): CalcResult<CredenciamentoResults> {
  const {
    pax,
    tiposCredencial = ['staff', 'imprensa', 'vip', 'artista', 'fornecedor'],
    proporcoes = {},
    sistemaCredenciamento = 'digital',
    diasEvento = 1,
  } = params;
  const norms = mergeNorms(normsConfig);
  const n = norms.credenciamento;

  const credenciais: Record<string, CredencialInfo> = {};
  let totalCredenciais = 0;

  tiposCredencial.forEach(tipo => {
    const ratio      = proporcoes[tipo] ?? n.ratioDefault[tipo as keyof typeof n.ratioDefault] ?? 0.01;
    const quantidade = ceil(pax * ratio);
    totalCredenciais += quantidade;
    credenciais[tipo] = {
      quantidade,
      zonas: n.zonas[tipo] ?? ['A'],
      label: tipo.charAt(0).toUpperCase() + tipo.slice(1),
    };
  });

  const vazaoPonto = sistemaCredenciamento === 'digital'
    ? n.vazaoPonto.digital
    : n.vazaoPonto.fisico;

  const pontosCredenciamento = Math.max(2, ceil(totalCredenciais / vazaoPonto));
  const pessoalCredenciamento = pontosCredenciamento * n.operadoresPorPonto;
  const supervisoresCredenciamento = ceil(pontosCredenciamento / n.supervisoresPorPontos);

  const temCrachaDuro = tiposCredencial.includes('artista') || tiposCredencial.includes('vip');
  const crachaDuro = temCrachaDuro ? ceil(totalCredenciais * n.propCrachaDuro) : 0;
  const pulseira   = ceil(totalCredenciais * n.propPulseira);
  const cordao     = crachaDuro;

  const totalComReposicao = totalCredenciais + (
    diasEvento > 1 ? ceil(totalCredenciais * n.propReposicaoDia * (diasEvento - 1)) : 0
  );

  const alerts: AlertItem[] = [];

  if (totalCredenciais > pax * n.alertaTotalCredenciaisPercent) {
    alerts.push({
      level: 'warning',
      message: `Total de credenciais (${totalCredenciais.toLocaleString()}) representa ${round((totalCredenciais / pax) * 100, 1)}% do PAX. Verifique se há superdimensionamento de staff ou cortesias excessivas.`,
    });
  }

  if (sistemaCredenciamento === 'fisico' && totalCredenciais > n.alertaFisicoMin) {
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
      credenciais:          { value: credenciais,          label: 'Credenciais por Tipo' },
      totalCredenciais:     { value: totalCredenciais,     label: 'Total de Credenciais' },
      totalComReposicao:    { value: totalComReposicao,    label: `Total com Reposição (${diasEvento} dia(s))` },
      pontosCredenciamento: { value: pontosCredenciamento, label: 'Pontos de Credenciamento' },
      pessoal: {
        operadores:   pessoalCredenciamento,
        supervisores: supervisoresCredenciamento,
        total:        pessoalCredenciamento + supervisoresCredenciamento,
      },
      materiais: {
        crachasDuros: crachaDuro,
        pulseiras:    pulseira,
        cordoes:      cordao,
      },
    },
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TIPO DO RESULTADO CONSOLIDADO DO EFEITO DOMINÓ
// ─────────────────────────────────────────────────────────────────────────────

export interface AllCalculationsResult {
  publico:          CalcResult<PublicoResults>;
  seguranca:        CalcResult<SegurancaResults>;
  brigada:          CalcResult<BrigadaResults>;
  sanitarios:       CalcResult<SanitariosResults>;
  equipeMedica:     CalcResult<EquipeMedicaResults>;
  residuos:         CalcResult<ResiduosResults>;
  gerador:          CalcResult<GeradorResults>;
  sonorizacao:      CalcResult<SonorizacaoResults>;
  recepcao:         CalcResult<RecepcaoResults>;
  gelo:             CalcResult<GeloResults>;
  insumos:          CalcResult<InsumosResults>;
  alimentacao:      CalcResult<AlimentacaoResults>;
  bebidas:          CalcResult<BebidasResults>;
  ingressos:        CalcResult<IngressosResults>;
  financeiro:       CalcResult<FinanceiroResults>;
  credenciamento:   CalcResult<CredenciamentoResults>;
}

export interface AllCalculationsOverrides {
  publico?:        Omit<PublicoParams,        'pax' | 'area'>;
  seguranca?:      Omit<SegurancaParams,      'pax' | 'area'>;
  brigada?:        Omit<BrigadaParams,        'pax' | 'area'>;
  sanitarios?:     Omit<SanitariosParams,     'pax' | 'area'>;
  equipeMedica?:   Omit<EquipeMedicaParams,   'pax' | 'area'>;
  residuos?:       Omit<ResiduosParams,       'pax' | 'area'>;
  gerador?:        Omit<GeradorParams,        'pax' | 'area'>;
  sonorizacao?:    Omit<SonorizacaoParams,    'pax' | 'area'>;
  recepcao?:       Omit<RecepcaoParams,       'pax' | 'area'>;
  gelo?:           Omit<GeloParams,           'pax' | 'area'>;
  insumos?:        Omit<InsumosParams,        'pax' | 'area'>;
  alimentacao?:    Omit<AlimentacaoParams,    'pax' | 'area'>;
  bebidas?:        Omit<BebidasParams,        'pax' | 'area'>;
  ingressos?:      Omit<IngressosParams,      'pax' | 'area'>;
  financeiro?:     Omit<FinanceiroParams,     'pax' | 'area'>;
  credenciamento?: Omit<CredenciamentoParams, 'pax' | 'area'>;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT MASTER: EFEITO DOMINÓ — roda todas as 16 calculadoras de uma vez
// ─────────────────────────────────────────────────────────────────────────────

/**
 * runAllCalculations
 * Executa o "Efeito Dominó" completo do AXON.
 * PAX e AREA são propagados para todas as 16 ferramentas.
 *
 * @param pax         - Público total planejado
 * @param area        - Área total do evento em m²
 * @param overrides   - Parâmetros específicos de cada ferramenta (sem pax/area)
 * @param normsConfig - Override parcial de normas (usa DEFAULT_NORMS como fallback)
 * @returns           - Objeto tipado com resultados e alertas de todas as ferramentas
 */
export function runAllCalculations(
  pax: number,
  area: number,
  overrides: AllCalculationsOverrides = {},
  normsConfig?: Partial<NormsConfig>,
): AllCalculationsResult {
  const base = { pax, area };
  const merge = <T extends object>(extra?: T): typeof base & T =>
    ({ ...base, ...(extra ?? {}) } as typeof base & T);

  return {
    publico:        calcPublico       (merge(overrides.publico),        normsConfig),
    seguranca:      calcSeguranca     (merge(overrides.seguranca),      normsConfig),
    brigada:        calcBrigada       (merge(overrides.brigada),        normsConfig),
    sanitarios:     calcSanitarios    (merge(overrides.sanitarios),     normsConfig),
    equipeMedica:   calcEquipeMedica  (merge(overrides.equipeMedica),   normsConfig),
    residuos:       calcResiduos      (merge(overrides.residuos),       normsConfig),
    gerador:        calcGerador       (merge(overrides.gerador),        normsConfig),
    sonorizacao:    calcSonorizacao   (merge(overrides.sonorizacao),    normsConfig),
    recepcao:       calcRecepcao      (merge(overrides.recepcao),       normsConfig),
    gelo:           calcGelo          (merge(overrides.gelo),           normsConfig),
    insumos:        calcInsumos       (merge(overrides.insumos),        normsConfig),
    alimentacao:    calcAlimentacao   (merge(overrides.alimentacao),    normsConfig),
    bebidas:        calcBebidas       (merge(overrides.bebidas),        normsConfig),
    ingressos:      calcIngressos     (merge(overrides.ingressos),      normsConfig),
    financeiro:     calcFinanceiro    (merge(overrides.financeiro),     normsConfig),
    credenciamento: calcCredenciamento(merge(overrides.credenciamento), normsConfig),
  };
}