import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Armchair, Dumbbell, Package, Tablet, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useListings } from "@/hooks/useListings";
import ListingCard from "@/components/listings/ListingCard";

const categoryLinks = [
  { icon: Ticket, label: "Tickets", sublabel: "RUNI Tickets", to: "/tickets", isSpecial: true },
  { icon: Armchair, label: "Furniture", to: "/browse?category=Furniture" },
  { icon: Tablet, label: "Electronic Devices", to: "/browse?category=Electronics" },
  { icon: Package, label: "Dorm Accessories", to: "/browse?category=Other&search=dorm" },
  { icon: Dumbbell, label: "Sports & Outdoor", to: "/browse?category=Sports%20%26%20Outdoors" },
];

const Index = () => {
  const { t } = useLanguage();
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
      <section className="border-t bg-secondary/50 py-8">
        <div className="container">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {categoryLinks.map((category) => (
              <Link
                key={category.label}
                to={category.to}
                className={`group flex min-h-28 flex-col items-center justify-center border bg-card px-4 py-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md ${
                  category.isSpecial
                    ? "border-red-500 bg-red-50/60 text-red-700 hover:border-red-600 hover:bg-red-50"
                    : ""
                }`}
              >
                <div
                  className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${
                    category.isSpecial
                      ? "bg-red-100 text-red-700"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  <category.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold leading-tight md:text-base">
                  {category.label}
                </span>
                {category.sublabel && (
                  <span className="mt-1 text-xs font-medium text-red-600">
                    {category.sublabel}
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
