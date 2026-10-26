import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { alternates } from "@/i18n";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy — Ganhômetro",
  description: "How Ganhômetro handles your personal data, under Brazil's LGPD.",
  alternates: alternates("privacy", "en"),
};

export default function EnglishPrivacyPage() {
  const email = <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>;
  return (
    <LegalPage locale="en" page="privacy" title="Privacy Policy">
      <p>
        This policy explains how Ganhômetro handles your personal data on this website and on
        the early-access waitlist, under Brazil&apos;s General Data Protection Law (Lei nº
        13.709/2018, the “LGPD”). This is a translation: if it differs from the{" "}
        <Link href="/privacidade">Portuguese version</Link>, the Portuguese version prevails.
      </p>

      <h2>1. Who is responsible</h2>
      <p>
        The data controller is <strong>{site.controller}</strong>. For any privacy matter,
        including contacting the person in charge of data processing, write to {email}.
      </p>

      <h2>2. What data we collect</h2>
      <ul>
        <li>
          <strong>Email address</strong>, when you join the early-access waitlist.
        </li>
        <li>
          <strong>Consent record</strong>: the date, time and form where you agreed to receive
          our emails, the language and the page where you signed up.
        </li>
        <li>
          <strong>What you do</strong> (optional): if you pick an option in the form, such as
          &quot;AI training&quot; or &quot;freelancer&quot;, so we understand who is interested
          in Ganhômetro.
        </li>
        <li>
          <strong>How you&apos;re paid and income range</strong> (optional, on the freelancer page
          and the calculators): if you answer, we store whether you&apos;re paid as an individual or
          through a company and the monthly income range you picked (for example, &quot;R$ 5–10k&quot;),
          so we know which features to build first. We never ask for the exact amount.
        </li>
        <li>
          <strong>Where your visit came from</strong>: the campaign parameters (UTM) of the link
          that brought you here, such as the name of the social network or ad. They are kept in
          your browser until you submit the form.
        </li>
        <li>
          <strong>Usage statistics</strong>: we use Umami Analytics, which counts visits in
          aggregate, without cookies and without storing data that identifies you.
        </li>
        <li>
          <strong>Technical access data</strong>, such as IP address, date and time, recorded by
          our hosting provider for security and to meet legal obligations.
        </li>
      </ul>
      <p>
        The numbers you type into the calculators stay in your browser and are not sent to us. We
        only count, anonymously, that a calculator was used and which upcoming features got votes.
      </p>

      <h2>3. Why we use your data</h2>
      <ul>
        <li>
          To send emails about early access, the launch, the founding offer and free materials
          related to Ganhômetro.
        </li>
        <li>To understand which promotion channels work, using aggregate data.</li>
        <li>To protect the website against abuse and spam.</li>
      </ul>
      <p>We do not sell or rent your data, and we do not use it for third-party advertising.</p>

      <h2>4. Legal bases</h2>
      <ul>
        <li>Consent (LGPD art. 7, I), for the waitlist emails.</li>
        <li>Legitimate interest (art. 7, IX), for aggregate statistics and website security.</li>
        <li>
          Compliance with a legal obligation (art. 7, II), for the access logs required by
          Brazil&apos;s Marco Civil da Internet.
        </li>
      </ul>

      <h2>5. Who we share it with</h2>
      <p>Only with providers that help us run the website and follow our instructions:</p>
      <ul>
        <li>Brevo (France): sending emails and managing the list.</li>
        <li>Vercel (United States): website hosting.</li>
        <li>Umami Analytics (European Union or United States): cookie-free statistics.</li>
      </ul>
      <p>We may also share data when required by law or by a court order.</p>

      <h2>6. International transfers</h2>
      <p>
        These providers may process data outside Brazil, in the European Union and the United
        States. Part of the team that runs Ganhômetro works in China and may access the data
        from there. In these cases, the transfer follows LGPD art. 33, with contractual clauses,
        restricted access and appropriate security measures.
      </p>

      <h2>7. How long we keep it</h2>
      <ul>
        <li>
          Email and consent record: until you unsubscribe or ask us to delete them. After you
          unsubscribe, we keep only what is needed to stop emailing you.
        </li>
        <li>Access logs: for the period required by law.</li>
      </ul>

      <h2>8. Your rights</h2>
      <p>Under LGPD art. 18, you can at any time:</p>
      <ul>
        <li>confirm whether we process your data and access it;</li>
        <li>correct incomplete, inaccurate or outdated data;</li>
        <li>ask for unnecessary data to be anonymized, blocked or deleted;</li>
        <li>ask for your data to be transferred to another provider;</li>
        <li>ask for the deletion of data processed based on your consent;</li>
        <li>find out who we share your data with;</li>
        <li>withdraw your consent.</li>
      </ul>
      <p>
        To stop the emails, use the “unsubscribe” link in any of them. For other requests, write
        to {email}. We reply within 15 days. You can also file a complaint with Brazil&apos;s
        National Data Protection Authority (ANPD).
      </p>

      <h2>9. Security</h2>
      <p>
        We use encrypted connections (HTTPS), restricted access to our provider accounts and
        other reasonable measures to protect your data.
      </p>

      <h2>10. Minors</h2>
      <p>This website and the early-access waitlist are intended for people aged 18 or over.</p>

      <h2>11. The Ganhômetro app</h2>
      <p>
        When the app launches, it will have its own policy, with the same rule: we store only
        time and money, never the content of your tasks.
      </p>

      <h2>12. Changes to this policy</h2>
      <p>
        We may update this policy. The date at the top shows the latest change. Important
        changes will be announced by email to people on the waitlist.
      </p>
    </LegalPage>
  );
}
