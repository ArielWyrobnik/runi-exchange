import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Search, ShoppingBag, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

const Index = () => {
  const { t } = useLanguage();

  const steps = [
    { icon: ShoppingBag, title: t("listYourItem"), description: t("listYourItemDesc") },
    { icon: Search, title: t("findWhatYouNeed"), description: t("findWhatYouNeedDesc") },
    { icon: Users, title: t("meetOnCampus"), description: t("meetOnCampusDesc") },
  ];

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

      {/* 3 info blocks (no heading) */}
      <section className="border-t bg-secondary/50 py-10">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.title}
                className="flex flex-col items-center border bg-card p-6 text-center shadow-sm"
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
      <section className="container pb-12 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{t("recentListings")}</h2>
          <Button variant="ghost" size="sm" asChild className="text-primary hover:bg-primary/5">
            <Link to="/browse">
              {t("viewAll")} <ArrowRight className="ml-1 h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
        <div className="mt-6 border border-dashed bg-secondary/30 py-16 text-center">
          <p className="text-muted-foreground">
            {t("noListingsBeFirst")}{" "}
            <Link to="/sell" className="font-medium text-primary underline">
              {t("postSomething")}
            </Link>
            !
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
