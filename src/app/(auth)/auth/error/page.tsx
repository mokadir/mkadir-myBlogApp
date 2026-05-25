import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Authentication Error",
  description: "There was an error authenticating your account",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessages: Record<string, string> = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "You do not have permission to access this resource.",
    Verification: "The verification link has expired or is invalid.",
    Default: "An unexpected authentication error occurred.",
    OAuthSignin: "There was an error signing in with the provider.",
    OAuthCallback: "There was an error processing the provider's response.",
    OAuthCreateAccount: "Could not create an account with the provider.",
    EmailCreateAccount: "Could not create an account with this email.",
    Callback: "There was an error processing your request.",
    OAuthAccountNotLinked:
      "This email is already associated with another sign-in method.",
    EmailSignin: "The email verification link could not be sent.",
    CredentialsSignin: "The email or password you entered is incorrect.",
    SessionRequired: "Please sign in to access this page.",
  };

  const errorMessage = error
    ? errorMessages[error] || errorMessages.Default
    : errorMessages.Default;

  return (
    <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">Authentication Error</h1>
        <p className="mb-6 text-muted-foreground">{errorMessage}</p>
        <div className="flex justify-center gap-4">
          <Link href="/login">
            <Button>Back to Sign In</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Go Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}