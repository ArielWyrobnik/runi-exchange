import Navbar from "./Navbar";
import Footer from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
  /** Pin the page to the viewport height with no page scroll and no
   *  footer — inner areas handle their own scrolling (e.g. Messages). */
  fullHeight?: boolean;
}

/** Main layout wrapper with Navbar and Footer */
const Layout = ({ children, fullHeight = false }: LayoutProps) => {
  if (fullHeight) {
    return (
      <div className="flex h-dvh flex-col">
        <Navbar />
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
