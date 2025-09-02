import { toast } from "react-toastify";

let activeToastId = null;
let lastMessage = "";

export default function useToastFeedback() {
  const showToast = (type, message, options = {}) => {
    // Si le même message est déjà affiché, on ignore
    if (toast.isActive(activeToastId) && message === lastMessage) {
      return;
    }

    const config = {
      position: options.position || "top-center",
      autoClose: options.autoClose || 3000,
      theme: options.theme || "colored",
    };

    switch (type) {
      case "success":
        activeToastId = toast.success(message, config);
        break;
      case "error":
        activeToastId = toast.error(message, config);
        break;
      case "warning":
        activeToastId = toast.warning(message, config);
        break;
      default:
        activeToastId = toast(message, config);
    }

    lastMessage = message;
  };

  return {
    success: (msg) => showToast("success", msg),
    error: (msg) => showToast("error", msg),
    warning: (msg) => showToast("warning", msg),
  };
}
