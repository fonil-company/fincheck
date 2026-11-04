import { createHash } from "node:crypto";
import type { Lead } from "./lead";
import { META_PIXEL_ID } from "./tracking";

const API_VERSION = process.env.META_API_VERSION || "v24.0";

const sha = (v: string) => createHash("sha256").update(v).digest("hex");
const norm = (v: string) =>
  v
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

function cookie(header: string | null, nome: string) {
  const m = header?.match(new RegExp(`(?:^|;\\s*)${nome}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : undefined;
}

/**
 * Envia o evento Lead pela Conversions API (servidor → Meta).
 * Mesmo event_id do Pixel (protocolo) → a Meta deduplica e mantém um só evento.
 * Só roda se META_CAPI_TOKEN estiver configurado.
 */
export async function enviarLeadMeta(lead: Lead, protocolo: string, req: Request) {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) return;

  const cookies = req.headers.get("cookie");
  const fbp = cookie(cookies, "_fbp");
  let fbc = cookie(cookies, "_fbc");
  const fbclid = new URLSearchParams(lead.origem).get("fbclid");
  if (!fbc && fbclid) fbc = `fb.1.${Date.now()}.${fbclid}`;

  const partes = norm(lead.nome).split(/\s+/);
  const nasc = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(lead.nascimento);
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || undefined;

  const user_data: Record<string, unknown> = {
    ph: [sha("55" + lead.celular.replace(/\D/g, ""))],
    fn: [sha(partes[0])],
    ln: [sha(partes[partes.length - 1])],
    ct: [sha(norm(lead.cidade).replace(/[^a-z]/g, ""))],
    st: [sha(lead.uf.toLowerCase())],
    zp: [sha(lead.cep.replace(/\D/g, ""))],
    country: [sha("br")],
    client_ip_address: ip,
    client_user_agent: req.headers.get("user-agent") || undefined,
    fbp,
    fbc,
  };
  if (lead.email) user_data.em = [sha(lead.email.trim().toLowerCase())];
  if (nasc) user_data.db = [sha(`${nasc[3]}${nasc[2]}${nasc[1]}`)];

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: protocolo,
        action_source: "website",
        event_source_url: req.headers.get("referer") || undefined,
        user_data,
        custom_data: {
          value: lead.valor,
          currency: "BRL",
          content_name: "Empréstimo pessoal",
          content_category: lead.motivo,
          parcelas: lead.prazo,
        },
      },
    ],
  };
  if (process.env.META_TEST_EVENT_CODE) body.test_event_code = process.env.META_TEST_EVENT_CODE;

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!res.ok) console.error("[meta-capi] erro", res.status, await res.text());
  } catch (err) {
    console.error("[meta-capi] falha", err);
  }
}
