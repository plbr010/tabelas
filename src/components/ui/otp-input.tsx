"use client";

import { forwardRef, useState } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  label?: string;
  error?: string;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  name?: string;
}

export const OtpInput = forwardRef<HTMLInputElement, OtpInputProps>(
  ({ label, error, disabled, value = "", onChange, onBlur, name }, ref) => {
    const [internal, setInternal] = useState(value);

    const display = onChange ? value : internal;

    function handleChange(raw: string) {
      const digits = raw.replace(/\D/g, "").slice(0, 6);
      if (onChange) {
        onChange(digits);
      } else {
        setInternal(digits);
      }
    }

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor="otp-verification-code"
            className="block text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id="otp-verification-code"
          name={name ?? "otp-verification-code"}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-lpignore="true"
          data-form-type="other"
          placeholder="• • • • • •"
          disabled={disabled}
          value={display}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={onBlur}
          className={cn(
            "flex h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-center text-2xl font-bold tracking-[0.5em] text-slate-900 placeholder:text-slate-300 placeholder:tracking-[0.3em]",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-300 focus:ring-red-500"
          )}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
OtpInput.displayName = "OtpInput";
