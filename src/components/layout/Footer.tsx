import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container flex flex-col items-center gap-4 py-8 text-sm text-muted-foreground md:flex-row md:justify-between">
        <p>© {new Date().getFullYear()} RUNI Market. Made by students, for students.</p>
        <nav className="flex gap-6">
          <Link to="/browse" className="transition-colors hover:text-foreground">
            Browse
          </Link>
          <Link to="/create-listing" className="transition-colors hover:text-foreground">
            Sell
          </Link>
          <Link to="/messages" className="transition-colors hover:text-foreground">
            Messages
          </Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
