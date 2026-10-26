// Portuguese (Brazil): the original copy from the Main.dc.html design. en.ts mirrors this shape.

const pt = {
  meta: {
    title: "Ganhômetro — quanto cada plataforma paga de verdade",
    description:
      "Conte o tempo pago e o não pago (diretrizes, testes, espera), veja seu ganho real por hora em reais e saiba quando um pagamento atrasou. Com estimativa do carnê-leão incluída.",
    ogLocale: "pt_BR",
    ogTitle: "Descubra quanto cada plataforma paga de verdade, por hora, em reais.",
    ogTagline: "Para quem treina IA · Acesso antecipado grátis",
  },
  nav: {
    label: "Principal",
    calculator: "Calculadora",
    how: "Como funciona",
    features: "Recursos",
    privacy: "Privacidade",
    faq: "Dúvidas",
    cta: "Entrar na lista",
    language: "Idioma",
  },
  hero: {
    badge: "Para quem treina IA na Outlier, DataAnnotation, Mercor e outras",
    title: "Descubra quanto cada plataforma paga de verdade, por hora, em reais.",
    lead: "Conte o tempo pago e o não pago (diretrizes, testes, espera), veja seu ganho real por hora e saiba quando um pagamento atrasou. Com estimativa do carnê-leão incluída.",
    button: "Quero acesso antecipado",
    success: "Pronto! Avisaremos por e-mail quando o acesso abrir.",
    note: "Grátis no acesso antecipado. Nunca guardamos o conteúdo das suas tarefas.",
    freelancers: "Também serve para freelancers que recebem em dólar, como devs, designers e tradutores.",
  },
  example: {
    title: "Esta semana",
    caption: "Exemplo · cotação ilustrativa {rate}",
    platformA: "Plataforma A",
    platformB: "Plataforma B",
    advertises: "anuncia {rate}",
    detail: "{paid}h pagas · {unpaid}h {unpaidWord} · US$ {received}",
    unpaidOne: "não paga",
    unpaidMany: "não pagas",
    legendPaid: "Tempo pago",
    legendUnpaid: "Tempo não pago",
    verdict: "A Plataforma A anuncia mais, mas a B pagou mais por hora de verdade.",
  },
  problem: {
    title: "O valor anunciado não é o que você ganha.",
    lead: "As plataformas pagam pelo tempo de tarefa. Todo o resto fica por sua conta, e quase ninguém mede.",
    items: [
      { title: "Diretrizes e testes", text: "Horas lendo instruções e fazendo avaliações antes da primeira tarefa paga." },
      { title: "Espera por tarefas", text: "Atualizando uma fila vazia, trocando de plataforma, esperando novidades." },
      { title: "Retrabalho", text: "Corrigir tarefas depois da revisão, ou trabalho que nunca é pago." },
      { title: "Pagamento atrasado", text: "Cada plataforma paga em um dia diferente. Fica difícil perceber quando algo não chegou." },
    ],
  },
  calculator: {
    badge: "Grátis, sem cadastro",
    title: "Calculadora de ganho real por hora",
    lead: "Coloque os números de uma semana em uma plataforma e veja quanto ela pagou de verdade.",
    fields: {
      listed: "Valor anunciado (US$/h)",
      received: "Valor recebido (US$)",
      paid: "Horas pagas",
      unpaid: "Horas não pagas",
      rate: "Cotação do dólar (R$)",
    },
    defaultRate: "5,10",
    hint: "Horas não pagas: diretrizes, testes, espera por tarefas e retrabalho. Os valores iniciais são só um exemplo.",
    realTitle: "Ganho real por hora",
    gapTitle: "Comparado ao valor anunciado",
    unpaidTitle: "Tempo não pago",
    messages: {
      gapLess: "{n}% a menos que o anunciado",
      gapMore: "{n}% a mais que o anunciado",
      gapSame: "Igual ao anunciado",
      unpaidShare: "{n}% das suas horas não foram pagas",
    },
  },
  how: {
    title: "Como funciona",
    steps: [
      { title: "Adicione suas plataformas", text: "Informe o valor anunciado e o dia de pagamento de cada uma. Leva uns cinco minutos." },
      { title: "Conte o tempo", text: "Um toque para começar. Marque se é tarefa paga ou tempo não pago, como diretrizes e espera." },
      { title: "Veja seu ganho real", text: "Registre os pagamentos e veja quanto cada plataforma paga de verdade, em reais, e quando algo atrasou." },
    ],
  },
  features: {
    title: "Tudo em um lugar",
    soon: "Em breve",
    // "soon" marks Stage 2/3 features (Handoff §3).
    items: [
      { title: "Ganho real por plataforma e projeto", text: "Dinheiro recebido dividido por todas as horas, pagas ou não. Compare plataformas lado a lado.", soon: false },
      { title: "Tempo pago x não pago", text: "Marque diretrizes, testes, espera e retrabalho e veja para onde vai o seu tempo.", soon: false },
      { title: "Detector de pagamento a menor", text: "Compara horas pagas registradas x valor recebido e mostra possíveis diferenças para você conferir no painel da plataforma.", soon: false },
      { title: "Alerta de pagamento atrasado", text: "Informe o dia de pagamento de cada plataforma e saiba na hora quando algo atrasou.", soon: false },
      { title: "Quanto você perde em câmbio e taxas", text: "Compare o dólar que você recebeu com os reais que chegaram e veja o custo real de cada serviço de recebimento.", soon: true },
      { title: "Alerta dos R$ 5 mil", text: "Aviso antes de passar do limite de isenção do mês, com a estimativa do carnê-leão que você vai pagar.", soon: false },
      { title: "Alerta de queda de renda", text: "Avisa quando uma plataforma paga bem menos que o normal ou quando quase toda a sua renda depende de uma só.", soon: true },
      { title: "Contestação pronta em inglês", text: "Registro das horas em PDF e uma mensagem em inglês para enviar ao suporte da plataforma.", soon: false },
      { title: "INSS em dia", text: "Lembrete da guia mensal e simulação dos planos de contribuição para você não ficar sem proteção.", soon: true },
      { title: "Extensão automática", text: "O cronômetro começa e pausa sozinho quando você abre as páginas de trabalho. Só mede o tempo.", soon: true },
    ],
  },
  tax: {
    badge: "Bônus para quem recebe em dólar",
    title: "E o carnê-leão? Já está incluído.",
    text: "Como você já registra seus pagamentos, o Ganhômetro converte cada um para reais pela regra oficial da Receita, mostra a estimativa do mês com as regras de 2026 e lembra você antes do prazo.",
    note: "Estimativa, não é orientação contábil. Em caso de dúvida, consulte um contador.",
    points: [
      "Conversão com a cotação de compra correta do Banco Central",
      "Estimativa mensal: isento até R$ 5 mil, redução parcial até R$ 7.350",
      "Lembrete antes do último dia útil do mês seguinte",
    ],
  },
  privacy: {
    title: "Só tempo e dinheiro. Nunca suas tarefas.",
    text: "Trabalho de treinamento de IA costuma ser confidencial. O Ganhômetro foi feito para você nunca precisar compartilhá-lo.",
    points: [
      "Não guardamos conteúdo, prompts, respostas nem capturas de tela das tarefas.",
      "Nunca pedimos login das plataformas, senha do gov.br ou do banco.",
      "Exporte ou apague seus dados quando quiser, conforme a LGPD.",
      "Seus ganhos são privados. Nada é compartilhado sem a sua permissão.",
    ],
  },
  plans: {
    title: "Planos",
    free: {
      name: "Grátis",
      price: "R$ 0",
      items: ["Cronômetro com tempo pago e não pago", "Até 2 plataformas", "Ganho real por hora em reais", "Resumo semanal"],
    },
    pro: {
      name: "Pro",
      badge: "Desconto para a lista",
      price: "R$ 14,90",
      perMonth: " / mês",
      items: [
        "Plataformas ilimitadas, ganho por projeto e histórico completo",
        "Detector de pagamento a menor e alerta de atraso",
        "Quanto você perde em câmbio e taxas (em breve)",
        "Alerta antes de passar dos R$ 5 mil, estimativa do carnê-leão e lembretes",
        "Alerta de queda de renda (em breve)",
        "Registro em PDF e mensagem de contestação em inglês",
        "INSS em dia e extensão automática (em breve)",
      ],
    },
  },
  faq: {
    title: "Dúvidas",
    items: [
      { q: "O Ganhômetro é ligado a alguma plataforma?", a: "Não. É independente e não tem relação com nenhuma plataforma de treinamento de IA ou de freelance. Você registra seu próprio tempo e seus pagamentos." },
      { q: "Vocês acessam minha conta ou minhas tarefas?", a: "Não. Guardamos apenas o tempo que você registra e os pagamentos que você informa. Nunca pedimos login das plataformas." },
      { q: "A extensão é permitida pelas plataformas?", a: "Ela apenas mede o tempo e identifica qual site está aberto. Não clica, não atualiza páginas e não lê tarefas. Mesmo assim, confira os termos de cada plataforma." },
      { q: "Funciona com quais plataformas?", a: "Com qualquer uma. Você adiciona as plataformas que usa, com o valor anunciado e o dia de pagamento." },
      { q: "A estimativa do carnê-leão é oficial?", a: "É uma estimativa baseada nas regras publicadas, revisada por um contador antes do lançamento. Você mesmo gera e paga o DARF." },
      { q: "Quanto vai custar?", a: "Haverá um plano grátis. O Pro libera plataformas ilimitadas, alertas, o registro em PDF e o carnê-leão, com desconto para quem entrar na lista." },
    ],
  },
  final: {
    title: "Saiba quanto vale o seu tempo de verdade.",
    text: "Entre na lista para ter acesso antecipado grátis e desconto de fundador.",
    button: "Entrar na lista",
    success: "Você está na lista. Obrigado!",
  },
  form: {
    emailLabel: "Seu e-mail",
    placeholder: "seu@email.com",
    sending: "Enviando…",
    consentBefore: "Aceito receber e-mails do Ganhômetro sobre o acesso antecipado e a oferta de fundador. Li a ",
    consentLink: "Política de Privacidade",
    consentAfter: " e posso cancelar quando quiser.",
    honeypot: "Não preencha este campo",
    doubleOptIn: "Quase lá! Confirme sua inscrição no e-mail que acabamos de enviar.",
    bonus: "Baixe a planilha grátis: Carnê-leão 2026 para quem recebe em dólar",
    errors: {
      invalid_email: "Digite um e-mail válido.",
      consent_required: "Marque a caixa de consentimento para entrar na lista.",
      generic: "Não foi possível enviar agora. Tente de novo em instantes.",
    },
  },
  footer: {
    copyright:
      "© 2026 Ganhômetro. Não somos ligados a nenhuma plataforma nem à Receita Federal. Estimativas de imposto não substituem orientação contábil.",
    privacy: "Privacidade",
    terms: "Termos",
    contact: "Contato: {email}",
  },
  legal: {
    updated: "Última atualização: {date}",
    date: "26 de outubro de 2026",
  },
};

export type Dictionary = typeof pt;
export default pt;
