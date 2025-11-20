import React from "react";
import { Toaster as SonnerToaster } from "sonner";

const Toaster: React.FC = () => {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      // Custom styling to match the HRIS Pro theme
      toastOptions={{
        className: "font-sans rounded-lg shadow-lg",
        style: {
          padding: "12px",
          backgroundColor: "white",
          border: "1px solid #E5E7EB",
        },
      }}
    />
  );
};

export default Toaster;
