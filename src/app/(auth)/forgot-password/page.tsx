import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your ModernBlog account password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link
            href="/login"
            className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Link>
          <h1 className="text-3xl font-bold">Forgot Password?</h1>
          <p className="mt-2 text-muted-foreground">
            No worries. Enter your email and we{"'"}ll send you a reset link.
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}