import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Search, MessageCircle, Tag } from "lucide-react";
import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import reichmanLogo from "@/assets/reichman-logo.png";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { user, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/browse?search=${encodeURIComponent(q)}` : "/browse");
  };

  return (
    <header className="sticky top-0 z-50 bg-background">
      {/* Top navbar — logo + auth */}
      <div className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between gap-4">
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

          {/* Desktop auth buttons */}
          <div className="hidden items-center gap-3 md:flex">
            <Button
              size="sm"
              asChild
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Link to="/sell">
                <Tag className="mr-1 h-4 w-4" />
                Start Selling
              </Link>
            </Button>
            {user && (
              <Button
                size="sm"
                asChild
                variant="ghost"
                className="text-primary hover:bg-primary/5"
              >
                <Link to="/messages">
                  <MessageCircle className="mr-1 h-4 w-4" />
                  Messages
                </Link>
              </Button>
            )}
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
                  <Link
                    to="/sell"
                    onClick={() => setMobileOpen(false)}
                    className="rounded px-3 py-2.5 text-sm font-medium text-primary hover:bg-accent"
                  >
                    Start Selling
                  </Link>
                  {user && (
                    <Link
                      to="/messages"
                      onClick={() => setMobileOpen(false)}
                      className="rounded px-3 py-2.5 text-sm font-medium text-primary hover:bg-accent"
                    >
                      Messages
                    </Link>
                  )}
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

      {/* Search bar row — eBay style */}
      <div className="border-b bg-background">
        <div className="container py-3">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for anything"
                className="h-11 rounded-full pl-10 pr-4 border-2 border-primary/30 focus-visible:border-primary"
              />
            </div>
            <Button
              type="submit"
              className="h-11 rounded-full px-6 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Search
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
