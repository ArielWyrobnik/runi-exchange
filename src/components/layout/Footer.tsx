import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

interface FooterProps {
  variant?: "market" | "tickets";
}

const Footer = ({ variant = "market" }: FooterProps) => {
  const { t } = useLanguage();
  const isTickets = variant === "tickets";

  return (
    <footer className="border-t bg-primary text-primary-foreground">
      <div className="container py-10">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          {/* Brand + tagline */}
          <div>
            <p className="font-bold">{isTickets ? t("ticketsHeroTitle") : t("brand")}</p>
            <p className="text-xs text-primary-foreground/70">
              {isTickets ? t("ticketsFooterTagline") : t("madeByStudents")}
            </p>
          </div>

          {/* Nav links */}
          <nav className="flex gap-8 text-sm font-medium">
            <Link to="/browse" className="transition-opacity hover:opacity-80">
              {t("footerBrowse")}
            </Link>
            <Link to="/sell" className="transition-opacity hover:opacity-80">
              {t("footerSell")}
            </Link>
            <Link to="/messages" className="transition-opacity hover:opacity-80">
              {t("messages")}
            </Link>
          </nav>
        </div>

        <div className="mt-8 border-t border-primary-foreground/20 pt-6 text-center text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} {isTickets ? t("ticketsFooterCopyright") : t("footerCopyright")}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
