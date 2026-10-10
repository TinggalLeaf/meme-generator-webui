import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TemplateList } from "@/components/meme/template-list";
import type { MemeKey } from "@/lib/types";

const items: MemeKey[] = [
  { key: "5000choyen", name: "5000兆円" },
  { key: "doge" },
];

describe("TemplateList", () => {
  it("renders all template names/keys", () => {
    render(<TemplateList items={items} selected={null} onSelect={() => {}} />);
    expect(screen.getByText("5000兆円")).toBeInTheDocument();
    // doge has no name, so the key is shown
    expect(screen.getByText("doge")).toBeInTheDocument();
  });

  it("filters by search query (name)", () => {
    render(<TemplateList items={items} selected={null} onSelect={() => {}} />);
    fireEvent.change(screen.getByLabelText("搜索模板"), {
      target: { value: "5000" },
    });
    expect(screen.getByText("5000兆円")).toBeInTheDocument();
    expect(screen.queryByText("doge")).toBeNull();
  });

  it("filters by search query (key)", () => {
    render(<TemplateList items={items} selected={null} onSelect={() => {}} />);
    fireEvent.change(screen.getByLabelText("搜索模板"), {
      target: { value: "doge" },
    });
    expect(screen.queryByText("5000兆円")).toBeNull();
    expect(screen.getByText("doge")).toBeInTheDocument();
  });

  it("calls onSelect with the chosen key", () => {
    const onSelect = vi.fn();
    render(<TemplateList items={items} selected={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("doge"));
    expect(onSelect).toHaveBeenCalledWith("doge");
  });

  it("shows a loading skeleton state", () => {
    const { container } = render(
      <TemplateList items={[]} selected={null} onSelect={() => {}} loading />
    );
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });
});
