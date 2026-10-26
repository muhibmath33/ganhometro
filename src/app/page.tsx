import { Calculator } from "@/components/Calculator";
import { Faq } from "@/components/Faq";
import { CardIcon, CheckIcon, ClockIcon, GuideIcon, ReworkIcon } from "@/components/icons";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { WaitlistForm } from "@/components/WaitlistForm";
import { calculate, formatMoney } from "@/lib/calc";
import { features } from "@/lib/content";

const EXAMPLE_RATE = "5,10";

// Hero example card. Numbers come from the same calculator logic, so they always agree with it.
const examples = [
  { name: "Plataforma A", listed: 25, received: 200, paid: 8, unpaid: 6 },
  { name: "Plataforma B", listed: 20, received: 200, paid: 10, unpaid: 1 },
].map((p) => {
  const { realBrl } = calculate({
    listed: String(p.listed),
    received: String(p.received),
    paid: String(p.paid),
    unpaid: String(p.unpaid),
    rate: EXAMPLE_RATE,
  });
  const paidPct = Math.round((p.paid / (p.paid + p.unpaid)) * 100);
  return {
    ...p,
    realBrl,
    paidPct,
    listedText: formatMoney("US$", p.listed) + "/h",
    detail: `${p.paid}h pagas · ${p.unpaid}h ${p.unpaid === 1 ? "não paga" : "não pagas"} · US$ ${p.received}`,
  };
});

const problems = [
  { Icon: GuideIcon, title: "Diretrizes e testes", text: "Horas lendo instruções e fazendo avaliações antes da primeira tarefa paga." },
  { Icon: ClockIcon, title: "Espera por tarefas", text: "Atualizando uma fila vazia, trocando de plataforma, esperando novidades." },
  { Icon: ReworkIcon, title: "Retrabalho", text: "Corrigir tarefas depois da revisão, ou trabalho que nunca é pago." },
  { Icon: CardIcon, title: "Pagamento atrasado", text: "Cada plataforma paga em um dia diferente. Fica difícil perceber quando algo não chegou." },
];

const steps = [
  { title: "Adicione suas plataformas", text: "Informe o valor anunciado e o dia de pagamento de cada uma. Leva uns cinco minutos." },
  { title: "Conte o tempo", text: "Um toque para começar. Marque se é tarefa paga ou tempo não pago, como diretrizes e espera." },
  { title: "Veja seu ganho real", text: "Registre os pagamentos e veja quanto cada plataforma paga de verdade, em reais, e quando algo atrasou." },
];

const taxPoints = [
  "Conversão com a cotação de compra correta do Banco Central",
  "Estimativa mensal: isento até R$ 5 mil, redução parcial até R$ 7.350",
  "Lembrete antes do último dia útil do mês seguinte",
];

const privacyPoints = [
  "Não guardamos conteúdo, prompts, respostas nem capturas de tela das tarefas.",
  "Nunca pedimos login das plataformas, senha do gov.br ou do banco.",
  "Exporte ou apague seus dados quando quiser, conforme a LGPD.",
  "Seus ganhos são privados. Nada é compartilhado sem a sua permissão.",
];

const freePlan = [
  "Cronômetro com tempo pago e não pago",
  "Até 2 plataformas",
  "Ganho real por hora em reais",
  "Resumo semanal",
];

const proPlan = [
  "Plataformas ilimitadas, ganho por projeto e histórico completo",
  "Detector de pagamento a menor e alerta de atraso",
  "Quanto você perde em câmbio e taxas (em breve)",
  "Alerta antes de passar dos R$ 5 mil, estimativa do carnê-leão e lembretes",
  "Alerta de queda de renda (em breve)",
  "Registro em PDF e mensagem de contestação em inglês",
  "INSS em dia e extensão automática (em breve)",
];

const h2 = "m-0 text-[34px] font-extrabold tracking-[-0.02em]";
const lead = "m-0 text-[17px] leading-[1.6] text-ink-soft";
const badge = "self-start rounded-full bg-brand-tint px-3 py-1.5 text-[13px] font-bold text-brand";
// Full literals so Tailwind can detect them; min(…,100%) avoids overflow on very narrow phones.
const autoGrid = {
  220: "grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))]",
  240: "grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))]",
  280: "grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))]",
  300: "grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))]",
};

export default function Home() {
  return (
    <>
      <SiteHeader home />

      <main>
        {/* Hero */}
        <section
          id="topo"
          className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-12 px-6 pt-[72px] pb-16"
        >
          <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-[22px]">
            <span className={badge}>
              Para quem treina IA na Outlier, DataAnnotation, Mercor e outras
            </span>
            <h1 className="m-0 text-[clamp(38px,12.5vw,50px)] leading-[1.06] font-extrabold tracking-[-0.03em]">
              Descubra quanto cada plataforma paga de verdade, por hora, em reais.
            </h1>
            <p className="m-0 text-[19px] leading-[1.55] text-ink-soft">
              Conte o tempo pago e o não pago (diretrizes, testes, espera), veja seu
              ganho real por hora e saiba quando um pagamento atrasou. Com estimativa
              do carnê-leão incluída.
            </p>
            <WaitlistForm
              source="hero"
              buttonLabel="Quero acesso antecipado"
              successText="Pronto! Avisaremos por e-mail quando o acesso abrir."
            />
            <span className="text-[13px] text-muted">
              Grátis no acesso antecipado. Nunca guardamos o conteúdo das suas tarefas.
            </span>
            <span className="text-[14px] text-ink-soft">
              Também serve para freelancers que recebem em dólar, como devs, designers e
              tradutores.
            </span>
          </div>

          <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-4 rounded-[18px] border border-line bg-white p-[22px] shadow-[0_12px_32px_rgba(19,32,27,0.08)]">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[16px] font-extrabold">Esta semana</span>
              <span className="text-[12px] text-muted">
                Exemplo · cotação ilustrativa {EXAMPLE_RATE}
              </span>
            </div>
            {examples.map((p) => (
              <div key={p.name} className="flex flex-col gap-2.5 rounded-[14px] bg-paper p-4">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="text-[15px] font-bold">{p.name}</span>
                  <span className="text-[13px] text-muted">anuncia {p.listedText}</span>
                </div>
                <div className="flex h-2.5 overflow-hidden rounded-full bg-line">
                  <div className="bg-brand" style={{ width: `${p.paidPct}%` }} />
                  <div className="bg-unpaid" style={{ width: `${100 - p.paidPct}%` }} />
                </div>
                <div className="flex flex-wrap justify-between gap-2 text-[13px] text-ink-soft">
                  <span>{p.detail}</span>
                  <span className="font-mono font-semibold text-ink">{p.realBrl}</span>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-3.5 text-[13px] text-ink-soft">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-[3px] bg-brand" />
                Tempo pago
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-[3px] bg-unpaid" />
                Tempo não pago
              </span>
            </div>
            <div className="rounded-[10px] bg-ink px-3 py-2.5 text-[13px] leading-[1.45] font-semibold text-white">
              A Plataforma A anuncia mais, mas a B pagou mais por hora de verdade.
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="border-y border-line bg-white">
          <div className="mx-auto flex max-w-[1120px] flex-col gap-7 px-6 py-16">
            <div className="flex max-w-[700px] flex-col gap-2.5">
              <h2 className={h2}>O valor anunciado não é o que você ganha.</h2>
              <p className={lead}>
                As plataformas pagam pelo tempo de tarefa. Todo o resto fica por sua
                conta, e quase ninguém mede.
              </p>
            </div>
            <div className={autoGrid[220]}>
              {problems.map(({ Icon, title, text }) => (
                <div key={title} className="flex flex-col gap-2.5 rounded-[14px] border border-line p-[22px]">
                  <Icon size={26} color="#B45309" />
                  <h3 className="m-0 text-[18px] font-bold">{title}</h3>
                  <p className="m-0 text-[15px] leading-[1.55] text-ink-soft">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Calculator */}
        <section id="calculadora" className="mx-auto flex max-w-[1120px] flex-col gap-6 px-6 py-16">
          <div className="flex max-w-[700px] flex-col gap-2.5">
            <span className={badge}>Grátis, sem cadastro</span>
            <h2 className={h2}>Calculadora de ganho real por hora</h2>
            <p className={lead}>
              Coloque os números de uma semana em uma plataforma e veja quanto ela
              pagou de verdade.
            </p>
          </div>
          <Calculator />
        </section>

        {/* How it works */}
        <section id="como" className="border-y border-line bg-white">
          <div className="mx-auto flex max-w-[1120px] flex-col gap-7 px-6 py-16">
            <h2 className={h2}>Como funciona</h2>
            <div className={autoGrid[240]}>
              {steps.map((s, i) => (
                <div key={s.title} className="flex flex-col gap-2.5 rounded-[14px] border border-line p-[22px]">
                  <span className="flex size-9 items-center justify-center rounded-full bg-brand font-extrabold text-white">
                    {i + 1}
                  </span>
                  <h3 className="m-0 text-[18px] font-bold">{s.title}</h3>
                  <p className="m-0 text-[15px] leading-[1.55] text-ink-soft">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="recursos" className="mx-auto flex max-w-[1120px] flex-col gap-7 px-6 py-16">
          <h2 className={h2}>Tudo em um lugar</h2>
          <div className={autoGrid[300]}>
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-3.5 rounded-[14px] border border-line bg-white p-5">
                <span className="flex size-10 flex-none items-center justify-center rounded-[10px] bg-brand-tint">
                  <CheckIcon color="#0B6B4F" strokeWidth={2.2} />
                </span>
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="m-0 text-[17px] font-bold">{f.title}</h3>
                    {f.soon && (
                      <span className="rounded-full bg-amber-tint px-2 py-0.5 text-[11px] font-bold tracking-[0.04em] text-amber-ink uppercase">
                        Em breve
                      </span>
                    )}
                  </div>
                  <p className="m-0 text-[15px] leading-[1.55] text-ink-soft">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Carnê-leão bonus */}
        <section className="mx-auto max-w-[1120px] px-6 pb-16">
          <div className="flex flex-wrap items-center gap-7 rounded-[20px] border border-line bg-white p-8">
            <div className="flex flex-[1_1_360px] flex-col gap-2.5">
              <span className="self-start rounded-full bg-amber-tint px-3 py-1.5 text-[13px] font-bold text-amber-ink">
                Bônus para quem recebe em dólar
              </span>
              <h2 className="m-0 text-[28px] font-extrabold tracking-[-0.02em]">
                E o carnê-leão? Já está incluído.
              </h2>
              <p className="m-0 text-[16px] leading-[1.6] text-ink-soft">
                Como você já registra seus pagamentos, o Ganhômetro converte cada um
                para reais pela regra oficial da Receita, mostra a estimativa do mês com
                as regras de 2026 e lembra você antes do prazo.
              </p>
              <p className="m-0 text-[13px] leading-[1.5] text-muted">
                Estimativa, não é orientação contábil. Em caso de dúvida, consulte um
                contador.
              </p>
            </div>
            <ul className="m-0 flex flex-[1_1_300px] list-none flex-col gap-3 p-0">
              {taxPoints.map((t) => (
                <li key={t} className="flex gap-2.5 text-[15px] leading-[1.5]">
                  <CheckIcon color="#0B6B4F" strokeWidth={2.4} className="mt-0.5 flex-none" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Privacy */}
        <section id="privacidade" className="mx-auto max-w-[1120px] px-6 pb-16">
          <div className="flex flex-wrap items-start gap-8 rounded-[20px] bg-ink p-10 text-white">
            <div className="flex flex-[1_1_320px] flex-col gap-3">
              <h2 className="m-0 text-[32px] font-extrabold tracking-[-0.02em]">
                Só tempo e dinheiro. Nunca suas tarefas.
              </h2>
              <p className="m-0 text-[16px] leading-[1.6] text-night-text">
                Trabalho de treinamento de IA costuma ser confidencial. O Ganhômetro foi
                feito para você nunca precisar compartilhá-lo.
              </p>
            </div>
            <ul className="m-0 flex flex-[1_1_360px] list-none flex-col gap-3.5 p-0">
              {privacyPoints.map((t) => (
                <li key={t} className="flex gap-3 text-[16px] leading-[1.5]">
                  <CheckIcon color="#7FD9B4" strokeWidth={2.4} className="mt-0.5 flex-none" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Plans */}
        <section className="mx-auto flex max-w-[1120px] flex-col gap-7 px-6 pb-16">
          <h2 className={h2}>Planos</h2>
          <div className={autoGrid[280]}>
            <div className="flex flex-col gap-3.5 rounded-2xl border border-line bg-white p-[26px]">
              <span className="text-[16px] font-extrabold">Grátis</span>
              <span className="font-mono text-[34px] font-semibold">R$ 0</span>
              <ul className="m-0 flex list-disc flex-col gap-2 pl-[18px] text-[15px] leading-[1.5] text-ink-soft">
                {freePlan.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3.5 rounded-2xl border-2 border-brand bg-white p-[26px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[16px] font-extrabold">Pro</span>
                <span className="rounded-full bg-brand-tint px-2.5 py-1 text-[12px] font-bold text-brand">
                  Desconto para a lista
                </span>
              </div>
              <span className="font-mono text-[34px] font-semibold">
                R$ 14,90
                <span className="font-sans text-[15px] font-medium text-muted"> / mês</span>
              </span>
              <ul className="m-0 flex list-disc flex-col gap-2 pl-[18px] text-[15px] leading-[1.5] text-ink-soft">
                {proPlan.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="duvidas" className="border-y border-line bg-white">
          <div className="mx-auto flex max-w-[820px] flex-col gap-5 px-6 py-16">
            <h2 className={h2}>Dúvidas</h2>
            <Faq />
          </div>
        </section>

        {/* Final CTA */}
        <section
          id="lista"
          className="mx-auto flex max-w-[1120px] flex-col items-center gap-[18px] px-6 py-[72px] text-center"
        >
          <h2 className="m-0 max-w-[720px] text-[38px] font-extrabold tracking-[-0.02em]">
            Saiba quanto vale o seu tempo de verdade.
          </h2>
          <p className="m-0 max-w-[560px] text-[17px] leading-[1.6] text-ink-soft">
            Entre na lista para ter acesso antecipado grátis e desconto de fundador.
          </p>
          <WaitlistForm
            source="final"
            buttonLabel="Entrar na lista"
            successText="Você está na lista. Obrigado!"
            centered
          />
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
