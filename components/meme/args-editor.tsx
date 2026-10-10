"use client";

import { useState } from "react";
import { Braces } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatJson, tryParseJson } from "@/lib/meme-utils";

interface ArgsEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * JSON editor for the `args` field. Provides a "格式化 JSON" button that
 * validates and pretty-prints the contents, surfacing parse errors inline.
 */
export function ArgsEditor({ value, onChange, disabled }: ArgsEditorProps) {
  const [error, setError] = useState<string | null>(null);

  const handleFormat = () => {
    const result = tryParseJson(value);
    if (!result.ok) {
      setError(result.error ?? "JSON 格式错误");
      return;
    }
    setError(null);
    if (result.value !== undefined) {
      onChange(formatJson(value));
    }
  };

  return (
    <div className="space-y-2">
      <Label>额外参数 (args · JSON)</Label>
      <Textarea
        aria-label="args"
        value={value}
        disabled={disabled}
        rows={5}
        className="font-mono text-xs"
        placeholder='{"user_infos": []}'
        onChange={(e) => {
          onChange(e.target.value);
          if (error) setError(null);
        }}
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleFormat}
          disabled={disabled}
        >
          <Braces /> 格式化 JSON
        </Button>
        {error && (
          <span role="alert" className="text-xs text-destructive">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
