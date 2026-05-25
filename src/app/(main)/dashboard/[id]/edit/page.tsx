import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PostEditor } from "@/components/editor/post-editor";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Edit Post",
  description: "Edit your blog post",
};

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const post = await prisma.post.findUnique({
    where: { id },
  });

  if (!post) {
    notFound();
  }

  if (post.authorId !== session.user.id) {
    redirect("/dashboard");
  }

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Post</h1>
        <p className="mt-2 text-muted-foreground">Update your blog post</p>
      </div>
      <PostEditor
        initialData={{
          id: post.id,
          title: post.title,
          content: post.content,
          excerpt: post.excerpt || "",
          coverImage: post.coverImage || "",
          tags: post.tags,
          status: post.status,
          featured: post.featured,
          slug: post.slug,
        }}
      />
    </div>
  );
}