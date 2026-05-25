// shadcn/ui-compatible toast hook backed by react-hot-toast
import hotToast from "react-hot-toast";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  duration?: number;
}

function showToast(opts: ToastOptions) {
  const duration = opts.duration ?? 4000;

  // Combine title and description for the message
  const message = opts.description
    ? `${opts.title}: ${opts.description}`
    : opts.title;

  if (opts.variant === "destructive") {
    return hotToast.error(message, { duration });
  }

  if (opts.variant === "success") {
    return hotToast.success(message, { duration });
  }

  return hotToast(message, { duration });
}

export const useToast = () => ({ toast: showToast });
