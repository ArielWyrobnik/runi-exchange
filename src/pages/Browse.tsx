import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import ListingCard from "@/components/listings/ListingCard";
import { useListings, type ListingFilters, type ListingSort } from "@/hooks/useListings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, CONDITIONS } from "@/lib/constants";
import { Search, Package, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const standardCategories = CATEGORIES.filter((category) => category !== "Tickets");

const Browse = () => {
  const { t, tCategory, tCondition } = useLanguage();
  const navigate = useNavigate();
  // The navbar and home category links navigate to /browse?search=...&category=...
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") ?? "";
  const urlCategory = searchParams.get("category") ?? "";
  const [search, setSearch] = useState(urlSearch);
  const [category, setCategory] = useState<string>(urlCategory);
  const [condition, setCondition] = useState<string>("");
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [sort, setSort] = useState<ListingSort>("newest");
  const PAGE_SIZE = 24;
  const [limit, setLimit] = useState(PAGE_SIZE);

  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    if (urlCategory === "Tickets") {
      navigate("/tickets", { replace: true });
      return;
    }
    setCategory(urlCategory);
  }, [navigate, urlCategory]);

  const handleCategoryChange = (value: string) => {
    if (value === "Tickets") {
      navigate("/tickets");
      return;
    }
    setCategory(value === "all" ? "" : value);
  };

  // Debounce typing so we don't fire a query per keystroke
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filters: ListingFilters = {
    search: debouncedSearch || undefined,
    category: category || undefined,
    condition: condition || undefined,
    priceMin: priceMin ? Number(priceMin) : undefined,
    priceMax: priceMax ? Number(priceMax) : undefined,
    sort,
    limit,
  };

  const { data: listings, isLoading } = useListings(filters);

  return (
    <Layout>
      <div className="container py-6">
        <h1 className="mb-6 text-2xl font-bold">{t("browseListings")}</h1>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
          <Input
            placeholder={t("searchListings")}
            className="pl-10 rtl:pl-3 rtl:pr-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("category")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Tickets" className="font-medium text-primary focus:text-primary">
                {tCategory("Tickets")}
              </SelectItem>
              <SelectItem value="all">{t("allCategories")}</SelectItem>
              {standardCategories.map((c) => (
                <SelectItem key={c} value={c}>{tCategory(c)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={condition} onValueChange={(v) => setCondition(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t("condition")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allConditions")}</SelectItem>
              {CONDITIONS.map((c) => (
                <SelectItem key={c} value={c}>{tCondition(c)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="number"
            placeholder={t("minPrice")}
            className="w-[100px]"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
          />
          <Input
            type="number"
            placeholder={t("maxPrice")}
            className="w-[100px]"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
          />

          <Select value={sort} onValueChange={(v) => setSort(v as ListingSort)}>
            <SelectTrigger className="w-[190px]">
              <SelectValue placeholder={t("sortBy")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t("sortNewest")}</SelectItem>
              <SelectItem value="price_asc">{t("sortPriceAsc")}</SelectItem>
              <SelectItem value="price_desc">{t("sortPriceDesc")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : listings && listings.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
            {listings.length === limit && (
              <div className="mt-6 text-center">
                <Button variant="outline" onClick={() => setLimit(limit + PAGE_SIZE)}>
                  {t("loadMore")}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex min-h-[30vh] flex-col items-center justify-center text-center">
            <Package className="mb-3 h-12 w-12 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{t("noListingsYet")}</h2>
            <p className="text-muted-foreground">{t("beFirstToSell")}</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Browse;
