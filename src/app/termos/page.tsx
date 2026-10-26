import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Termos de Uso — Ganhômetro",
  description: "Termos de uso do site e da lista de acesso antecipado do Ganhômetro.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Termos de Uso">
      <p>
        Estes termos valem para o site do Ganhômetro e para a lista de acesso
        antecipado. Ao usar o site, você concorda com eles.
      </p>

      <h2>1. O que é este site</h2>
      <p>
        Este site apresenta o Ganhômetro, um aplicativo em desenvolvimento para medir
        quanto cada plataforma paga por hora de verdade, e permite entrar na lista de
        acesso antecipado.
      </p>

      <h2>2. Lista de acesso antecipado</h2>
      <ul>
        <li>Entrar na lista é grátis e você pode sair quando quiser.</li>
        <li>
          A lista não garante data de lançamento, preço final nem recursos específicos.
          Recursos marcados como “em breve” ainda não existem.
        </li>
        <li>Cadastre apenas o seu próprio e-mail.</li>
      </ul>

      <h2>3. Calculadora e estimativas</h2>
      <p>
        Os resultados da calculadora dependem dos números que você informa, inclusive
        a cotação do dólar, e servem apenas como referência. Estimativas de imposto,
        como as do carnê-leão, não são orientação contábil nem substituem um contador.
        As decisões tomadas com base nelas são de sua responsabilidade.
      </p>

      <h2>4. Independência</h2>
      <p>
        O Ganhômetro não é ligado a nenhuma plataforma de treinamento de IA ou de
        freelance, nem à Receita Federal. Os nomes das plataformas citadas pertencem
        aos seus donos e aparecem só para identificar o público a quem o produto se
        destina.
      </p>

      <h2>5. Uso aceitável</h2>
      <p>
        Não use o site para enviar spam, cadastrar e-mails de outras pessoas, tentar
        acessar áreas restritas ou atrapalhar o funcionamento do serviço.
      </p>

      <h2>6. Privacidade</h2>
      <p>
        O tratamento dos seus dados está descrito na nossa{" "}
        <Link href="/privacidade">Política de Privacidade</Link>.
      </p>

      <h2>7. Propriedade intelectual</h2>
      <p>
        A marca, os textos e o design do Ganhômetro são protegidos. Não os copie sem
        autorização.
      </p>

      <h2>8. Disponibilidade</h2>
      <p>
        Fazemos o possível para manter o site no ar e as informações corretas, mas,
        na medida permitida pela lei, não garantimos que ele estará sempre disponível
        ou livre de erros.
      </p>

      <h2>9. Mudanças nestes termos</h2>
      <p>
        Podemos atualizar estes termos. A data no topo mostra a última alteração.
      </p>

      <h2>10. Lei aplicável</h2>
      <p>
        Estes termos seguem as leis brasileiras. Fica eleito o foro do domicílio do
        usuário.
      </p>

      <h2>11. Contato</h2>
      <p>
        Dúvidas? Escreva para{" "}
        <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
      </p>
    </LegalPage>
  );
}
