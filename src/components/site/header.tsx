"use client";
import { useState } from "react";
import { Menu, X, Crown, ArrowUpRight } from "lucide-react";
import Brand from "./brand";
import { BookingLauncher } from "@/features/booking/wizard";
import type { PublicContent } from "@/lib/domain";
export default function Header({ content }: { content: PublicContent }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="topbar">
        <Crown size={14} />
        <span>
          {content.settings.promotionActive
            ? content.settings.promotion
            : content.settings.topbarTagline}
        </span>
        <span className="topbar-star">✦</span>
      </div>
      <header className="site-header">
        <div className="container header-inner">
          <Brand logoUrl={content.settings.logoUrl} />
          <button
            className="menu-toggle"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
          <nav
            className={open ? "nav open" : "nav"}
            aria-label="Navegação principal"
          >
            {[
              ["Início", "#inicio"],
              ["Sobre", "#sobre"],
              ["Serviços", "#servicos"],
              ["Profissionais", "#equipe"],
              ["Contato", "#contato"],
            ].map(([label, href]) => (
              <a key={href} href={href} onClick={() => setOpen(false)}>
                {label}
              </a>
            ))}
          </nav>
          <BookingLauncher content={content} className="button header-book">
            {content.settings.headerCta} <ArrowUpRight size={16} />
          </BookingLauncher>
        </div>
      </header>
    </>
  );
}
