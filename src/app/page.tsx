import Image from "next/image";
import LoanForm from "@/components/LoanForm";
import FloatingCta from "@/components/FloatingCta";

/**
 * DEPOIMENTOS: preencha SOMENTE com depoimentos reais e autorizados pelos clientes
 * (nome/inicial, cidade e texto). A seção só aparece quando houver itens aqui.
 */
const DEPOIMENTOS: { nome: string; cidade: string; texto: string }[] = [];

const PROVAS = [
  { numero: "R$ 400 mil+", texto: "em créditos aprovados de janeiro a junho" },
  { numero: "1 a 1", texto: "atendimento direto com especialista, sem robô" },
  { numero: "100%", texto: "online — simule e envie tudo pelo celular" },
  { numero: "R$ 0", texto: "cobrado antecipadamente. Nunca." },
];

const USOS = [
  { icone: "💳", t: "Quitar dívidas caras", d: "Troque cartão e cheque especial por uma parcela fixa que cabe no bolso." },
  { icone: "🏥", t: "Emergências", d: "Saúde, conserto ou imprevisto — resolva agora, sem passar aperto." },
  { icone: "🏠", t: "Reformar a casa", d: "Aquela obra que você vem adiando pode começar este mês." },
  { icone: "📈", t: "Investir no seu negócio", d: "Estoque, equipamento ou capital de giro para crescer." },
  { icone: "🎓", t: "Estudos", d: "Curso, faculdade ou especialização para aumentar sua renda." },
  { icone: "✨", t: "Realizar um sonho", d: "Viagem, casamento, festa — o momento é agora." },
];

const COMPARATIVO = [
  ["Atendimento", "Fila, ligação e robô", "Especialista direto no seu WhatsApp"],
  ["Burocracia", "Agência, papelada, idas e vindas", "Tudo online, em minutos"],
  ["Análise", "Padrão, só olha o score", "Personalizada para o seu momento"],
  ["Transparência", "Letras miúdas", "Taxa e CET claros antes de assinar"],
  ["Nome negativado", "Geralmente \"não\" de cara", "Analisamos o seu caso mesmo assim"],
];

const PASSOS = [
  { n: "01", t: "Simule em 1 minuto", d: "Escolha o valor e o número de parcelas. Grátis e sem compromisso." },
  { n: "02", t: "Envie seus dados", d: "Nome, CPF, WhatsApp e endereço. Tudo online e protegido pela LGPD." },
  { n: "03", t: "Receba sua proposta", d: "Um especialista analisa o seu perfil e te chama no WhatsApp." },
];

const GARANTIAS = [
  { t: "Zero taxa antecipada", d: "Nenhum valor é cobrado para liberar o empréstimo. Se pedirem, é golpe." },
  { t: "Você decide", d: "Simular não te obriga a nada. Só contrata se a proposta fizer sentido." },
  { t: "Tudo às claras", d: "Juros, IOF e CET apresentados antes de qualquer assinatura." },
  { t: "Dados protegidos", d: "Suas informações são usadas só para a análise, conforme a LGPD." },
];

const FAQ = [
  {
    p: "Estou com nome negativado ou score baixo. Posso solicitar?",
    r: "Pode, sim. Cada caso é analisado de forma individual — muitas pessoas que ouviram \"não\" no banco encontram uma alternativa com a gente. A aprovação depende da análise de crédito.",
  },
  {
    p: "Simular custa alguma coisa ou me obriga a contratar?",
    r: "Não. A simulação é 100% gratuita e sem compromisso. Você só contrata se gostar da proposta.",
  },
  {
    p: "Preciso pagar alguma taxa para liberar o dinheiro?",
    r: "Nunca. Não cobramos nenhum valor antecipado. Se alguém pedir depósito em nosso nome, desconfie e fale com a gente.",
  },
  {
    p: "Quais dados preciso informar?",
    r: "Nome completo, CPF, data de nascimento, WhatsApp e endereço. Documentos adicionais podem ser pedidos durante a análise.",
  },
  {
    p: "Quando vou saber a taxa e o valor da parcela?",
    r: "Na proposta, antes de assinar qualquer coisa, você recebe taxa de juros, IOF e Custo Efetivo Total (CET).",
  },
  {
    p: "Como recebo o dinheiro?",
    r: "Após a aprovação e assinatura do contrato, o valor é depositado na conta informada por você.",
  },
];

export default function Home() {
  return (
    <main className="relative overflow-x-clip pb-20 lg:pb-0">
      {/* Barra de confiança */}
      <div className="border-b border-gold/20 bg-gold/5 px-4 py-2 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-gold sm:text-xs">
        Simulação gratuita · Sem cobrança antecipada · Atendimento humano
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(closest-side, #c9a24b55, transparent)" }}
      />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Image
          src="/brand/logo-aridiego.jpg"
          alt="Aridiego Pereira – Assessoria Bancária"
          width={180}
          height={100}
          className="logo-blend h-14 w-auto"
          priority
        />
        <a
          href="#simular"
          className="rounded-xl border border-gold/60 px-4 py-2.5 text-sm font-semibold text-gold hover:bg-gold/10"
        >
          Simular grátis
        </a>
      </header>

      {/* HERO + FORM */}
      <section className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-2 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pt-8">
        <div className="lg:pt-4">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-gold">Empréstimo pessoal</p>
          <h1 className="mt-3 font-serif text-[2.6rem] font-semibold leading-[1.05] sm:text-6xl">
            Quanto custa <br />
            adiar um <span className="text-gold-gradient">sonho?</span>
          </h1>
          <div className="gold-divider my-6 w-40" />
          <p className="max-w-md text-lg leading-relaxed text-ink-2">
            Contas apertando? <strong className="font-semibold text-ink">Nome negativado ou score baixo?</strong>{" "}
            Não desista: analisamos o seu caso de forma individual, com um{" "}
            <strong className="font-semibold text-gold">especialista autorizado</strong> — sem fila de banco e sem
            burocracia.
          </p>

          <ul className="mt-7 space-y-3 text-ink-2">
            {[
              ["Proposta personalizada", "para o seu bolso"],
              ["Atendimento direto", "pelo WhatsApp"],
              ["Simulação grátis", "e sem compromisso"],
            ].map(([a, b]) => (
              <li key={a} className="flex items-center gap-3">
                <Check />
                <span>
                  <strong className="font-semibold text-ink">{a}</strong> {b}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-8 hidden items-center gap-4 rounded-2xl border border-line bg-surface/60 p-4 lg:flex">
            <span className="font-condensed text-4xl font-semibold text-gold-gradient">R$ 400 mil+</span>
            <span className="text-sm leading-snug text-ink-2">
              em créditos aprovados
              <br />
              só no primeiro semestre
            </span>
          </div>
        </div>

        <div id="simular" className="scroll-mt-4">
          <LoanForm />
        </div>
      </section>

      {/* PROVA SOCIAL / NÚMEROS */}
      <section className="border-y border-line bg-surface/50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4">
          {PROVAS.map((p) => (
            <div key={p.numero} className="text-center">
              <p className="font-condensed text-3xl font-semibold text-gold-gradient sm:text-4xl">{p.numero}</p>
              <p className="mx-auto mt-1 max-w-[16ch] text-sm text-ink-2">{p.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DOR / CUSTO DE ESPERAR */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-gold">A verdade que ninguém fala</p>
        <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight sm:text-5xl">
          Enquanto você espera, <br className="hidden sm:block" />
          <span className="text-gold-gradient">os juros não esperam.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-2">
          Rotativo do cartão e cheque especial estão entre os juros mais caros do país. Cada mês empurrando a dívida
          é dinheiro indo embora — e cada oportunidade perdida não volta.{" "}
          <strong className="text-ink">Organizar sua vida financeira pode começar hoje.</strong>
        </p>
        <a
          href="#simular"
          className="btn-gold mt-8 inline-flex h-14 items-center rounded-xl px-8 font-bold uppercase tracking-wider"
        >
          Quero sair do aperto ›
        </a>
      </section>

      {/* PARA QUE SERVE */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <h2 className="text-center font-serif text-3xl font-semibold sm:text-4xl">
          Para o que <span className="text-gold-gradient">você</span> precisa?
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {USOS.map((u) => (
            <a
              key={u.t}
              href="#simular"
              className="group card-gold rounded-2xl p-6 transition-colors hover:border-gold/70"
            >
              <span className="text-3xl" aria-hidden>
                {u.icone}
              </span>
              <h3 className="mt-3 text-lg font-semibold group-hover:text-gold">{u.t}</h3>
              <p className="mt-1 text-sm text-ink-2">{u.d}</p>
            </a>
          ))}
        </div>
      </section>

      {/* COMPARATIVO */}
      <section className="border-y border-line bg-surface/50">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <p className="text-center text-xs font-medium uppercase tracking-[0.22em] text-gold">Por que com a gente</p>
          <h2 className="mt-2 text-center font-serif text-3xl font-semibold sm:text-4xl">
            Banco tradicional <span className="text-ink-3">vs</span>{" "}
            <span className="text-gold-gradient">Aridiego Pereira</span>
          </h2>
          <div className="mt-10 overflow-hidden rounded-2xl border border-gold/30">
            <div className="grid grid-cols-[1fr_1fr] bg-bg text-xs font-semibold uppercase tracking-wider sm:grid-cols-[0.8fr_1fr_1fr]">
              <span className="hidden p-4 text-ink-3 sm:block" />
              <span className="p-4 text-ink-3">Banco tradicional</span>
              <span className="bg-gold/10 p-4 text-gold">Com a gente</span>
            </div>
            {COMPARATIVO.map(([item, banco, nos]) => (
              <div
                key={item}
                className="grid grid-cols-[1fr_1fr] border-t border-line text-sm sm:grid-cols-[0.8fr_1fr_1fr]"
              >
                <span className="col-span-2 px-4 pt-3 text-xs font-semibold uppercase tracking-wider text-ink-3 sm:col-span-1 sm:p-4 sm:text-sm sm:normal-case sm:tracking-normal sm:text-ink">
                  {item}
                </span>
                <span className="flex gap-2 p-4 text-ink-3">
                  <span className="text-error" aria-hidden>
                    ✕
                  </span>
                  {banco}
                </span>
                <span className="flex gap-2 bg-gold/5 p-4 text-ink">
                  <Check small />
                  {nos}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-center text-xs font-medium uppercase tracking-[0.22em] text-gold">Como funciona</p>
        <h2 className="mt-2 text-center font-serif text-3xl font-semibold sm:text-4xl">
          3 passos e <span className="text-gold-gradient">pronto</span>
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PASSOS.map((p) => (
            <div key={p.n} className="card-gold rounded-2xl p-6">
              <span className="font-condensed text-4xl font-semibold text-gold-gradient">{p.n}</span>
              <h3 className="mt-2 text-lg font-semibold">{p.t}</h3>
              <p className="mt-1 text-ink-2">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ESPECIALISTA (autoridade) */}
      <section className="border-y border-line bg-surface/50">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-2xl border border-gold/30">
            <Image
              src="/brand/aridiego.jpg"
              alt="Aridiego Pereira, especialista em crédito"
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-cover object-top"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-bg to-transparent" />
            <span className="absolute bottom-4 left-4 rounded-full border border-gold/50 bg-bg/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold">
              Especialista autorizado
            </span>
          </div>
          <div className="border-l border-gold/50 pl-6">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-gold">Quem vai te atender</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">
              Atendimento de <span className="text-gold-gradient">gente</span>, não de robô.
            </h2>
            <blockquote className="mt-5 font-serif text-xl italic leading-relaxed text-ink">
              “Meu trabalho é encontrar a melhor saída para o seu momento — com clareza, sem letras miúdas e sem
              te deixar no vácuo.”
            </blockquote>
            <p className="mt-2 text-sm text-gold">— Aridiego Pereira</p>
            <p className="mt-5 text-ink-2">
              Mais de <strong className="text-gold">R$ 400 mil em créditos aprovados</strong> no primeiro semestre.
              Você fala direto com quem entende do assunto e recebe uma proposta pensada para você.
            </p>
            <a
              href="#simular"
              className="btn-gold mt-6 inline-flex h-14 items-center rounded-xl px-8 font-bold uppercase tracking-wider"
            >
              Falar com especialista
            </a>
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS (só aparece com depoimentos reais) */}
      {DEPOIMENTOS.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center font-serif text-3xl font-semibold sm:text-4xl">
            Quem confiou, <span className="text-gold-gradient">recomenda</span>
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {DEPOIMENTOS.map((d) => (
              <figure key={d.nome} className="card-gold rounded-2xl p-6">
                <p className="text-gold" aria-label="5 estrelas">
                  ★★★★★
                </p>
                <blockquote className="mt-3 text-ink-2">“{d.texto}”</blockquote>
                <figcaption className="mt-4 text-sm font-semibold">
                  {d.nome} <span className="font-normal text-ink-3">· {d.cidade}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* GARANTIAS (redução de risco) */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-center text-xs font-medium uppercase tracking-[0.22em] text-gold">
          Nosso compromisso com você
        </p>
        <h2 className="mt-2 text-center font-serif text-3xl font-semibold sm:text-4xl">
          Seguro do começo <span className="text-gold-gradient">ao fim</span>
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GARANTIAS.map((g) => (
            <div key={g.t} className="rounded-2xl border border-line bg-surface p-6">
              <ShieldIcon />
              <h3 className="mt-3 font-semibold">{g.t}</h3>
              <p className="mt-1 text-sm text-ink-2">{g.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ (quebra de objeções) */}
      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <h2 className="text-center font-serif text-3xl font-semibold">Ainda com dúvida?</h2>
        <div className="mt-8 space-y-3">
          {FAQ.map((f) => (
            <details key={f.p} className="group rounded-xl border border-line bg-surface p-5 open:border-gold/40">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {f.p}
                <span className="text-xl text-gold transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-ink-2">{f.r}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative overflow-hidden border-t border-gold/30">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{ background: "radial-gradient(ellipse at center, #c9a24b33, transparent 60%)" }}
        />
        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <h2 className="font-serif text-4xl font-semibold leading-tight sm:text-5xl">
            Daqui a um mês, você vai querer <span className="text-gold-gradient">ter começado hoje.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-ink-2">
            A simulação leva menos de 2 minutos, é gratuita e não te obriga a nada.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#simular"
              className="btn-gold inline-flex h-14 w-full items-center justify-center rounded-xl px-8 font-bold uppercase tracking-wider sm:w-auto"
            >
              Simular agora — é grátis
            </a>
          </div>
        </div>
      </section>

      <footer id="privacidade" className="border-t border-line">
        <div className="gold-bar" />
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-10 text-xs leading-relaxed text-ink-3 sm:px-6">
          <Image src="/brand/monograma-ap.jpg" alt="AP" width={60} height={55} className="logo-blend h-10 w-auto" />
          <p>
            Aridiego Pereira Assessoria Bancária atua como correspondente/intermediador de crédito e não é
            instituição financeira. [Inserir razão social, CNPJ e instituição(ões) parceira(s).] Todas as
            solicitações estão sujeitas à análise e aprovação de crédito pela instituição financeira. Taxas,
            prazos e Custo Efetivo Total (CET) variam conforme o perfil e são informados antes da contratação.
          </p>
          <p>
            <strong className="text-ink-2">Não cobramos nenhum valor antecipado</strong> para liberação de
            empréstimo. Seus dados são tratados conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).
          </p>
          <p>WhatsApp: (86) 9 9513-9158 · © 2026 Aridiego Pereira</p>
        </div>
      </footer>

      <FloatingCta />
    </main>
  );
}

function Check({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full border border-gold/60 text-gold ${
        small ? "mt-0.5 h-4 w-4" : "h-6 w-6"
      }`}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className={small ? "h-2.5 w-2.5" : "h-3.5 w-3.5"} fill="none" stroke="currentColor" strokeWidth={3}>
        <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 text-gold" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
