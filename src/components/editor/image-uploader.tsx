"use client";

import * as React from "react";
import Image from "next/image";
import { Upload, X, Loader2, Image as ImageIcon, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import toast from "react-hot-toast";

interface ImageUploaderProps {
  onUpload: (url: string) => void;
  currentImage?: string;
}

export function ImageUploader({ onUpload, currentImage }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [urlInput, setUrlInput] = React.useState("");
  const [preview, setPreview] = React.useState(currentImage || "");

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      toast.error("Please enter an image URL");
      return;
    }
    setPreview(urlInput);
    onUpload(urlInput);
    toast.success("Image added");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "modernblog");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setPreview(data.secure_url);
      onUpload(data.secure_url);
      toast.success("Image uploaded successfully");
    } catch {
      toast.error("Failed to upload image. Using URL fallback.");

      // Fallback: create object URL
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      onUpload(objectUrl);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview("");
    setUrlInput("");
    onUpload("");
  };

  return (
    <div className="space-y-3">
      {/* Preview */}
      {preview ? (
        <div className="relative h-40 overflow-hidden rounded-md border">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2 h-7 w-7"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
          <div className="text-center">
            <ImageIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Upload an image or enter a URL
            </p>
          </div>
        </div>
      )}

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="upload" className="flex-1">
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="url" className="flex-1">
            <Link className="mr-2 h-4 w-4" />
            URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 cursor-pointer opacity-0"
              disabled={isUploading}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Choose Image
                </>
              )}
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            PNG, JPG, WebP up to 5MB
          </p>
        </TabsContent>

        <TabsContent value="url">
          <div className="flex gap-2">
            <Input
              placeholder="https://images.unsplash.com/..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
            />
            <Button type="button" variant="outline" onClick={handleUrlSubmit}>
              Add
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}