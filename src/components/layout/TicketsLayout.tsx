import TicketsNavbar from "./TicketsNavbar";
import Footer from "./Footer";

const TicketsLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen flex-col">
    <TicketsNavbar />
    <main className="flex-1">{children}</main>
    <Footer variant="tickets" />
  </div>
);

export default TicketsLayout;
