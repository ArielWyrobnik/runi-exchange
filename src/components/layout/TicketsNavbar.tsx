import { Link, useNavigate } from "react-router-dom";
import { Menu, Globe, Tag, Ticket } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import reichmanStars from "@/assets/reichman-stars.png";

/** Blue-themed navbar used exclusively on /tickets pages. */
const TicketsNavbar = () => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const { lang, setLang, t } = useLanguage();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const toggleLang = () => setLang(lang === "en" ? "he" : "en");

  return (
    <header className="sticky top-0 z-50 bg-background">
      {/* Blue top bar — matches the RUNI Market bar */}
      <div className="bg-primary text-white">
        <div className="container flex h-16 items-center justify-between gap-4">
          {/* Logo — dir="ltr" keeps stars left of text in Hebrew too */}
          <Link to="/tickets" dir="ltr" className="flex items-center gap-2.5">
            <img
              src={reichmanStars}
              alt="Reichman University"
              className="h-11 w-auto object-contain"
              style={{ filter: "brightness(0) invert(1)" }}
            />
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-tight">RUNI Tickets</span>
              <span className="text-[10px] uppercase tracking-widest text-white/70">
                {lang === "he" ? "כרטיסי אירועים" : "Campus Events"}
              </span>
            </div>
          </Link>

          {/* Desktop buttons */}
          <div className="hidden items-center gap-3 md:flex">
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleLang}
              className="text-white hover:bg-white/10 hover:text-white"
            >
              <Globe className="mr-1 h-4 w-4" />
              {lang === "en" ? "עברית" : "English"}
            </Button>

            <Button
              size="sm"
              asChild
              variant="outline"
              className="border-white bg-transparent text-white hover:bg-white hover:text-primary"
            >
              <Link to="/">
                <Tag className="mr-1 h-4 w-4" />
                {t("brand")}
              </Link>
            </Button>

            {loading ? null : user ? (
              <>
                <Link
                  to={`/seller/${user.id}`}
                  className="text-sm text-white/80 hover:text-white hover:underline"
                >
                  {user.user_metadata?.full_name ?? user.email}
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="border-white bg-transparent text-white hover:bg-white hover:text-primary"
                >
                  {t("logOut")}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-white hover:bg-white/10 hover:text-white"
                >
                  <Link to="/login">{t("logIn")}</Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="bg-white text-primary hover:bg-white/90"
                >
                  <Link to="/signup">{t("signUpRuni")}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white">
                <Menu className="h-5 w-5" />
                <span className="sr-only">{t("openMenu")}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="sr-only">{t("navigationMenu")}</SheetTitle>
              <div className="flex flex-col gap-6 pt-6">
                <Link
                  to="/tickets"
                  dir="ltr"
                  className="flex items-center gap-2"
                  onClick={() => setMobileOpen(false)}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
                    <Ticket className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-bold text-primary">RUNI Tickets</span>
                </Link>

                <nav className="flex flex-col gap-1">
                  <Link
                    to="/"
                    onClick={() => setMobileOpen(false)}
                    className="rounded px-3 py-2.5 text-sm font-medium text-primary hover:bg-blue-50"
                  >
                    {t("brand")}
                  </Link>
                  <button
                    onClick={toggleLang}
                    className="flex items-center gap-2 rounded px-3 py-2.5 text-left text-sm font-medium text-primary hover:bg-blue-50"
                  >
                    <Globe className="h-4 w-4" />
                    {lang === "en" ? "עברית" : "English"}
                  </button>
                </nav>

                <div className="flex flex-col gap-2 border-t pt-4">
                  {user ? (
                    <>
                      <Link
                        to={`/seller/${user.id}`}
                        onClick={() => setMobileOpen(false)}
                        className="px-3 text-sm font-medium hover:underline"
                      >
                        {user.user_metadata?.full_name ?? user.email}
                      </Link>
                      <Button
                        variant="outline"
                        className="border-primary text-primary"
                        onClick={() => { handleSignOut(); setMobileOpen(false); }}
                      >
                        {t("logOut")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        asChild
                        className="border-primary text-primary"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Link to="/login">{t("logIn")}</Link>
                      </Button>
                      <Button
                        asChild
                        className="bg-primary text-white hover:bg-primary/90"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Link to="/signup">{t("signUpRuni")}</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Blue-tinted nav bar row */}
      <div className="border-b border-blue-200 bg-blue-50/60">
        <div className="container flex h-10 items-center gap-4">
          <Link to="/tickets" className="text-sm font-medium text-primary hover:underline">
            {lang === "he" ? "כל האירועים" : "All Events"}
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
            {lang === "he" ? "לשוק הכללי" : t("brand")}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default TicketsNavbar;
