"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions, canWrite } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { postSchema, autoSaveSchema, categorySchema } from "@/lib/validations/post";
import { slugify, calculateReadTime } from "@/lib/utils";

// --- Post CRUD Actions ---

export async function createPost(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !canWrite(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const rawData = Object.fromEntries(formData);
  const data = postSchema.parse({
    ...rawData,
    tags: JSON.parse(rawData.tags as string || "[]"),
    featured: rawData.featured === "true",
  });

  const slug = slugify(data.title);
  const existingSlug = await prisma.post.findUnique({ where: { slug } });
  const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

  const post = await prisma.post.create({
    data: {
      title: data.title,
      subtitle: data.subtitle || null,
      slug: finalSlug,
      content: data.content,
      excerpt: data.excerpt || null,
      coverImage: data.coverImage || null,
      tags: data.tags,
      categoryId: data.categoryId || null,
      status: data.status,
      featured: data.featured,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      readTime: calculateReadTime(data.content),
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      authorId: session.user.id,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/posts");
  return post;
}

export async function updatePost(postId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error("Post not found");
  if (post.authorId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  const rawData = Object.fromEntries(formData);
  const data = postSchema.parse({
    ...rawData,
    tags: JSON.parse(rawData.tags as string || "[]"),
    featured: rawData.featured === "true",
  });

  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: {
      title: data.title,
      subtitle: data.subtitle || null,
      content: data.content,
      excerpt: data.excerpt || null,
      coverImage: data.coverImage || null,
      tags: data.tags,
      categoryId: data.categoryId || null,
      status: data.status,
      featured: data.featured,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      readTime: calculateReadTime(data.content),
      publishedAt:
        data.status === "PUBLISHED" && !post.publishedAt
          ? new Date()
          : post.publishedAt,
      ...(data.status === "DRAFT" ? { publishedAt: null } : {}),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/posts/${updatedPost.slug}`);
  revalidatePath("/posts");
  return updatedPost;
}

export async function deletePost(postId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error("Post not found");
  if (post.authorId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  await prisma.post.delete({ where: { id: postId } });
  revalidatePath("/dashboard");
  revalidatePath("/posts");
  return { success: true };
}

export async function publishPost(postId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error("Post not found");
  if (post.authorId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      status: "PUBLISHED",
      publishedAt: post.publishedAt || new Date(),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/posts/${updated.slug}`);
  return updated;
}

export async function unpublishPost(postId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error("Post not found");
  if (post.authorId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: { status: "DRAFT", publishedAt: null },
  });

  revalidatePath("/dashboard");
  return updated;
}

// --- Auto-Save Action ---

export async function autoSavePost(data: {
  postId?: string;
  title?: string;
  subtitle?: string;
  content?: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
  categoryId?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  const validated = autoSaveSchema.parse(data);

  if (validated.postId) {
    const existing = await prisma.post.findUnique({
      where: { id: validated.postId },
    });
    if (!existing || (existing.authorId !== session.user.id && session.user.role !== "ADMIN")) {
      throw new Error("Forbidden");
    }
    await prisma.post.update({
      where: { id: validated.postId },
      data: {
        ...(validated.title !== undefined && { title: validated.title }),
        ...(validated.subtitle !== undefined && { subtitle: validated.subtitle }),
        ...(validated.content !== undefined && { content: validated.content }),
        ...(validated.excerpt !== undefined && { excerpt: validated.excerpt }),
        ...(validated.coverImage !== undefined && { coverImage: validated.coverImage }),
        ...(validated.tags !== undefined && { tags: validated.tags }),
        ...(validated.categoryId !== undefined && { categoryId: validated.categoryId }),
      },
    });
    return { postId: validated.postId, saved: true };
  }

  // Create new draft post on first auto-save
  const slug = validated.title ? slugify(validated.title) : `draft-${Date.now()}`;
  const post = await prisma.post.create({
    data: {
      title: validated.title || "Untitled Draft",
      slug,
      content: validated.content || "",
      excerpt: validated.excerpt,
      coverImage: validated.coverImage,
      tags: validated.tags || [],
      categoryId: validated.categoryId,
      status: "DRAFT",
      authorId: session.user.id,
    },
  });

  return { postId: post.id, saved: true };
}

// --- Category Actions ---

export async function createCategory(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const rawData = Object.fromEntries(formData);
  const data = categorySchema.parse(rawData);
  const slug = slugify(data.name);

  const category = await prisma.category.create({
    data: {
      name: data.name,
      slug,
      description: data.description || null,
      color: data.color,
    },
  });

  revalidatePath("/dashboard");
  return category;
}

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });
}

export async function deleteCategory(categoryId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  await prisma.category.delete({ where: { id: categoryId } });
  revalidatePath("/dashboard");
  return { success: true };
}