import type { ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({
  open,
  onClose,
  children,
  title,
  size = "md",
  closable = true,
}: {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl";
  closable?: boolean;
}) {
  if (!open) return null;
  const sizeClass = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closable ? onClose : undefined}
      />
      <div
        className={[
          "relative w-full sm:rounded-2xl rounded-t-2xl bg-white dark:bg-slate-900",
          "border border-slate-200 dark:border-slate-800 shadow-xl",
          "animate-slide-up max-h-[92vh] flex flex-col",
          sizeClass,
        ].join(" ")}
      >
        {(title || closable) && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-semibold">{title}</h2>
            {closable && onClose && (
              <button
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        <div className="overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
