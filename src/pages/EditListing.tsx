import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Layout from "@/components/layout/Layout";
import {
  useListing,
  useUpdateListing,
  useAddListingImages,
  useDeleteListingImage,
} from "@/hooks/useListings";
import { MAX_LISTING_IMAGES } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { CATEGORIES, CONDITIONS } from "@/lib/constants";
import { PICKUP_LOCATIONS, pickupLabelKey } from "@/lib/pickup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, X, ImagePlus } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

type FormValues = {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  pickupLocation: string;
};

const EditListing = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: listing, isLoading } = useListing(id);
  const updateListing = useUpdateListing();
  const addImages = useAddListingImages();
  const deleteImage = useDeleteListingImage();
  const { t, tCategory, tCondition } = useLanguage();

  const existingImages = [...(listing?.listing_images ?? [])].sort(
    (a, b) => a.display_order - b.display_order
  );

  const handleAddFiles = async (files: FileList | null) => {
    if (!files || !id) return;
    const slots = MAX_LISTING_IMAGES - existingImages.length;
    const newFiles = Array.from(files).slice(0, slots);
    if (newFiles.length === 0) return;
    const nextOrder =
      existingImages.length > 0
        ? Math.max(...existingImages.map((i) => i.display_order)) + 1
        : 0;
    try {
      await addImages.mutateAsync({ listingId: id, files: newFiles, startOrder: nextOrder });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    if (!id) return;
    try {
      await deleteImage.mutateAsync({ listingId: id, imageUrl });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    }
  };

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

  useEffect(() => {
    if (listing) {
      form.reset({
        title: listing.title,
        description: listing.description,
        price: listing.price,
        category: listing.category,
        condition: listing.condition,
        pickupLocation: listing.pickup_location ?? "on_campus",
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

            {/* Photo management — changes apply immediately */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("photosUpTo")}</label>
              <div className="grid grid-cols-3 gap-3">
                {existingImages.map((img) => (
                  <div
                    key={img.image_url}
                    className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
                  >
                    <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-1 top-1 h-6 w-6"
                      disabled={deleteImage.isPending}
                      onClick={() => handleDeleteImage(img.image_url)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {existingImages.length < MAX_LISTING_IMAGES && (
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 text-muted-foreground transition-colors hover:border-primary/50">
                    {addImages.isPending ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <ImagePlus className="h-6 w-6" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        handleAddFiles(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

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
