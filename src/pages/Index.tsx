import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Search, ShoppingBag, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { CATEGORIES } from "@/lib/constants";

const Index = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary px-4 py-20 text-primary-foreground md:py-28">
        <div className="container relative z-10 mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
            Buy & Sell Within Your
            <span className="block">Campus Community</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80">
            The marketplace built exclusively for Reichman University students.
            Find great deals or sell items you no longer need — all on campus.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              variant="outline"
              className="w-full border-primary-foreground/30 text-secondary-foreground hover:bg-primary-foreground/10 sm:w-auto"
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
              className="w-full border-primary-foreground/30 text-secondary-foreground hover:bg-primary-foreground/10 sm:w-auto"
              asChild
            >
              <Link to="/create-listing">
                Start Selling
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        {/* Decorative blobs */}
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary-foreground/5 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-primary-foreground/5 blur-3xl" />
      </section>

      {/* Category Quick Filters */}
      <section className="container py-12">
        <h2 className="mb-6 text-center text-2xl font-bold">Shop by Category</h2>
        <div className="flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((category) => (
            <Link
              key={category}
              to={`/browse?category=${encodeURIComponent(category)}`}
              className="rounded-full border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {category}
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container">
          <h2 className="mb-10 text-center text-2xl font-bold">How It Works</h2>
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
                className="flex flex-col items-center rounded-xl bg-card p-6 text-center shadow-sm"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Listings placeholder */}
      <section className="container py-16">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Recent Listings</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/browse">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-6 rounded-xl border border-dashed bg-muted/30 py-16 text-center">
          <p className="text-muted-foreground">
            No listings yet. Be the first to{" "}
            <Link to="/create-listing" className="font-medium text-primary underline">
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
