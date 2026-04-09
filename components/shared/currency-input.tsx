"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function formatDisplayValue(value: number, decimals = false): string {
  if (value === 0) return "";
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: decimals ? 2 : 0,
    minimumFractionDigits: 0,
  }).format(value);
}

function parseInputValue(raw: string): number {
  const cleaned = raw.replace(/[^\d,.-]/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

interface CurrencyInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  step?: number;
  min?: number;
  decimals?: boolean;
}

export function CurrencyInput({
  label,
  value,
  onChange,
  suffix,
  step = 1,
  min = 0,
  decimals = false,
}: CurrencyInputProps) {
  const [focused, setFocused] = useState(false);
  const [rawValue, setRawValue] = useState("");

  const handleFocus = useCallback(() => {
    setFocused(true);
    setRawValue(value === 0 ? "" : String(value));
  }, [value]);

  const handleBlur = useCallback(() => {
    setFocused(false);
    const parsed = parseInputValue(rawValue);
    const clamped = Math.max(min, parsed);
    onChange(clamped);
  }, [rawValue, min, onChange]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setRawValue(val);
      const parsed = parseInputValue(val);
      if (!isNaN(parsed)) {
        onChange(Math.max(min, parsed));
      }
    },
    [min, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        onChange(value + step);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        onChange(Math.max(min, value - step));
      }
    },
    [value, step, min, onChange]
  );

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input
          type="text"
          inputMode="decimal"
          value={focused ? rawValue : formatDisplayValue(value, decimals)}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="0"
          className={suffix ? "pr-14" : ""}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
