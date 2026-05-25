import Link from "next/link";
import { PenSquare } from "lucide-react";

const footerLinks = {
  Product: [
    { href: "/posts", label: "Blog" },
    { href: "/", label: "Features" },
    { href: "/", label: "Pricing" },
  ],
  Company: [
    { href: "/", label: "About" },
    { href: "/", label: "Contact" },
    { href: "/", label: "Privacy" },
  ],
  Social: [
    { href: "#", label: "Twitter" },
    { href: "#", label: "GitHub" },
    { href: "#", label: "LinkedIn" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <PenSquare className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">ModernBlog</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              A modern blogging platform for sharing ideas and stories with the
              world.
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="space-y-4">
              <h4 className="text-sm font-semibold">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ModernBlog. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}