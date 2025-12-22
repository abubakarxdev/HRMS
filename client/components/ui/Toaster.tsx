import React from "react";
import { Toaster as SonnerToaster } from "sonner";

const Toaster: React.FC = () => {
  return (
    <SonnerToaster
      position="top-right"
      theme="light"
      richColors={false}
      closeButton
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: 'bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-2xl p-4 flex items-start gap-3 w-full max-w-sm font-sans',
          title: 'text-slate-800 font-bold text-sm',
          description: 'text-slate-500 text-sm leading-relaxed mt-1',
          actionButton: 'bg-indigo-600 text-white font-medium text-xs px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors',
          cancelButton: 'bg-slate-100 text-slate-600 font-medium text-xs px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors',
          error: 'text-rose-600',
          success: 'text-emerald-600',
          warning: 'text-amber-600',
          info: 'text-blue-600',
        },
      }}
    />
  );
};

export default Toaster;
