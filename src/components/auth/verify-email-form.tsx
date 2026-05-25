"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [isVerifying, setIsVerifying] = React.useState(!!token);
  const [isResending, setIsResending] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "success" | "error">(
    token ? "idle" : "idle"
  );
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  async function verifyEmail(verificationToken: string) {
    setIsVerifying(true);

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verificationToken }),
      });

      const result = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(result.message || "Verification failed");
        return;
      }

      setStatus("success");
      setMessage(result.message || "Email verified successfully!");
      toast.success("Email verified!");

      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  }

  async function resendVerification() {
    setIsResending(true);

    try {
      const email = prompt("Enter your email address to resend verification:");
      if (!email) return;

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Failed to resend");
        return;
      }

      toast.success("Verification email sent!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsResending(false);
    }
  }

  if (isVerifying) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <h2 className="mb-2 text-xl font-semibold">Verifying your email...</h2>
        <p className="text-sm text-muted-foreground">
          Please wait while we verify your email address.
        </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="animate-in fade-in slide-in-from-top-4 duration-500 rounded-lg border bg-card p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="mb-2 text-xl font-semibold">Email Verified!</h2>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
          <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="mb-2 text-xl font-semibold">Verification Failed</h2>
        <p className="mb-4 text-sm text-muted-foreground">{message}</p>
        <Button
          variant="outline"
          onClick={resendVerification}
          disabled={isResending}
        >
          {isResending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Mail className="mr-2 h-4 w-4" />
          )}
          Resend verification email
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Mail className="h-6 w-6 text-primary" />
      </div>
      <h2 className="mb-2 text-xl font-semibold">Check your inbox</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        We{"'"}ve sent a verification link to your email. Click the link to
        verify your account.
      </p>
      <Button
        variant="outline"
        onClick={resendVerification}
        disabled={isResending}
      >
        {isResending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Resend verification email
      </Button>
    </div>
  );
}