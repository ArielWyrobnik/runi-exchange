import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import reichmanLogo from "@/assets/reichman-logo.png";

const navLinks = [
  { label: "Browse", href: "/browse" },
  { label: "Sell", href: "/sell" },
  { label: "Messages", href: "/messages" },
];

const utilityLinks = [
  { label: "RUNI MARKET", href: "/" },
  { label: "MY RUNI", href: "https://my.runi.ac.il", external: true },
  { label: "CONTACT US", href: "mailto:support@post.runi.ac.il", external: true },
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Main navbar — white background like runi.ac.il */}

      <div className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src={reichmanLogo}
              alt="Reichman University"
              className="h-10 w-10 object-contain"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-tight text-primary">
                RUNI Market
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Campus Marketplace
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-0 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`border-b-2 px-4 py-5 text-sm font-bold transition-colors ${
                  location.pathname === link.href
                    ? "border-primary text-primary"
                    : "border-transparent text-primary hover:border-primary/40"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop auth buttons */}
          <div className="hidden items-center gap-3 md:flex">
            {loading ? null : user ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {user.user_metadata?.full_name ?? user.email}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-primary hover:bg-primary/5"
                >
                  <Link to="/login">Log in</Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Link to="/signup">Sign up with RUNI Account</Link>

                </Button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-primary">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
              <div className="flex flex-col gap-6 pt-6">
                <Link
                  to="/"
                  className="flex items-center gap-2"
                  onClick={() => setMobileOpen(false)}
                >
                  <img
                    src={reichmanLogo}
                    alt="Reichman University"
                    className="h-8 w-8 object-contain"
                  />
                  <span className="font-bold text-primary">RUNI Market</span>
                </Link>

                <nav className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`rounded px-3 py-2.5 text-sm font-medium transition-colors ${
                        location.pathname === link.href
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>

                <div className="flex flex-col gap-2 border-t pt-4">
                  {user ? (
                    <>
                      <p className="px-3 text-sm font-medium">
                        {user.user_metadata?.full_name ?? user.email}
                      </p>
                      <Button
                        variant="outline"
                        className="border-primary text-primary"
                        onClick={() => { handleSignOut(); setMobileOpen(false); }}
                      >
                        Log out
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
                        <Link to="/login">Log in</Link>
                      </Button>
                      <Button asChild onClick={() => setMobileOpen(false)}>
                        <Link to="/signup">Sign up with RUNI Account</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
