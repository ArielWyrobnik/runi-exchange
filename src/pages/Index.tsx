import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Search, ShoppingBag, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <Layout>
      {/* Compact hero */}
      <section className="border-b bg-background">
        <div className="container mx-auto px-4 py-12 text-center md:py-16">
          <h1 className="text-2xl font-bold tracking-tight text-primary md:text-3xl lg:text-4xl">
            Buy & Sell Within Your Campus Community
          </h1>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            The marketplace built exclusively for Reichman University students.
          </p>
        </div>
      </section>

      {/* 3 info blocks (no heading) */}
      <section className="border-t bg-secondary/50 py-16">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: ShoppingBag,
                title: "List Your Item",
                description:
                  "Snap a few photos, set your price, and your listing is live in seconds.",
              },
              {
                icon: Search,
                title: "Find What You Need",
                description:
                  "Browse by category or search for exactly what you're looking for.",
              },
              {
                icon: Users,
                title: "Meet on Campus",
                description:
                  "Message the seller, agree on a spot, and make the exchange in person.",
              },
            ].map((step) => (
              <div
                key={step.title}
                className="flex flex-col items-center border bg-card p-8 text-center shadow-sm"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Listings */}
      <section className="container py-16">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Recent Listings</h2>
          <Button variant="ghost" size="sm" asChild className="text-primary hover:bg-primary/5">
            <Link to="/browse">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-6 border border-dashed bg-secondary/30 py-16 text-center">
          <p className="text-muted-foreground">
            No listings yet. Be the first to{" "}
            <Link to="/sell" className="font-medium text-primary underline">
              post something
            </Link>
            !
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
