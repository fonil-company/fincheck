"use client";

import { useRef, useState } from "react";
import {
  Errors,
  Lead,
  LEAD_VAZIO,
  PRAZOS,
  validarConsentimento,
  validarDadosPessoais,
  validarEndereco,
  validarSimulacao,
  VALOR_MAX,
  VALOR_MIN,
  VALOR_PASSO,
  WHATSAPP_NUMERO,
} from "@/lib/lead";
import { getOrigem, setUserData, track, trackCustom } from "@/lib/tracking";
import { brl, maskCEP, maskCPF, maskDate, maskPhone, onlyDigits, UFS } from "@/lib/validators";

const ETAPAS = ["Simulação", "Seus dados", "Endereço", "Revisão"] as const;

const MOTIVOS = [
  "Quitar dívidas",
  "Reforma da casa",
  "Saúde",
  "Educação",
  "Investir no meu negócio",
  "Viagem / lazer",
  "Outro",
];

const INCENTIVO = [
  "",
  `✓ Simulação salva! Agora só precisamos saber quem é você.`,
  "Falta pouco! Último dado antes da revisão.",
  "Pronto! Confira tudo e envie — um especialista analisa seu caso.",
];

const MICROCOPY = [
  "✓ Grátis  ✓ Sem compromisso  ✓ Leva menos de 2 minutos",
  "🔒 Seus dados são protegidos pela LGPD",
  "🔒 Usamos o endereço apenas para a análise de crédito",
  "Nunca cobramos nenhum valor antecipado para liberar empréstimo",
];

const VALIDADORES = [validarSimulacao, validarDadosPessoais, validarEndereco, validarConsentimento];

export default function LoanForm() {
  const [etapa, setEtapa] = useState(0);
  const [lead, setLead] = useState<Lead>(LEAD_VAZIO);
  const [erros, setErros] = useState<Errors>({});
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState("");
  const [protocolo, setProtocolo] = useState("");
  const topoRef = useRef<HTMLDivElement>(null);
  const numeroRef = useRef<HTMLInputElement>(null);
  const simulacaoTocada = useRef(false);

  const marcarSimulacao = () => {
    if (simulacaoTocada.current) return;
    simulacaoTocada.current = true;
    trackCustom("SimulacaoAjustada");
  };

  const set = <K extends keyof Lead>(campo: K, valor: Lead[K]) => {
    setLead((l) => ({ ...l, [campo]: valor }));
    if (erros[campo]) setErros((e) => ({ ...e, [campo]: undefined }));
  };

  const irPara = (n: number) => {
    setEtapa(n);
    setErros({});
    requestAnimationFrame(() => topoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const avancar = async () => {
    const e = VALIDADORES[etapa](lead);
    if (Object.keys(e).length) {
      setErros(e);
      const primeiro = Object.keys(e)[0];
      document.getElementById(`f-${primeiro}`)?.focus();
      return;
    }
    if (etapa < ETAPAS.length - 1) {
      const funil = { value: lead.valor, currency: "BRL", content_name: "Empréstimo pessoal", parcelas: lead.prazo };
      if (etapa === 0) track("InitiateCheckout", { ...funil, content_category: lead.motivo });
      if (etapa === 1) track("AddPaymentInfo", funil);
      if (etapa === 2) track("SubmitApplication", funil);
      trackCustom("FunilEtapa", { etapa: etapa + 2, nome_etapa: ETAPAS[etapa + 1], value: lead.valor, currency: "BRL" });
      return irPara(etapa + 1);
    }
    await enviar();
  };

  const enviar = async () => {
    setEnviando(true);
    setErroEnvio("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...lead, origem: getOrigem() }),
      });
      // a resposta pode não ser JSON (ex.: página de erro do proxy) — nunca quebrar a tela
      let data: { protocolo?: string; mensagem?: string; erros?: Errors } = {};
      try {
        data = JSON.parse(await res.text());
      } catch {}
      if (!res.ok || !data.protocolo) {
        if (data.erros) setErros(data.erros);
        throw new Error(
          data.mensagem ||
            "Não conseguimos registrar agora. Tente novamente em instantes ou fale com a gente pelo WhatsApp.",
        );
      }
      const protocoloRecebido = data.protocolo;
      setProtocolo(protocoloRecebido);
      setUserData(lead);
      track(
        "Lead",
        {
          value: lead.valor,
          currency: "BRL",
          content_name: "Empréstimo pessoal",
          content_category: lead.motivo,
          parcelas: lead.prazo,
        },
        protocoloRecebido,
      );
      irPara(ETAPAS.length);
    } catch (err) {
      setErroEnvio(
        err instanceof Error && !/JSON|token|fetch/i.test(err.message)
          ? err.message
          : "Não conseguimos registrar agora. Tente novamente em instantes ou fale com a gente pelo WhatsApp.",
      );
    } finally {
      setEnviando(false);
    }
  };

  const buscarCep = async (cep: string) => {
    const d = onlyDigits(cep);
    if (d.length !== 8) return;
    setBuscandoCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${d}/json/`);
      const data = await res.json();
      if (data.erro) {
        setErros((e) => ({ ...e, cep: "CEP não encontrado. Preencha o endereço manualmente." }));
        return;
      }
      setLead((l) => ({
        ...l,
        logradouro: data.logradouro || l.logradouro,
        bairro: data.bairro || l.bairro,
        cidade: data.localidade || l.cidade,
        uf: data.uf || l.uf,
      }));
      setErros((e) => ({ ...e, cep: undefined, logradouro: undefined, bairro: undefined, cidade: undefined, uf: undefined }));
      numeroRef.current?.focus();
    } catch {
      // Sem internet/ViaCEP fora do ar: usuário preenche manualmente.
    } finally {
      setBuscandoCep(false);
    }
  };

  const ajustarValor = (delta: number) => {
    marcarSimulacao();
    set("valor", Math.min(VALOR_MAX, Math.max(VALOR_MIN, lead.valor + delta)));
  };

  if (etapa === ETAPAS.length) {
    const msg = encodeURIComponent(
      `Olá, Aridiego! Acabei de fazer minha solicitação pelo site.\nProtocolo: ${protocolo}\nNome: ${lead.nome}\nValor: ${brl(lead.valor)} em ${lead.prazo}x`,
    );
    return (
      <div ref={topoRef} className="card-gold rounded-2xl p-6 sm:p-8 text-center scroll-mt-6">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-gold/60 text-gold">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">Solicitação recebida</p>
        <h2 className="mt-2 font-serif text-3xl font-semibold">
          Obrigado, {lead.nome.trim().split(/\s+/)[0]}!
        </h2>
        <p className="mt-3 text-ink-2">
          Seu protocolo é <strong className="text-ink">{protocolo}</strong>. Nossa equipe vai analisar seu
          perfil e entrar em contato pelo WhatsApp {lead.celular}.
        </p>
        <a
          href={`https://wa.me/${WHATSAPP_NUMERO}?text=${msg}`}
          data-origem="obrigado"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gold mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl font-bold uppercase tracking-wider"
        >
          Agilizar pelo WhatsApp
        </a>
        <p className="mt-4 text-xs text-ink-3">
          Nunca pedimos depósito antecipado para liberar empréstimo.
        </p>
      </div>
    );
  }

  return (
    <div ref={topoRef} className="card-gold rounded-2xl p-5 sm:p-8 scroll-mt-6">
      {/* Progresso */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium uppercase tracking-[0.18em] text-gold">
            Etapa {etapa + 1} de {ETAPAS.length}
          </span>
          <span className="text-ink-2">{ETAPAS[etapa]}</span>
        </div>
        <div className="flex gap-1.5" aria-hidden>
          {ETAPAS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i <= etapa ? "bg-gold" : "bg-line"}`}
            />
          ))}
        </div>
      </div>

      {etapa > 0 && (
        <p className="mb-5 rounded-lg border border-gold/25 bg-gold/5 px-3 py-2 text-sm text-ink-2">
          {etapa === 1 ? (
            <>
              ✓ Ótima escolha: <strong className="text-gold">{brl(lead.valor)}</strong> em {lead.prazo}x. Agora
              só precisamos saber quem é você.
            </>
          ) : (
            INCENTIVO[etapa]
          )}
        </p>
      )}

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          avancar();
        }}
      >
        {etapa === 0 && (
          <fieldset className="space-y-6">
            <legend className="mb-1 font-serif text-2xl font-semibold sm:text-3xl">
              De quanto você <span className="text-gold-gradient">precisa</span>?
            </legend>

            <div>
              <div className="flex items-center gap-3 rounded-2xl border border-line bg-bg p-3">
                <button
                  type="button"
                  aria-label="Diminuir valor"
                  onClick={() => ajustarValor(-VALOR_PASSO)}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/50 text-2xl text-gold hover:bg-gold/10"
                >
                  −
                </button>
                <output
                  id="f-valor"
                  className="flex-1 text-center font-condensed text-4xl font-semibold tracking-wide sm:text-5xl"
                >
                  {brl(lead.valor)}
                </output>
                <button
                  type="button"
                  aria-label="Aumentar valor"
                  onClick={() => ajustarValor(VALOR_PASSO)}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/50 text-2xl text-gold hover:bg-gold/10"
                >
                  +
                </button>
              </div>
              <input
                type="range"
                aria-label="Valor do empréstimo"
                className="range-gold mt-4 w-full"
                min={VALOR_MIN}
                max={VALOR_MAX}
                step={VALOR_PASSO}
                value={lead.valor}
                onChange={(e) => {
                  marcarSimulacao();
                  set("valor", Number(e.target.value));
                }}
              />
              <div className="flex justify-between text-xs text-ink-3">
                <span>{brl(VALOR_MIN)}</span>
                <span>{brl(VALOR_MAX)}</span>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-ink-2">Em quantas parcelas?</p>
              <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Prazo">
                {PRAZOS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={lead.prazo === p}
                    onClick={() => {
                      marcarSimulacao();
                      set("prazo", p);
                    }}
                    className={`h-14 rounded-xl border font-condensed text-2xl font-medium transition-colors ${
                      lead.prazo === p
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-line bg-surface text-ink hover:border-gold/50"
                    }`}
                  >
                    {p}x
                  </button>
                ))}
              </div>
            </div>

            <Field label="Para que é o dinheiro? *" id="motivo" erro={erros.motivo}>
              <select
                id="f-motivo"
                value={lead.motivo}
                onChange={(e) => set("motivo", e.target.value)}
                className={inputCls(!!erros.motivo)}
                aria-invalid={!!erros.motivo}
              >
                <option value="">Selecione</option>
                {MOTIVOS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </Field>
          </fieldset>
        )}

        {etapa === 1 && (
          <fieldset className="space-y-4">
            <legend className="mb-3 font-serif text-2xl font-semibold sm:text-3xl">
              Agora, <span className="text-gold-gradient">seus dados</span>
            </legend>
            <Field label="Nome completo *" id="nome" erro={erros.nome}>
              <input
                id="f-nome"
                autoComplete="name"
                value={lead.nome}
                onChange={(e) => set("nome", e.target.value)}
                placeholder="Como está no seu documento"
                className={inputCls(!!erros.nome)}
                aria-invalid={!!erros.nome}
              />
            </Field>
            <Field label="CPF *" id="cpf" erro={erros.cpf}>
              <input
                id="f-cpf"
                inputMode="numeric"
                value={lead.cpf}
                onChange={(e) => set("cpf", maskCPF(e.target.value))}
                placeholder="000.000.000-00"
                className={inputCls(!!erros.cpf)}
                aria-invalid={!!erros.cpf}
              />
            </Field>
            <Field label="WhatsApp (com DDD) *" id="celular" erro={erros.celular}>
              <input
                id="f-celular"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={lead.celular}
                onChange={(e) => set("celular", maskPhone(e.target.value))}
                placeholder="(86) 99999-9999"
                className={inputCls(!!erros.celular)}
                aria-invalid={!!erros.celular}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Data de nascimento *" id="nascimento" erro={erros.nascimento}>
                <input
                  id="f-nascimento"
                  inputMode="numeric"
                  autoComplete="bday"
                  value={lead.nascimento}
                  onChange={(e) => set("nascimento", maskDate(e.target.value))}
                  placeholder="dd/mm/aaaa"
                  className={inputCls(!!erros.nascimento)}
                  aria-invalid={!!erros.nascimento}
                />
              </Field>
              <Field label="E-mail (opcional)" id="email" erro={erros.email}>
                <input
                  id="f-email"
                  type="email"
                  autoComplete="email"
                  value={lead.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="voce@email.com"
                  className={inputCls(!!erros.email)}
                  aria-invalid={!!erros.email}
                />
              </Field>
            </div>
            <p className="flex items-center gap-2 text-xs text-ink-3">
              <LockIcon /> Seus dados são protegidos e usados apenas para a análise de crédito.
            </p>
          </fieldset>
        )}

        {etapa === 2 && (
          <fieldset className="space-y-4">
            <legend className="mb-3 font-serif text-2xl font-semibold sm:text-3xl">
              Onde você <span className="text-gold-gradient">mora</span>?
            </legend>
            <Field label="CEP *" id="cep" erro={erros.cep} dica={buscandoCep ? "Buscando endereço…" : undefined}>
              <input
                id="f-cep"
                inputMode="numeric"
                autoComplete="postal-code"
                value={lead.cep}
                onChange={(e) => {
                  const v = maskCEP(e.target.value);
                  set("cep", v);
                  if (onlyDigits(v).length === 8) buscarCep(v);
                }}
                placeholder="00000-000"
                className={inputCls(!!erros.cep)}
                aria-invalid={!!erros.cep}
              />
            </Field>
            <Field label="Rua / Avenida *" id="logradouro" erro={erros.logradouro}>
              <input
                id="f-logradouro"
                autoComplete="address-line1"
                value={lead.logradouro}
                onChange={(e) => set("logradouro", e.target.value)}
                className={inputCls(!!erros.logradouro)}
                aria-invalid={!!erros.logradouro}
              />
            </Field>
            <div className="grid grid-cols-[1fr_2fr] gap-4">
              <Field label="Número *" id="numero" erro={erros.numero}>
                <input
                  id="f-numero"
                  ref={numeroRef}
                  value={lead.numero}
                  onChange={(e) => set("numero", e.target.value)}
                  className={inputCls(!!erros.numero)}
                  aria-invalid={!!erros.numero}
                />
              </Field>
              <Field label="Complemento *" id="complemento" erro={erros.complemento}>
                <input
                  id="f-complemento"
                  autoComplete="address-line2"
                  value={lead.complemento}
                  onChange={(e) => set("complemento", e.target.value)}
                  placeholder="Apto, casa, bloco ou Não tem"
                  className={inputCls(!!erros.complemento)}
                  aria-invalid={!!erros.complemento}
                />
              </Field>
            </div>
            <Field label="Bairro *" id="bairro" erro={erros.bairro}>
              <input
                id="f-bairro"
                value={lead.bairro}
                onChange={(e) => set("bairro", e.target.value)}
                className={inputCls(!!erros.bairro)}
                aria-invalid={!!erros.bairro}
              />
            </Field>
            <div className="grid grid-cols-[2fr_1fr] gap-4">
              <Field label="Cidade *" id="cidade" erro={erros.cidade}>
                <input
                  id="f-cidade"
                  autoComplete="address-level2"
                  value={lead.cidade}
                  onChange={(e) => set("cidade", e.target.value)}
                  className={inputCls(!!erros.cidade)}
                  aria-invalid={!!erros.cidade}
                />
              </Field>
              <Field label="UF *" id="uf" erro={erros.uf}>
                <select
                  id="f-uf"
                  autoComplete="address-level1"
                  value={lead.uf}
                  onChange={(e) => set("uf", e.target.value)}
                  className={inputCls(!!erros.uf)}
                  aria-invalid={!!erros.uf}
                >
                  <option value="">—</option>
                  {UFS.map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </Field>
            </div>
          </fieldset>
        )}

        {etapa === 3 && (
          <fieldset className="space-y-5">
            <legend className="mb-3 font-serif text-2xl font-semibold sm:text-3xl">
              Confira e <span className="text-gold-gradient">envie</span>
            </legend>
            <Resumo titulo="Simulação" onEditar={() => irPara(0)}>
              <strong className="text-gold">{brl(lead.valor)}</strong> em {lead.prazo}x
              {lead.motivo && <> · {lead.motivo}</>}
            </Resumo>
            <Resumo titulo="Seus dados" onEditar={() => irPara(1)}>
              {lead.nome}
              <br />
              CPF {lead.cpf} · {lead.celular}
              {lead.email && (
                <>
                  <br />
                  {lead.email}
                </>
              )}
            </Resumo>
            <Resumo titulo="Endereço" onEditar={() => irPara(2)}>
              {lead.logradouro}, {lead.numero}
              {lead.complemento && ` – ${lead.complemento}`}
              <br />
              {lead.bairro} · {lead.cidade}/{lead.uf} · CEP {lead.cep}
            </Resumo>

            <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-2">
              <input
                id="f-consentimento"
                type="checkbox"
                checked={lead.consentimento}
                onChange={(e) => set("consentimento", e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[#c9a24b]"
              />
              <span>
                Autorizo o uso dos meus dados para análise de crédito e contato, conforme a{" "}
                <a href="#privacidade" className="text-gold underline">
                  Política de Privacidade
                </a>{" "}
                (LGPD), incluindo consulta a órgãos de proteção ao crédito e ao SCR do Banco Central.
              </span>
            </label>
            {erros.consentimento && <p className="text-sm text-error">{erros.consentimento}</p>}
            {erroEnvio && (
              <p role="alert" className="rounded-lg border border-error/40 bg-error/10 p-3 text-sm text-error">
                {erroEnvio}
              </p>
            )}
          </fieldset>
        )}

        <div className="mt-8 flex gap-3">
          {etapa > 0 && (
            <button
              type="button"
              onClick={() => irPara(etapa - 1)}
              className="h-14 rounded-xl border border-gold/60 px-5 font-semibold text-gold hover:bg-gold/10"
            >
              Voltar
            </button>
          )}
          <button
            type="submit"
            disabled={enviando}
            className="btn-gold flex h-14 flex-1 items-center justify-center gap-2 rounded-xl font-bold uppercase tracking-wider"
          >
            {etapa === 0
              ? "Quero minha proposta"
              : etapa === ETAPAS.length - 1
                ? enviando
                  ? "Enviando…"
                  : "Enviar solicitação"
                : "Continuar"}
            {!enviando && <span aria-hidden>›</span>}
          </button>
        </div>
        <p className="mt-3 text-center text-xs text-ink-3">{MICROCOPY[etapa]}</p>
      </form>
    </div>
  );
}

function inputCls(erro: boolean) {
  return `h-14 w-full rounded-xl border bg-surface px-4 text-base text-ink placeholder:text-ink-3 outline-none transition focus:border-gold focus:ring-3 focus:ring-gold/25 ${
    erro ? "border-error" : "border-line"
  }`;
}

function Field({
  label,
  id,
  erro,
  dica,
  children,
}: {
  label: string;
  id: string;
  erro?: string;
  dica?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={`f-${id}`} className="mb-1.5 block text-sm font-medium text-ink-2">
        {label}
      </label>
      {children}
      {erro ? (
        <p className="mt-1.5 text-sm text-error">{erro}</p>
      ) : dica ? (
        <p className="mt-1.5 text-sm text-gold">{dica}</p>
      ) : null}
    </div>
  );
}

function Resumo({ titulo, onEditar, children }: { titulo: string; onEditar: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-bg p-4">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-gold">{titulo}</span>
        <button type="button" onClick={onEditar} className="text-xs text-ink-2 underline hover:text-gold">
          Editar
        </button>
      </div>
      <p className="text-sm leading-relaxed text-ink">{children}</p>
    </div>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-gold" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
