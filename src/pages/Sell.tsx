import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Layout from "@/components/layout/Layout";
import { useCreateListing } from "@/hooks/useListings";
import { toast } from "@/hooks/use-toast";
import { ACTIVE_CATEGORIES, CONDITIONS } from "@/lib/constants";
import { PICKUP_LOCATIONS, pickupLabelKey } from "@/lib/pickup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import ImageUpload from "@/components/listings/ImageUpload";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

type FormValues = {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  pickupLocation: string;
};

const Sell = () => {
  const navigate = useNavigate();
  const createListing = useCreateListing();
  const [images, setImages] = useState<File[]>([]);
  const { t, tCategory, tCondition } = useLanguage();

  const schema = useMemo(() => z.object({
    title: z.string().trim().min(1, t("titleRequired")).max(100),
    description: z.string().trim().min(1, t("descriptionRequired")).max(2000),
    price: z.coerce.number().min(0, t("priceMin")),
    category: z.string().min(1, t("categoryRequired")),
    condition: z.string().min(1, t("conditionRequired")),
    pickupLocation: z.string().min(1, t("pickupLocationRequired")),
  }), [t]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", price: 0, category: "", condition: "", pickupLocation: "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const listing = await createListing.mutateAsync({
        title: values.title,
        description: values.description,
        price: values.price,
        category: values.category,
        condition: values.condition,
        pickupLocation: values.pickupLocation,
        images,
      });
      toast({ title: t("listingPosted") });
      navigate(`/listing/${listing.id}`);
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="container max-w-2xl py-6">
        <h1 className="mb-6 text-2xl font-bold">{t("postAListing")}</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("title")}</FormLabel>
                <FormControl><Input placeholder={t("titlePlaceholder")} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("description")}</FormLabel>
                <FormControl><Textarea placeholder={t("descriptionPlaceholder")} rows={4} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="price" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("priceShekel")}</FormLabel>
                <FormControl><Input type="number" min={0} step="1" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("category")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder={t("selectCategory")} /></SelectTrigger></FormControl>
                  <SelectContent>
                    {ACTIVE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{tCategory(c)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="condition" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("condition")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder={t("selectCondition")} /></SelectTrigger></FormControl>
                  <SelectContent>
                    {CONDITIONS.map((c) => <SelectItem key={c} value={c}>{tCondition(c)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="pickupLocation" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("pickupLocation")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder={t("selectPickupLocation")} /></SelectTrigger></FormControl>
                  <SelectContent>
                    {PICKUP_LOCATIONS.map((loc) => (
                      <SelectItem key={loc} value={loc}>{t(pickupLabelKey(loc))}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{t("pickupLocationHint")}</p>
                <FormMessage />
              </FormItem>
            )} />

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("photosUpTo")}</label>
              <ImageUpload images={images} onChange={setImages} />
            </div>

            <Button type="submit" className="w-full" disabled={createListing.isPending}>
              {createListing.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("postListing")}
            </Button>
          </form>
        </Form>
      </div>
    </Layout>
  );
};

export default Sell;
