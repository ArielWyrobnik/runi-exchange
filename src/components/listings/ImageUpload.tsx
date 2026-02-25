import { useCallback, useState } from "react";
import { X, ImagePlus } from "lucide-react";
import { MAX_LISTING_IMAGES } from "@/lib/constants";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  images: File[];
  onChange: (files: File[]) => void;
}

const ImageUpload = ({ images, onChange }: ImageUploadProps) => {
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const newFiles = Array.from(files).slice(0, MAX_LISTING_IMAGES - images.length);
      onChange([...images, ...newFiles]);
    },
    [images, onChange]
  );

  const removeFile = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {images.length < MAX_LISTING_IMAGES && (
        <label
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        >
          <ImagePlus className="mb-2 h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Drop images here or click to upload ({images.length}/{MAX_LISTING_IMAGES})
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </label>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((file, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
              <img
                src={URL.createObjectURL(file)}
                alt={`Upload ${i + 1}`}
                className="h-full w-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute right-1 top-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => removeFile(i)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
