import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Search, MessageCircle, Tag, Globe, List, Heart, ShieldCheck, CalendarPlus } from "lucide-react";
import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadCount } from "@/hooks/useMessages";
import { useIsAdmin } from "@/hooks/useReports";
import { useLanguage } from "@/i18n/LanguageContext";
import { TICKETS_ENABLED } from "@/lib/constants";
import reichmanStars from "@/assets/reichman-stars.png";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { user, loading, signOut } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: isAdmin = false } = useIsAdmin();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    // Dismiss the mobile keyboard even when the navigation is a no-op
    // (e.g. searching the same term again while already on /browse).
    (document.activeElement as HTMLElement | null)?.blur?.();
    const q = search.trim();
    navigate(q ? `/browse?search=${encodeURIComponent(q)}` : "/browse");
  };

  const toggleLang = () => setLang(lang === "en" ? "he" : "en");

  return (
    <header className="sticky top-0 z-50 bg-background">
      {/* Top navbar — logo + auth */}
      <div className="bg-primary text-primary-foreground">
        <div className="container flex h-16 items-center justify-between gap-4">
          {/* Logo — dir="ltr" keeps the stars left of the text in Hebrew too */}
          <Link to="/" dir="ltr" className="flex items-center gap-2.5">
            <img
              src={reichmanStars}
              alt="Reichman University"
              className="h-11 w-auto object-contain"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-tight">
                {t("brand")}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-primary-foreground/70">
                {t("tagline")}
              </span>
            </div>
          </Link>

          {/* Desktop auth buttons */}
          <div className="hidden items-center gap-3 md:flex">
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleLang}
              className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Globe className="mr-1 h-4 w-4" />
              {lang === "en" ? "עברית" : "English"}
            </Button>
            <Button
              size="sm"
              asChild
              variant="outline"
              className="border-primary-foreground bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary"
            >
              <Link to="/sell">
                <Tag className="mr-1 h-4 w-4" />
                {t("startSelling")}
              </Link>
            </Button>
            {user && (
              <>
                {isAdmin && (
                  <Button
                    size="sm"
                    asChild
                    variant="ghost"
                    className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  >
                    <Link to="/admin/reports">
                      <ShieldCheck className="mr-1 h-4 w-4" />
                      {t("adminReports")}
                    </Link>
                  </Button>
                )}
                {isAdmin && TICKETS_ENABLED && (
                  <Button
                    size="sm"
                    asChild
                    variant="ghost"
                    className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  >
                    <Link to="/admin/events">
                      <CalendarPlus className="mr-1 h-4 w-4" />
                      {t("adminEvents")}
                    </Link>
                  </Button>
                )}
                <Button
                  size="sm"
                  asChild
                  variant="ghost"
                  className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <Link to="/my-listings">
                    <List className="mr-1 h-4 w-4" />
                    {t("myListings")}
                  </Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  variant="ghost"
                  className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <Link to="/watchlist">
                    <Heart className="mr-1 h-4 w-4" />
                    {t("watchlist")}
                  </Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  variant="ghost"
                  className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <Link to="/messages" className="relative">
                    <MessageCircle className="mr-1 h-4 w-4" />
                    {t("messages")}
                    {unreadCount > 0 && (
                      <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                </Button>
              </>
            )}
            {loading ? null : user ? (
              <>
                <Link
                  to={`/seller/${user.id}`}
                  className="text-sm text-primary-foreground/80 hover:text-primary-foreground hover:underline"
                >
                  {user.user_metadata?.full_name ?? user.email}
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="border-primary-foreground bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary"
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
                  className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <Link to="/login">{t("logIn")}</Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  <Link to="/signup">{t("signUpRuni")}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Menu className="h-5 w-5" />
                <span className="sr-only">{t("openMenu")}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="sr-only">{t("navigationMenu")}</SheetTitle>
              <div className="flex flex-col gap-6 pt-6">
                <Link
                  to="/"
                  dir="ltr"
                  className="flex items-center gap-2"
                  onClick={() => setMobileOpen(false)}
                >
                  <img
                    src={reichmanStars}
                    alt="Reichman University"
                    className="h-8 w-auto rounded bg-primary object-contain p-1"
                  />
                  <span className="font-bold text-primary">{t("brand")}</span>
                </Link>

                <nav className="flex flex-col gap-1">
                  <Link
                    to="/sell"
                    onClick={() => setMobileOpen(false)}
                    className="rounded px-3 py-2.5 text-sm font-medium text-primary hover:bg-accent"
                  >
                    {t("startSelling")}
                  </Link>
                  {user && (
                    <>
                      {isAdmin && (
                        <Link
                          to="/admin/reports"
                          onClick={() => setMobileOpen(false)}
                          className="rounded px-3 py-2.5 text-sm font-medium text-primary hover:bg-accent"
                        >
                          {t("adminReports")}
                        </Link>
                      )}
                      {isAdmin && TICKETS_ENABLED && (
                        <Link
                          to="/admin/events"
                          onClick={() => setMobileOpen(false)}
                          className="rounded px-3 py-2.5 text-sm font-medium text-primary hover:bg-accent"
                        >
                          {t("adminEvents")}
                        </Link>
                      )}
                      <Link
                        to="/my-listings"
                        onClick={() => setMobileOpen(false)}
                        className="rounded px-3 py-2.5 text-sm font-medium text-primary hover:bg-accent"
                      >
                        {t("myListings")}
                      </Link>
                      <Link
                        to="/watchlist"
                        onClick={() => setMobileOpen(false)}
                        className="rounded px-3 py-2.5 text-sm font-medium text-primary hover:bg-accent"
                      >
                        {t("watchlist")}
                      </Link>
                      <Link
                        to="/messages"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 rounded px-3 py-2.5 text-sm font-medium text-primary hover:bg-accent"
                      >
                        {t("messages")}
                        {unreadCount > 0 && (
                          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                            {unreadCount}
                          </span>
                        )}
                      </Link>
                    </>
                  )}
                  <button
                    onClick={toggleLang}
                    className="flex items-center gap-2 rounded px-3 py-2.5 text-left text-sm font-medium text-primary hover:bg-accent"
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
                      <Button asChild onClick={() => setMobileOpen(false)}>
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

      {/* Search bar row — eBay style */}
      <div className="border-b bg-background">
        <div className="container py-3">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchPlaceholder")}
                enterKeyHint="search"
                className="h-11 rounded-full pl-10 pr-4 border-2 border-primary/30 focus-visible:border-primary rtl:pl-4 rtl:pr-10"
              />
            </div>
            <Button
              type="submit"
              className="h-11 rounded-full px-6 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {t("search")}
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
