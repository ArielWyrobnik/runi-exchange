import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Layout from "@/components/layout/Layout";
import { useCreateListing } from "@/hooks/useListings";
import { toast } from "@/hooks/use-toast";
import { CATEGORIES, CONDITIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import ImageUpload from "@/components/listings/ImageUpload";
import { Loader2 } from "lucide-react";

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100),
  description: z.string().trim().min(1, "Description is required").max(2000),
  price: z.coerce.number().min(0, "Price must be 0 or more"),
  category: z.string().min(1, "Select a category"),
  condition: z.string().min(1, "Select condition"),
});

type FormValues = z.infer<typeof schema>;

const Sell = () => {
  const navigate = useNavigate();
  const createListing = useCreateListing();
  const [images, setImages] = useState<File[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", price: 0, category: "", condition: "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const listing = await createListing.mutateAsync({
        title: values.title,
        description: values.description,
        price: values.price,
        category: values.category,
        condition: values.condition,
        images,
      });
      toast({ title: "Listing posted!" });
      navigate(`/listing/${listing.id}`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="container max-w-2xl py-6">
        <h1 className="mb-6 text-2xl font-bold">Post a Listing</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl><Input placeholder="What are you selling?" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea placeholder="Describe your item..." rows={4} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="price" render={({ field }) => (
              <FormItem>
                <FormLabel>Price (₪)</FormLabel>
                <FormControl><Input type="number" min={0} step="1" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="condition" render={({ field }) => (
              <FormItem>
                <FormLabel>Condition</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <div className="space-y-2">
              <label className="text-sm font-medium">Photos (up to 3)</label>
              <ImageUpload images={images} onChange={setImages} />
            </div>

            <Button type="submit" className="w-full" disabled={createListing.isPending}>
              {createListing.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Post Listing
            </Button>
          </form>
        </Form>
      </div>
    </Layout>
  );
};

export default Sell;
