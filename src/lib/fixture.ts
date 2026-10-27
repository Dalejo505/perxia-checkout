import type { Product } from "./domain";

export const developmentCatalog: Product[] = [
  { id: "worker-analyst", kind: "worker", name: { es: "Analista", en: "Analyst", "pt-BR": "Analista" }, description: { es: "Análisis e investigación de datos", en: "Data analysis and research", "pt-BR": "Análise e pesquisa de dados" }, prices: [
    { id: "analyst-week-v1", version: 1, amount: 4900, currency: "usd", cadence: "week", active: true },
    { id: "analyst-month-v1", version: 1, amount: 17900, currency: "usd", cadence: "month", active: true },
  ] },
  { id: "worker-builder", kind: "worker", name: { es: "Constructor", en: "Builder", "pt-BR": "Construtor" }, description: { es: "Automatización y ejecución", en: "Automation and execution", "pt-BR": "Automação e execução" }, prices: [
    { id: "builder-week-v1", version: 1, amount: 7900, currency: "usd", cadence: "week", active: true },
    { id: "builder-month-v1", version: 1, amount: 28900, currency: "usd", cadence: "month", active: true },
  ] },
  { id: "worker-orchestrator", kind: "worker", name: { es: "Orquestador", en: "Orchestrator", "pt-BR": "Orquestrador" }, description: { es: "Coordinación de flujos complejos", en: "Complex workflow coordination", "pt-BR": "Coordenação de fluxos complexos" }, prices: [
    { id: "orchestrator-week-v1", version: 1, amount: 12900, currency: "usd", cadence: "week", active: true },
    { id: "orchestrator-month-v1", version: 1, amount: 47900, currency: "usd", cadence: "month", active: true },
  ] },
  { id: "credit-100", kind: "credit", name: { es: "100 créditos", en: "100 credits", "pt-BR": "100 créditos" }, description: { es: "Recarga única", en: "One-time top-up", "pt-BR": "Recarga única" }, prices: [{ id: "credit-100-v1", version: 1, amount: 2500, currency: "usd", cadence: "once", active: true }] },
  { id: "credit-500", kind: "credit", name: { es: "500 créditos", en: "500 credits", "pt-BR": "500 créditos" }, description: { es: "Recarga única", en: "One-time top-up", "pt-BR": "Recarga única" }, prices: [{ id: "credit-500-v1", version: 1, amount: 9900, currency: "usd", cadence: "once", active: true }] },
];
