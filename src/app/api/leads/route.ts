import { after } from "next/server";
import { Lead, LEAD_VAZIO, validarTudo } from "@/lib/lead";
import { enviarLeadMeta } from "@/lib/meta-capi";

export async function POST(request: Request) {
  let body: Partial<Lead>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ mensagem: "Requisição inválida." }, { status: 400 });
  }

  const lead = { ...LEAD_VAZIO } as Lead;
  for (const k of Object.keys(LEAD_VAZIO) as (keyof Lead)[]) {
    const v = body?.[k];
    if (typeof LEAD_VAZIO[k] === "string") (lead[k] as string) = typeof v === "string" ? v.trim().slice(0, 300) : "";
  }
  lead.valor = Number(body?.valor);
  lead.prazo = Number(body?.prazo);
  lead.consentimento = body?.consentimento === true;

  const erros = validarTudo(lead);
  if (Object.keys(erros).length) {
    return Response.json({ mensagem: "Confira os campos destacados.", erros }, { status: 422 });
  }

  const protocolo = `AP${Date.now().toString(36).toUpperCase()}`;
  const url = process.env.GOOGLE_SCRIPT_URL;
  const token = process.env.GOOGLE_SCRIPT_TOKEN;

  if (!url || !token) {
    console.error("[lead] GOOGLE_SCRIPT_URL/GOOGLE_SCRIPT_TOKEN não configurados — lead não foi salvo.");
    return Response.json(
      { mensagem: "Não foi possível registrar sua solicitação agora. Fale com a gente pelo WhatsApp." },
      { status: 500 },
    );
  }

  try {
    // O Apps Script responde com redirect 302; o fetch segue e lê o JSON final.
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...lead, protocolo, token }),
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) throw new Error(`Apps Script: ${res.status} ${JSON.stringify(data)}`);
  } catch (err) {
    console.error("[lead] falha ao gravar na planilha", protocolo, err);
    return Response.json(
      { mensagem: "Não foi possível registrar sua solicitação agora. Tente novamente em instantes." },
      { status: 502 },
    );
  }

  // Conversions API da Meta roda depois da resposta (não atrasa o usuário)
  after(() => enviarLeadMeta(lead, protocolo, request));

  return Response.json({ protocolo }, { status: 201 });
}
