import React, { useState } from "react";

const FormField: React.FC<{
  label: string;
  id: string;
  type: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  options?: string[];
  error?: string | null;
}> = ({ label, id, type, value, onChange, options, error }) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordField = id === "password";

  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>

      {options ? (
        <select
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          className={`px-3 py-2 border ${
            error ? "border-red-500" : "border-slate-300"
          } rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out`}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : isPasswordField ? (
        // --------------------------
        // PASSWORD FIELD WITH ICON
        // --------------------------
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            id={id}
            name={id}
            value={value}
            onChange={onChange}
            className={`w-full px-3 py-2 pr-10 border ${
              error ? "border-red-500" : "border-slate-300"
            } rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out`}
          />

          {/* Eye Icon */}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-3 flex items-center"
          >
            {showPassword ? (
              // Eye OFF icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.185.206-2.323.585-3.375M6.343 6.343A9.956 9.956 0 0112 5c5.523 0 10 4.477 10 10 0 1.185-.206 2.323-.585 3.375M9.878 9.879A3 3 0 0114.121 14.12"
                />
              </svg>
            ) : (
              // Eye ON icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M2.458 12C3.732 7.943 7.522 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.478 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        </div>
      ) : (
        // --------------------------
        // NORMAL INPUT FIELD
        // --------------------------
        <input
          type={type}
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          className={`px-3 py-2 border ${
            error ? "border-red-500" : "border-slate-300"
          } rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out`}
        />
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default FormField;
