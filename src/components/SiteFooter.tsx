import Link from "next/link";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-[1120px] flex-wrap justify-between gap-3 p-6 text-[13px] leading-[1.5] text-muted">
        <span>
          © 2026 Ganhômetro. Não somos ligados a nenhuma plataforma nem à Receita
          Federal. Estimativas de imposto não substituem orientação contábil.
        </span>
        <div className="flex flex-wrap gap-4">
          <Link href="/privacidade" className="underline">
            Privacidade
          </Link>
          <Link href="/termos" className="underline">
            Termos
          </Link>
          <a href={`mailto:${site.contactEmail}`} className="underline">
            Contato: {site.contactEmail}
          </a>
        </div>
      </div>
    </footer>
  );
}
