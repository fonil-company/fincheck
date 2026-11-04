# Fincheck – Empréstimo Pessoal (Aridiego Pereira Assessoria Bancária)

Landing page de captação de leads para empréstimo pessoal, com formulário em etapas,
gravação em Google Sheets (Apps Script) e rastreamento Meta Pixel + Conversions API.

## Rodar local
```bash
npm install
cp .env.example .env.local   # preencha os valores
npm run dev                  # http://localhost:3000
```

## Variáveis de ambiente
| Variável | Para quê |
|---|---|
| `GOOGLE_SCRIPT_URL` | URL `/exec` do Apps Script (App da Web) |
| `GOOGLE_SCRIPT_TOKEN` | Senha compartilhada com o Apps Script (`TOKEN_NO_CODIGO`) |
| `NEXT_PUBLIC_META_PIXEL_ID` | ID do Meta Pixel |
| `META_CAPI_TOKEN` | (opcional) token da Conversions API |
| `META_TEST_EVENT_CODE` | (opcional) código de teste de eventos |

## Estrutura
- `src/components/LoanForm.tsx` – formulário em 4 etapas (simulação, dados, endereço, revisão)
- `src/app/api/leads/route.ts` – valida e envia o lead para a planilha + Conversions API
- `src/lib/tracking.ts` / `src/components/MetaPixel.tsx` – eventos do funil (Meta Pixel)
- `apps-script/` – código do Apps Script e passo a passo da planilha
- `brand/identidade-visual.json` – identidade visual (cores, fontes, componentes, tom de voz)
