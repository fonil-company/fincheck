/**
 * Rastreamento do funil (Meta Pixel).
 * Pixel ID: NEXT_PUBLIC_META_PIXEL_ID (padrão abaixo).
 *
 * Funil:
 *   PageView        → carregou a página
 *   ViewContent     → formulário apareceu na tela
 *   SimulacaoAjustada (custom) → mexeu em valor/prazo pela 1ª vez
 *   InitiateCheckout → concluiu a etapa de Simulação (valor + prazo)
 *   FunilEtapa (custom) → avançou etapa (2 = dados, 3 = endereço, 4 = revisão)
 *   AddPaymentInfo  → concluiu dados pessoais
 *   SubmitApplication → concluiu endereço (pronto para enviar)
 *   Lead            → solicitação gravada (eventID = protocolo, deduplica com a Conversions API)
 *   Contact         → clicou em qualquer botão de WhatsApp
 */

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1148201590991632";

type Fbq = ((...args: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[] };

declare global {
  interface Window {
    fbq?: Fbq;
  }
}

const fbq = (...args: unknown[]) => {
  if (typeof window !== "undefined" && typeof window.fbq === "function") window.fbq(...args);
};

export function track(evento: string, params?: Record<string, unknown>, eventID?: string) {
  fbq("track", evento, params ?? {}, eventID ? { eventID } : undefined);
}

export function trackCustom(evento: string, params?: Record<string, unknown>) {
  fbq("trackCustom", evento, params ?? {});
}

/** Correspondência avançada: o Pixel faz o hash (SHA-256) no navegador antes de enviar. */
export function setUserData(d: {
  email?: string;
  celular?: string;
  nome?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  nascimento?: string;
}) {
  const [fn, ...resto] = (d.nome || "").trim().toLowerCase().split(/\s+/);
  const nasc = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d.nascimento || "");
  const dados: Record<string, string> = { country: "br" };
  if (d.email) dados.em = d.email.trim().toLowerCase();
  if (d.celular) dados.ph = "55" + d.celular.replace(/\D/g, "");
  if (fn) dados.fn = fn;
  if (resto.length) dados.ln = resto[resto.length - 1];
  if (d.cidade) dados.ct = d.cidade.toLowerCase().replace(/\s+/g, "");
  if (d.uf) dados.st = d.uf.toLowerCase();
  if (d.cep) dados.zp = d.cep.replace(/\D/g, "");
  if (nasc) dados.db = `${nasc[3]}${nasc[2]}${nasc[1]}`;
  fbq("init", META_PIXEL_ID, dados);
}

/** UTMs + click IDs da primeira visita (guardados na sessão para não se perderem). */
export function getOrigem(): string {
  if (typeof window === "undefined") return "";
  const atual = window.location.search.slice(1);
  try {
    const salvo = sessionStorage.getItem("ap_origem");
    if (atual && /utm_|fbclid|gclid/.test(atual)) {
      sessionStorage.setItem("ap_origem", atual);
      return atual.slice(0, 300);
    }
    return (salvo || atual).slice(0, 300);
  } catch {
    return atual.slice(0, 300);
  }
}
