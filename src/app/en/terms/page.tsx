import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { alternates } from "@/i18n";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use — Ganhômetro",
  description: "Terms of use for the Ganhômetro website and early-access waitlist.",
  alternates: alternates("terms", "en"),
};

export default function EnglishTermsPage() {
  return (
    <LegalPage locale="en" page="terms" title="Terms of Use">
      <p>
        These terms apply to the Ganhômetro website and the early-access waitlist. By using the
        website, you agree to them. This is a translation: if it differs from the{" "}
        <Link href="/termos">Portuguese version</Link>, the Portuguese version prevails.
      </p>

      <h2>1. What this website is</h2>
      <p>
        This website presents Ganhômetro, an app in development that measures what each platform
        really pays per hour, and lets you join the early-access waitlist.
      </p>

      <h2>2. Early-access waitlist</h2>
      <ul>
        <li>Joining the waitlist is free, and you can leave whenever you want.</li>
        <li>
          The waitlist does not guarantee a launch date, a final price or specific features.
          Features marked “soon” do not exist yet.
        </li>
        <li>Only sign up with your own email address.</li>
      </ul>

      <h2>3. Calculator and estimates</h2>
      <p>
        The calculator&apos;s results depend on the numbers you enter, including the dollar rate,
        and are for reference only. Tax estimates, such as the carnê-leão ones, are not accounting
        advice and do not replace an accountant. Decisions you make based on them are your
        responsibility.
      </p>

      <h2>4. Independence</h2>
      <p>
        Ganhômetro is not affiliated with any AI training or freelance platform, or with Brazil&apos;s
        Receita Federal. The names of the platforms mentioned belong to their owners and appear
        only to identify the audience the product is for.
      </p>

      <h2>5. Acceptable use</h2>
      <p>
        Do not use the website to send spam, sign up other people&apos;s email addresses, try to
        access restricted areas or disrupt the service.
      </p>

      <h2>6. Privacy</h2>
      <p>
        How we handle your data is described in our <Link href="/en/privacy">Privacy Policy</Link>.
      </p>

      <h2>7. Intellectual property</h2>
      <p>The Ganhômetro brand, texts and design are protected. Do not copy them without permission.</p>

      <h2>8. Availability</h2>
      <p>
        We do our best to keep the website online and the information correct, but, to the extent
        permitted by law, we do not guarantee that it will always be available or free of errors.
      </p>

      <h2>9. Changes to these terms</h2>
      <p>We may update these terms. The date at the top shows the latest change.</p>

      <h2>10. Governing law</h2>
      <p>
        These terms are governed by Brazilian law. Any dispute will be handled in the courts of
        the user&apos;s place of residence.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions? Write to <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
      </p>
    </LegalPage>
  );
}
