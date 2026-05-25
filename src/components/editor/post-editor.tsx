"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import {
  Loader2,
  X,
  Save,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Settings,
  FileText,
  Search,
  Clock,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TiptapEditor } from "./tiptap-editor";
import { PostPreview } from "../posts/post-preview";
import {
  postSchema,
  type PostInput,
  type AutoSaveInput,
} from "@/lib/validations/post";
import { slugify, calculateReadTime } from "@/lib/utils";
import { autoSavePost, getCategories } from "@/lib/actions/post";
import type { CategoryWithCount } from "@/types";

interface PostEditorProps {
  initialData?: Partial<PostInput> & {
    id?: string;
    slug?: string;
    subtitle?: string;
    seoTitle?: string;
    seoDescription?: string;
  };
}

export function PostEditor({ initialData }: PostEditorProps) {
  const router = useRouter();
  const [content, setContent] = React.useState(initialData?.content || "");
  const [tagInput, setTagInput] = React.useState("");
  const [tags, setTags] = React.useState<string[]>(initialData?.tags || []);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isAutoSaving, setIsAutoSaving] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const [showPreview, setShowPreview] = React.useState(false);
  const [showSEOSettings, setShowSEOSettings] = React.useState(false);
  const [categories, setCategories] = React.useState<CategoryWithCount[]>([]);
  const [postId, setPostId] = React.useState(initialData?.id || "");
  const [previewContent, setPreviewContent] = React.useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
  } = useForm<PostInput>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: initialData?.title || "",
      subtitle: initialData?.subtitle || "",
      excerpt: initialData?.excerpt || "",
      coverImage: initialData?.coverImage || "",
      tags: initialData?.tags || [],
      categoryId: initialData?.categoryId || "",
      status: (initialData?.status as any) || "DRAFT",
      featured: initialData?.featured || false,
      seoTitle: initialData?.seoTitle || "",
      seoDescription: initialData?.seoDescription || "",
    },
  });

  const title = watch("title");
  const excerpt = watch("excerpt");
  const seoTitle = watch("seoTitle");
  const seoDescription = watch("seoDescription");
  const coverImage = watch("coverImage");
  const categoryId = watch("categoryId");
  const status = watch("status");
  const subtitle = watch("subtitle");

  // Load categories
  React.useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  // Auto-save every 30 seconds
  React.useEffect(() => {
    const saveTimer = setTimeout(async () => {
      const currentTitle = getValues("title");
      if (!currentTitle && !content) return;

      setIsAutoSaving(true);
      try {
        const result = await autoSavePost({
          postId: postId || undefined,
          title: currentTitle,
          subtitle: getValues("subtitle"),
          content,
          excerpt: getValues("excerpt"),
          coverImage: getValues("coverImage"),
          tags,
          categoryId: getValues("categoryId"),
        });
        if (result.postId && !postId) {
          setPostId(result.postId);
          // Update URL without navigation
          window.history.replaceState(
            {},
            "",
            `/dashboard/${result.postId}/edit`
          );
        }
        setLastSaved(new Date());
      } catch {
        // Silent fail for auto-save
      } finally {
        setIsAutoSaving(false);
      }
    }, 30000); // Every 30 seconds

    return () => clearTimeout(saveTimer);
  }, [content, tags, postId, getValues]);

  // Update preview when content changes
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setPreviewContent(content);
    }, 500);
    return () => clearTimeout(timer);
  }, [content]);

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      const newTags = [...tags, trimmedTag];
      setTags(newTags);
      setValue("tags", newTags);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((t) => t !== tagToRemove);
    setTags(newTags);
    setValue("tags", newTags);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const manualAutoSave = async () => {
    setIsAutoSaving(true);
    try {
      const result = await autoSavePost({
        postId: postId || undefined,
        title: getValues("title"),
        subtitle: getValues("subtitle"),
        content,
        excerpt: getValues("excerpt"),
        coverImage: getValues("coverImage"),
        tags,
        categoryId: getValues("categoryId"),
      });
      if (result.postId && !postId) {
        setPostId(result.postId);
        window.history.replaceState(
          {},
          "",
          `/dashboard/${result.postId}/edit`
        );
      }
      setLastSaved(new Date());
      toast.success("Draft saved");
    } catch {
      toast.error("Failed to save draft");
    } finally {
      setIsAutoSaving(false);
    }
  };

  async function onSubmit(data: PostInput) {
    setIsLoading(true);

    try {
      const payload = {
        ...data,
        content,
        tags,
        slug: slugify(data.title),
        readTime: calculateReadTime(content),
      };

      const url = postId ? `/api/posts/${postId}` : "/api/posts";
      const method = postId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save post");
      }

      const result = await response.json();
      toast.success(
        data.status === "PUBLISHED" ? "Post published!" : "Post saved as draft!"
      );
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsLoading(false);
    }
  }

  const seoTitleCharsLeft = 70 - (seoTitle?.length || 0);
  const seoDescCharsLeft = 160 - (seoDescription?.length || 0);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      {/* Main Content */}
      <div className="space-y-6">
        <Tabs
          defaultValue="editor"
          value={showPreview ? "preview" : "editor"}
          onValueChange={(v) => setShowPreview(v === "preview")}
        >
          <TabsList>
            <TabsTrigger value="editor">
              <FileText className="mr-2 h-4 w-4" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="mt-4 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter your post title"
                className="text-2xl font-bold"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
              {title && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Slug: /posts/{slugify(title)}</span>
                  <span>·</span>
                  <span>
                    {calculateReadTime(content || "")} min read
                  </span>
                </div>
              )}
            </div>

            {/* Subtitle */}
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                placeholder="A brief subtitle for your post"
                className="text-lg"
                {...register("subtitle")}
              />
            </div>

            {/* Content Editor */}
            <div className="space-y-2">
              <Label>Content *</Label>
              <TiptapEditor
                content={content}
                onChange={setContent}
                placeholder="Start writing your story..."
              />
              {errors.content && (
                <p className="text-sm text-destructive">
                  {errors.content.message}
                </p>
              )}
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                placeholder="Brief summary of your post (shown in cards)"
                rows={3}
                {...register("excerpt")}
              />
              {excerpt && (
                <p className="text-xs text-muted-foreground">
                  {excerpt.length}/500 characters
                </p>
              )}
            </div>

            {/* SEO Settings Toggle */}
            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSEOSettings(!showSEOSettings)}
              >
                <Search className="mr-2 h-4 w-4" />
                {showSEOSettings ? "Hide" : "Show"} SEO Settings
              </Button>

              {showSEOSettings && (
                <div className="mt-4 space-y-4 rounded-lg border p-4">
                  <div className="space-y-2">
                    <Label htmlFor="seoTitle">
                      SEO Title
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({seoTitleCharsLeft} chars left)
                      </span>
                    </Label>
                    <Input
                      id="seoTitle"
                      placeholder="Custom SEO title (defaults to post title)"
                      {...register("seoTitle")}
                    />
                    {seoTitleCharsLeft < 0 && (
                      <p className="text-xs text-destructive">
                        SEO title is too long (max 70 characters)
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seoDescription">
                      SEO Description
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({seoDescCharsLeft} chars left)
                      </span>
                    </Label>
                    <Textarea
                      id="seoDescription"
                      placeholder="Meta description for search engines"
                      rows={2}
                      {...register("seoDescription")}
                    />
                    {seoDescCharsLeft < 0 && (
                      <p className="text-xs text-destructive">
                        SEO description is too long (max 160 characters)
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <PostPreview
              title={title || "Untitled Post"}
              subtitle={subtitle}
              content={previewContent}
              excerpt={excerpt}
              coverImage={coverImage}
              tags={tags}
              readTime={calculateReadTime(content || "")}
              authorName="You"
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Auto-save Status */}
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isAutoSaving ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </>
              ) : lastSaved ? (
                <>
                  <Check className="h-3 w-3 text-green-500" />
                  Saved {lastSaved.toLocaleTimeString()}
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3" />
                  Auto-save active
                </>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={manualAutoSave}
              disabled={isAutoSaving}
            >
              <Save className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Cover Image */}
        <div className="rounded-lg border p-4">
          <Label className="mb-2 block">Cover Image</Label>
          {coverImage ? (
            <div className="relative mb-2 h-32 overflow-hidden rounded-md">
              <Image
                src={coverImage}
                alt="Cover"
                fill
                className="object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute right-1 top-1 h-6 w-6"
                onClick={() => setValue("coverImage", "")}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="mb-2 flex h-32 items-center justify-center rounded-md border border-dashed">
              <div className="text-center">
                <ImageIcon className="mx-auto mb-1 h-6 w-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Enter URL or upload
                </p>
              </div>
            </div>
          )}
          <Input
            placeholder="https://images.unsplash.com/..."
            {...register("coverImage")}
          />
        </div>

        {/* Publish Settings */}
        <div className="rounded-lg border p-4">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Settings className="h-4 w-4" />
            Publish Settings
          </h3>

          <div className="space-y-4">
            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={status}
                onChange={(e) =>
                  setValue("status", e.target.value as any)
                }
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={categoryId}
                {...register("categoryId")}
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat._count.posts})
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags (max 5)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTag}
                  disabled={tags.length >= 5 || !tagInput.trim()}
                >
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Featured Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featured"
                {...register("featured")}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="featured" className="text-sm">
                Featured post
              </Label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            className="w-full"
            disabled={isLoading}
            onClick={handleSubmit((data) =>
              onSubmit({ ...data, status: "PUBLISHED" })
            )}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            Publish
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isLoading}
            onClick={handleSubmit((data) =>
              onSubmit({ ...data, status: "DRAFT" })
            )}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Draft
          </Button>
        </div>
      </div>
    </div>
  );
}