"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TextFieldsProps {
  values: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

/**
 * Dynamic list of text inputs. Each entry can be edited or removed, and new
 * entries can be appended with the "添加文本" button. When the backend returns
 * no default texts we still render at least one editable field so users can
 * type freely.
 */
export function TextFields({ values, onChange, disabled }: TextFieldsProps) {
  const list = values.length > 0 ? values : [""];
  const items = disabled ? values : list;

  const updateAt = (index: number, value: string) => {
    const next = [...values];
    next[index] = value;
    onChange(next);
  };

  const removeAt = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const add = () => onChange([...values, ""]);

  return (
    <div className="space-y-2">
      <Label>文本</Label>
      {items.map((value, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            aria-label={`文本 ${index + 1}`}
            value={value}
            disabled={disabled}
            placeholder={`文本 ${index + 1}`}
            onChange={(e) => updateAt(index, e.target.value)}
          />
          {!disabled && items.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`删除文本 ${index + 1}`}
              onClick={() => removeAt(index)}
            >
              <X />
            </Button>
          )}
        </div>
      ))}
      {!disabled && (
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus /> 添加文本
        </Button>
      )}
    </div>
  );
}
