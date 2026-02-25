import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ListingWithImages } from "@/hooks/useListings";

const ListingCard = ({ listing }: { listing: ListingWithImages }) => {
  const firstImage = listing.listing_images
    ?.sort((a, b) => a.display_order - b.display_order)[0]?.image_url;

  return (
    <Link to={`/listing/${listing.id}`}>
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="aspect-square overflow-hidden bg-muted">
          {firstImage ? (
            <img
              src={firstImage}
              alt={listing.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="line-clamp-1 font-medium">{listing.title}</h3>
          <p className="mt-1 text-lg font-bold text-primary">₪{listing.price}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-xs">{listing.condition}</Badge>
            <Badge variant="outline" className="text-xs">{listing.category}</Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ListingCard;
