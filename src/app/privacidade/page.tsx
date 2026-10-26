import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { alternates } from "@/i18n";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Política de Privacidade — Ganhômetro",
  description: "Como o Ganhômetro trata seus dados pessoais, conforme a LGPD.",
  alternates: alternates("privacy", "pt-BR"),
};

export default function PrivacyPage() {
  const email = <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>;
  return (
    <LegalPage locale="pt-BR" page="privacy" title="Política de Privacidade">
      <p>
        Esta política explica como o Ganhômetro trata os seus dados pessoais neste site
        e na lista de acesso antecipado, de acordo com a Lei Geral de Proteção de Dados
        (Lei nº 13.709/2018, a “LGPD”).
      </p>

      <h2>1. Quem é o responsável</h2>
      <p>
        O controlador dos dados é <strong>{site.controller}</strong>. Para qualquer
        assunto sobre privacidade, inclusive para falar com o encarregado pelo
        tratamento de dados, escreva para {email}.
      </p>

      <h2>2. Quais dados coletamos</h2>
      <ul>
        <li>
          <strong>E-mail</strong>, quando você entra na lista de acesso antecipado.
        </li>
        <li>
          <strong>Registro do consentimento</strong>: data, hora e o formulário em que
          você aceitou receber nossos e-mails, o idioma e a página em que se cadastrou.
        </li>
        <li>
          <strong>O que você faz</strong> (opcional): se você escolher uma opção no
          formulário, como &quot;treino IA&quot; ou &quot;freelancer&quot;, para entendermos
          quem se interessa pelo Ganhômetro.
        </li>
        <li>
          <strong>Origem da visita</strong>: os parâmetros de campanha (UTM) do link que
          trouxe você até aqui, como o nome da rede social ou do anúncio. Eles ficam
          guardados no seu navegador até você enviar o formulário.
        </li>
        <li>
          <strong>Estatísticas de uso</strong>: usamos o Umami Analytics, que conta
          visitas de forma agregada, sem cookies e sem guardar dados que identifiquem
          você.
        </li>
        <li>
          <strong>Dados técnicos de acesso</strong>, como endereço IP, data e hora,
          registrados pelo nosso provedor de hospedagem por segurança e para cumprir
          obrigações legais.
        </li>
      </ul>
      <p>
        Os números que você digita na calculadora ficam só no seu navegador e não são
        enviados para nós.
      </p>

      <h2>3. Para que usamos seus dados</h2>
      <ul>
        <li>
          Enviar e-mails sobre o acesso antecipado, o lançamento, a oferta de fundador e
          materiais gratuitos ligados ao Ganhômetro.
        </li>
        <li>Entender quais canais de divulgação funcionam, com dados agregados.</li>
        <li>Proteger o site contra abuso e spam.</li>
      </ul>
      <p>
        Não vendemos nem alugamos seus dados e não os usamos para publicidade de
        terceiros.
      </p>

      <h2>4. Bases legais</h2>
      <ul>
        <li>Consentimento (art. 7º, I, da LGPD), para os e-mails da lista.</li>
        <li>
          Legítimo interesse (art. 7º, IX), para estatísticas agregadas e segurança do
          site.
        </li>
        <li>
          Cumprimento de obrigação legal (art. 7º, II), para os registros de acesso
          exigidos pelo Marco Civil da Internet.
        </li>
      </ul>

      <h2>5. Com quem compartilhamos</h2>
      <p>
        Só com fornecedores que nos ajudam a operar o site e que tratam os dados de
        acordo com as nossas instruções:
      </p>
      <ul>
        <li>Brevo (França): envio de e-mails e gestão da lista.</li>
        <li>Vercel (Estados Unidos): hospedagem do site.</li>
        <li>Umami Analytics (União Europeia ou Estados Unidos): estatísticas sem cookies.</li>
      </ul>
      <p>
        Também podemos compartilhar dados quando a lei ou uma ordem judicial exigir.
      </p>

      <h2>6. Transferência internacional</h2>
      <p>
        Esses fornecedores podem tratar dados fora do Brasil, na União Europeia e nos
        Estados Unidos. Parte da equipe que opera o Ganhômetro trabalha na China e pode
        acessar os dados de lá. Nesses casos, a transferência segue o art. 33 da LGPD,
        com cláusulas contratuais, acesso restrito e medidas de segurança adequadas.
      </p>

      <h2>7. Por quanto tempo guardamos</h2>
      <ul>
        <li>
          E-mail e registro do consentimento: até você cancelar a inscrição ou pedir a
          exclusão. Depois do cancelamento, guardamos apenas o necessário para não
          enviar mais e-mails a você.
        </li>
        <li>Registros de acesso: pelo prazo exigido por lei.</li>
      </ul>

      <h2>8. Seus direitos</h2>
      <p>Conforme o art. 18 da LGPD, você pode, a qualquer momento:</p>
      <ul>
        <li>confirmar se tratamos seus dados e acessá-los;</li>
        <li>corrigir dados incompletos, inexatos ou desatualizados;</li>
        <li>pedir anonimização, bloqueio ou eliminação de dados desnecessários;</li>
        <li>pedir a portabilidade dos seus dados;</li>
        <li>pedir a eliminação dos dados tratados com base no seu consentimento;</li>
        <li>saber com quem compartilhamos seus dados;</li>
        <li>revogar o seu consentimento.</li>
      </ul>
      <p>
        Para cancelar os e-mails, use o link “cancelar inscrição” presente em todos
        eles. Para os demais pedidos, escreva para {email}. Respondemos em até 15 dias.
        Você também pode apresentar reclamação à Autoridade Nacional de Proteção de
        Dados (ANPD).
      </p>

      <h2>9. Segurança</h2>
      <p>
        Usamos conexão criptografada (HTTPS), acesso restrito às contas dos
        fornecedores e outras medidas razoáveis para proteger seus dados.
      </p>

      <h2>10. Menores de idade</h2>
      <p>Este site e a lista de acesso antecipado são destinados a maiores de 18 anos.</p>

      <h2>11. O aplicativo Ganhômetro</h2>
      <p>
        Quando o aplicativo for lançado, ele terá uma política própria, com a mesma
        regra: guardamos só tempo e dinheiro, nunca o conteúdo das suas tarefas.
      </p>

      <h2>12. Mudanças nesta política</h2>
      <p>
        Podemos atualizar esta política. A data no topo mostra a última alteração.
        Mudanças importantes serão avisadas por e-mail a quem está na lista.
      </p>
    </LegalPage>
  );
}
