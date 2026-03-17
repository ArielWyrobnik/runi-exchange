import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Search, ShoppingBag, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { CATEGORIES } from "@/lib/constants";

const Index = () => {
  return (
    <Layout>
      {/* Hero Section — full-width image style like runi.ac.il */}
      <section className="relative overflow-hidden bg-primary">
        {/* Background image overlay */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80')] bg-cover bg-center opacity-20" />
        <div className="relative z-10 px-4 py-24 md:py-32">
          <div className="container mx-auto max-w-3xl">
            {/* Text block with semi-transparent blue background like runi.ac.il hero */}
            <div className="inline-block">
              <div className="bg-primary/80 px-6 py-4">
                <h1 className="text-3xl font-bold tracking-tight text-primary-foreground md:text-5xl lg:text-6xl !text-primary-foreground">
                  Buy & Sell Within Your
                  <span className="block">Campus Community</span>
                </h1>
              </div>
              <div className="mt-1 inline-block bg-background/90 px-6 py-2">
                <p className="text-sm font-medium text-primary md:text-base">
                  The marketplace built exclusively for Reichman University students.
                </p>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10 font-semibold"
                asChild
              >
                <Link to="/browse">
                  <Search className="mr-2 h-4 w-4" />
                  Browse Listings
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10 font-semibold"
                asChild
              >
                <Link to="/sell">
                  Start Selling
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Category Quick Filters */}
      <section className="container py-14">
        <h2 className="mb-8 text-center text-2xl font-semibold">Shop by Category</h2>
        <div className="flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((category) => (
            <Link
              key={category}
              to={`/browse?category=${encodeURIComponent(category)}`}
              className="rounded border border-primary/20 bg-background px-5 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              {category}
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works — clean institutional cards */}
      <section className="border-t bg-secondary/50 py-16">
        <div className="container">
          <h2 className="mb-10 text-center text-2xl font-semibold">How It Works</h2>
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
