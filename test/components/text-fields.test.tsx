import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TextFields } from "@/components/meme/text-fields";

function Harness({ initial = [""] }: { initial?: string[] }) {
  const [values, setValues] = useState<string[]>(initial);
  return <TextFields values={values} onChange={setValues} />;
}

describe("TextFields", () => {
  it("renders one field minimum and adds fields", () => {
    render(<Harness initial={["a"]} />);
    expect(screen.getByLabelText("文本 1")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /添加文本/ }));
    expect(screen.getByLabelText("文本 2")).toBeInTheDocument();
  });

  it("updates values on typing", () => {
    const onChange = vi.fn();
    render(<TextFields values={["a"]} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("文本 1"), {
      target: { value: "changed" },
    });
    expect(onChange).toHaveBeenCalledWith(["changed"]);
  });

  it("removes a field", () => {
    render(<Harness initial={["a", "b"]} />);
    expect(screen.getByLabelText("文本 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /删除文本 1/ }));
    expect(screen.queryByLabelText("文本 2")).toBeNull();
  });

  it("hides delete/add controls when disabled", () => {
    render(<TextFields values={["a"]} onChange={() => {}} disabled />);
    expect(
      screen.queryByRole("button", { name: /添加文本/ })
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: /删除文本/ })
    ).toBeNull();
  });
});
