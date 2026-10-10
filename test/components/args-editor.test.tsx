import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ArgsEditor } from "@/components/meme/args-editor";

describe("ArgsEditor", () => {
  it("formats valid JSON and reports the change", () => {
    const onChange = vi.fn();
    render(<ArgsEditor value='{"a":1}' onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /格式化 JSON/ }));
    expect(onChange).toHaveBeenCalledWith('{\n  "a": 1\n}');
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows an inline error for invalid JSON", () => {
    const onChange = vi.fn();
    render(<ArgsEditor value="{bad" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /格式化 JSON/ }));
    expect(onChange).not.toHaveBeenCalled();
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert.textContent).toBeTruthy();
  });
});
