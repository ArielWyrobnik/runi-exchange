import { Link } from "react-router-dom";
import reichmanLogo from "@/assets/reichman-logo.png";

const Footer = () => {
  return (
    <footer className="border-t bg-primary text-primary-foreground">
      <div className="container py-10">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          {/* Logo + tagline */}
          <div className="flex items-center gap-3">
            <img
              src={reichmanLogo}
              alt="Reichman University"
              className="h-10 w-10 rounded-full bg-primary-foreground/10 object-contain p-0.5"
            />
            <div>
              <p className="font-bold">RUNI Market</p>
              <p className="text-xs text-primary-foreground/70">
                Made by students, for students.
              </p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex gap-8 text-sm font-medium">
            <Link to="/browse" className="transition-opacity hover:opacity-80">
              Browse
            </Link>
            <Link to="/sell" className="transition-opacity hover:opacity-80">
              Sell
            </Link>
            <Link to="/messages" className="transition-opacity hover:opacity-80">
              Messages
            </Link>
          </nav>
        </div>

        <div className="mt-8 border-t border-primary-foreground/20 pt-6 text-center text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} RUNI Market · Reichman University, Herzliya
        </div>
      </div>
    </footer>
  );
};

export default Footer;
