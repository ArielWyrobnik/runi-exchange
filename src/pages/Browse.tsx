import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import ListingCard from "@/components/listings/ListingCard";
import { useListings, type ListingFilters, type ListingSort } from "@/hooks/useListings";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, CONDITIONS } from "@/lib/constants";
import { Search, Package, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const Browse = () => {
  const { t, tCategory, tCondition } = useLanguage();
  // The navbar search navigates to /browse?search=… — pick it up here
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") ?? "";
  const [search, setSearch] = useState(urlSearch);
  const [category, setCategory] = useState<string>("");
  const [condition, setCondition] = useState<string>("");
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [sort, setSort] = useState<ListingSort>("newest");

  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  const filters: ListingFilters = {
    search: search || undefined,
    category: category || undefined,
    condition: condition || undefined,
    priceMin: priceMin ? Number(priceMin) : undefined,
    priceMax: priceMax ? Number(priceMax) : undefined,
    sort,
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
          <Select value={category} onValueChange={(v) => setCategory(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("category")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allCategories")}</SelectItem>
              {CATEGORIES.map((c) => (
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
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
