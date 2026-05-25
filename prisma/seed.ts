import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@modernblog.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@modernblog.com",
      password: adminPassword,
      role: "ADMIN",
      emailVerified: new Date(),
      bio: "Blog administrator and content curator.",
    },
  });

  // Create demo user
  const userPassword = await hash("user123", 12);
  const user = await prisma.user.upsert({
    where: { email: "user@modernblog.com" },
    update: {},
    create: {
      name: "John Doe",
      email: "user@modernblog.com",
      password: userPassword,
      role: "READER",
      emailVerified: new Date(),
      bio: "A passionate writer exploring the world of technology and design.",
    },
  });

  // Create sample posts
  const posts = [
    {
      title: "Getting Started with Next.js 15",
      slug: "getting-started-with-nextjs-15",
      excerpt:
        "Learn how to build modern web applications with Next.js 15 and its powerful new features.",
      content: `<h2>Introduction</h2>
<p>Next.js 15 brings exciting new features to the React ecosystem. In this post, we'll explore the key improvements and how to get started.</p>
<h2>Key Features</h2>
<ul>
<li>Improved performance with React Server Components</li>
<li>Enhanced routing with App Router</li>
<li>Better data fetching with Server Actions</li>
<li>Streamlined development experience</li>
</ul>
<h2>Getting Started</h2>
<p>To create a new Next.js 15 project, run:</p>
<pre><code>npx create-next-app@latest my-app</code></pre>
<p>This will set up a new project with all the latest features.</p>`,
      coverImage:
        "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&q=80",
      tags: ["nextjs", "react", "web-development"],
      published: true,
      featured: true,
      authorId: admin.id,
    },
    {
      title: "The Art of Modern UI Design",
      slug: "the-art-of-modern-ui-design",
      excerpt:
        "Explore the principles of modern UI design and how to create beautiful, user-friendly interfaces.",
      content: `<h2>Design Principles</h2>
<p>Modern UI design is about creating interfaces that are both beautiful and functional. Here are some key principles to follow.</p>
<h2>Clean & Minimal</h2>
<p>Less is more. Focus on essential elements and remove unnecessary clutter.</p>
<h2>Consistency</h2>
<p>Maintain consistent patterns throughout your application for better user experience.</p>`,
      coverImage:
        "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
      tags: ["design", "ui", "ux"],
      published: true,
      featured: true,
      authorId: user.id,
    },
    {
      title: "TypeScript Best Practices for 2024",
      slug: "typescript-best-practices-2024",
      excerpt:
        "Discover the best practices for writing clean, maintainable TypeScript code in your projects.",
      content: `<h2>Why TypeScript?</h2>
<p>TypeScript continues to grow in popularity. Here are the best practices you should follow.</p>
<h2>1. Use Strict Mode</h2>
<p>Enable strict mode in your tsconfig.json for better type safety.</p>
<h2>2. Prefer Interfaces Over Types</h2>
<p>Use interfaces for object shapes and types for unions and aliases.</p>`,
      coverImage:
        "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&q=80",
      tags: ["typescript", "javascript", "programming"],
      published: true,
      featured: false,
      authorId: admin.id,
    },
    {
      title: "Building Scalable APIs with Node.js",
      slug: "building-scalable-apis-with-nodejs",
      excerpt:
        "Learn how to design and build scalable RESTful APIs using Node.js and Express.",
      content: `<h2>Architecture</h2>
<p>A well-designed API architecture is crucial for scalability. Let's explore the best approaches.</p>
<h2>Best Practices</h2>
<ul>
<li>Use proper error handling</li>
<li>Implement rate limiting</li>
<li>Add request validation</li>
<li>Use caching strategies</li>
</ul>`,
      tags: ["nodejs", "api", "backend"],
      published: true,
      featured: false,
      authorId: user.id,
    },
    {
      title: "Introduction to Docker for Developers",
      slug: "introduction-to-docker-for-developers",
      excerpt:
        "A beginner-friendly guide to understanding Docker and containerization.",
      content: `<h2>What is Docker?</h2>
<p>Docker is a platform for developing, shipping, and running applications in containers.</p>
<h2>Benefits</h2>
<ul>
<li>Consistent environments</li>
<li>Easy deployment</li>
<li>Resource efficiency</li>
<li>Scalability</li>
</ul>`,
      tags: ["docker", "devops", "containers"],
      published: false,
      featured: false,
      authorId: admin.id,
    },
  ];

  for (const post of posts) {
    await prisma.post.create({ data: post });
  }

  console.log("✅ Seeding complete!");
  console.log("📧 Admin: admin@modernblog.com / admin123");
  console.log("📧 User: user@modernblog.com / user123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });