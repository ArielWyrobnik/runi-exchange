import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Layout from "@/components/layout/Layout";
import { useListing, useUpdateListing } from "@/hooks/useListings";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { CATEGORIES, CONDITIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

type FormValues = {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
};

const EditListing = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: listing, isLoading } = useListing(id);
  const updateListing = useUpdateListing();
  const { t, tCategory, tCondition } = useLanguage();

  const schema = useMemo(() => z.object({
    title: z.string().trim().min(1, t("titleRequired")).max(100),
    description: z.string().trim().min(1, t("descriptionRequired")).max(2000),
    price: z.coerce.number().min(0, t("priceMin")),
    category: z.string().min(1, t("categoryRequired")),
    condition: z.string().min(1, t("conditionRequired")),
  }), [t]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", price: 0, category: "", condition: "" },
  });

  useEffect(() => {
    if (listing) {
      form.reset({
        title: listing.title,
        description: listing.description,
        price: listing.price,
        category: listing.category,
        condition: listing.condition,
      });
    }
  }, [listing, form]);

  const onSubmit = async (values: FormValues) => {
    if (!id) return;
    try {
      await updateListing.mutateAsync({ id, ...values });
      toast({ title: t("listingUpdated") });
      navigate(`/listing/${id}`);
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Only the owner may edit
  if (!listing || listing.seller_id !== user?.id) {
    return (
      <Layout>
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
          <h1 className="text-xl font-semibold">{t("listingNotFound")}</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-2xl py-6">
        <h1 className="mb-6 text-2xl font-bold">{t("editListing")}</h1>
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
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{tCategory(c)}</SelectItem>)}
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

            <Button type="submit" className="w-full" disabled={updateListing.isPending}>
              {updateListing.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("saveChanges")}
            </Button>
          </form>
        </Form>
      </div>
    </Layout>
  );
};

export default EditListing;
