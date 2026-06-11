import { describe, it, expect } from "vitest";
import { storagePathFromPublicUrl } from "@/lib/image";

describe("storagePathFromPublicUrl", () => {
  it("extracts the object path from a public bucket URL", () => {
    const url =
      "https://example.supabase.co/storage/v1/object/public/listing-images/user-id/listing-id/0-photo.jpg";
    expect(storagePathFromPublicUrl(url, "listing-images")).toBe(
      "user-id/listing-id/0-photo.jpg"
    );
  });

  it("returns null when the bucket is not in the URL", () => {
    expect(storagePathFromPublicUrl("https://example.com/foo.jpg", "listing-images")).toBeNull();
  });
});
