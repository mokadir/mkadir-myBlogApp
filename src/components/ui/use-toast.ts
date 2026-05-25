// Re-export react-hot-toast as a shadcn/ui-compatible useToast hook
import toast from "react-hot-toast";

export { toast };
export const useToast = () => ({ toast });
