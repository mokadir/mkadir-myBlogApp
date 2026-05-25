import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PostEditor } from "@/components/editor/post-editor";

export const metadata: Metadata = {
  title: "New Post",
  description: "Create a new blog post",
};

export default async function NewPostPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Post</h1>
        <p className="mt-2 text-muted-foreground">
          Write and publish a new blog post
        </p>
      </div>
      <PostEditor />
    </div>
  );
}