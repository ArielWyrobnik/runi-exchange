import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Ticket } from "lucide-react";
import { Link } from "react-router-dom";

const Tickets = () => {
  return (
    <Layout>
      <section className="container py-10 md:py-14">
        <div className="mx-auto flex max-w-3xl flex-col items-center border border-red-200 bg-red-50/60 px-6 py-12 text-center shadow-sm">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-700">
            <Ticket className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold text-red-700 md:text-4xl">RUNI Tickets</h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
            Ticket exchange for RUNI parties is coming soon.
          </p>
          <Button asChild className="mt-6">
            <Link to="/browse">
              Browse RUNI Market <ArrowRight className="ml-2 h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Tickets;
