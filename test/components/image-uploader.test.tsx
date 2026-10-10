import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ImageUploader } from "@/components/meme/image-uploader";

function Harness({ max }: { max?: number }) {
  const [images, setImages] = useState<File[]>([]);
  return <ImageUploader images={images} onChange={setImages} max={max} />;
}

function makeFile(name: string) {
  return new File(["x"], name, { type: "image/png" });
}

describe("ImageUploader", () => {
  it("shows a thumbnail after selecting a file", () => {
    render(<Harness />);
    const input = screen.getByLabelText("上传图片") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile("a.png")] } });
    expect(screen.getByAltText("a.png")).toBeInTheDocument();
  });

  it("removes a thumbnail", () => {
    render(<Harness />);
    const input = screen.getByLabelText("上传图片") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile("a.png")] } });
    expect(screen.getByAltText("a.png")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /删除图片 1/ }));
    expect(screen.queryByAltText("a.png")).toBeNull();
  });

  it("honors the max limit", () => {
    render(<Harness max={1} />);
    const input = screen.getByLabelText("上传图片") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile("a.png")] } });
    // after reaching the limit the upload control disappears
    expect(screen.queryByLabelText("上传图片")).toBeNull();
    expect(screen.getByText(/已达到最大上传数量/)).toBeInTheDocument();
  });

  it("calls onChange with the File list", () => {
    const onChange = vi.fn();
    render(<ImageUploader images={[]} onChange={onChange} />);
    const input = screen.getByLabelText("上传图片") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile("a.png")] } });
    expect(onChange).toHaveBeenCalled();
    const last = onChange.mock.calls.at(-1)![0] as File[];
    expect(last[0].name).toBe("a.png");
  });
});
