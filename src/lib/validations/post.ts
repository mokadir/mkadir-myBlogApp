import { z } from "zod";

export const postSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters"),
  subtitle: z
    .string()
    .max(500, "Subtitle must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  content: z
    .string()
    .min(1, "Content is required")
    .min(10, "Content must be at least 10 characters"),
  excerpt: z
    .string()
    .max(500, "Excerpt must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  coverImage: z.string().url("Invalid image URL").optional().or(z.literal("")),
  tags: z
    .array(z.string().max(30, "Tag must be less than 30 characters"))
    .max(5, "Maximum 5 tags allowed"),
  categoryId: z.string().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  featured: z.boolean(),
  seoTitle: z
    .string()
    .max(70, "SEO title must be less than 70 characters")
    .optional()
    .or(z.literal("")),
  seoDescription: z
    .string()
    .max(160, "SEO description must be less than 160 characters")
    .optional()
    .or(z.literal("")),
});

export const autoSaveSchema = z.object({
  postId: z.string().optional(),
  title: z.string().max(200).optional(),
  subtitle: z.string().max(500).optional(),
  content: z.string().optional(),
  excerpt: z.string().max(500).optional(),
  coverImage: z.string().optional(),
  tags: z.array(z.string()).max(5).optional(),
  categoryId: z.string().optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
});

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
  description: z
    .string()
    .max(200, "Description must be less than 200 characters")
    .optional()
    .or(z.literal("")),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid hex color")
    .default("#6366f1"),
});

export const commentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment is required")
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment must be less than 1000 characters"),
});

export type PostInput = z.infer<typeof postSchema>;
export type AutoSaveInput = z.infer<typeof autoSaveSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type CommentInput = z.infer<typeof commentSchema>;