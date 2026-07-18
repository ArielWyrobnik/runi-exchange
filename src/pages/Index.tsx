import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Armchair, Bike, CookingPot, Dumbbell, Package, Tablet, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useListings } from "@/hooks/useListings";
import ListingCard from "@/components/listings/ListingCard";
import { TICKETS_ENABLED } from "@/lib/constants";

const categoryLinks = [
  ...(TICKETS_ENABLED
    ? [{ icon: Ticket, category: "Tickets", sublabel: "RUNI Tickets", to: "/tickets", isSpecial: true }]
    : []),
  { icon: Armchair, category: "Furniture", to: "/browse?category=Furniture" },
  { icon: Tablet, category: "Electronics", to: "/browse?category=Electronics" },
  { icon: Package, category: "Dorm Accessories", to: "/browse?category=Dorm%20Accessories" },
  { icon: Dumbbell, category: "Sports & Outdoors", to: "/browse?category=Sports%20%26%20Outdoors" },
  { icon: CookingPot, category: "Kitchen & Appliances", to: "/browse?category=Kitchen%20%26%20Appliances" },
  { icon: Bike, category: "Transportation", to: "/browse?category=Transportation" },
];

const Index = () => {
  const { t, tCategory } = useLanguage();
  const { data: listings } = useListings({ limit: 8 });

  return (
    <Layout>
      {/* Compact hero */}
      <section className="border-b bg-background">
        <div className="container mx-auto px-4 py-7 text-center md:py-9">
          <h1 className="text-2xl font-bold tracking-tight text-primary md:text-3xl lg:text-4xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            {t("heroSubtitle")}
          </p>
        </div>
      </section>

      {/* Category shortcuts */}
      <section className="border-b bg-secondary/50 py-8">
        <div className="container">
          <div
            className={`grid grid-cols-2 gap-3 ${
              categoryLinks.length === 6 ? "sm:grid-cols-3 lg:grid-cols-6" : "sm:grid-cols-4 lg:grid-cols-4"
            }`}
          >
            {categoryLinks.map((category) => (
              <Link
                key={category.category}
                to={category.to}
                className={`group flex min-h-28 flex-col items-center justify-center border bg-card px-4 py-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md ${
                  category.isSpecial
                    ? "border-primary/40 bg-blue-50/60 text-primary hover:border-primary/60 hover:bg-blue-50"
                    : ""
                }`}
              >
                <div
                  className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${
                    category.isSpecial
                      ? "bg-blue-100 text-primary"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  <category.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold leading-tight md:text-base">
                  {tCategory(category.category)}
                </span>
                {category.sublabel && (
                  <span className="mt-1 text-xs font-medium text-primary">
                    {tCategory(category.sublabel)}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Listings */}
      <section className="container pb-12 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{t("recentListings")}</h2>
          <Button variant="ghost" size="sm" asChild className="text-primary hover:bg-primary/5">
            <Link to="/browse">
              {t("viewAll")} <ArrowRight className="ml-1 h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
        {listings && listings.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="mt-6 border border-dashed bg-secondary/30 py-16 text-center">
            <p className="text-muted-foreground">
              {t("noListingsBeFirst")} {" "}
              <Link to="/sell" className="font-medium text-primary underline">
                {t("postSomething")}
              </Link>
              !
            </p>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Index;
