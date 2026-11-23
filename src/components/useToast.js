// Kept apart from Toast.jsx so Vite can hot-reload the component file.
import { createContext, useContext } from "react";

export const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);
