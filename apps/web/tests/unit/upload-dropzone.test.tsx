import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UploadDropzone } from "@/components/upload-dropzone";

function makeFile(name: string): File {
  return new File(["x"], name, { type: "video/mp4" });
}

describe("UploadDropzone", () => {
  it("calls onFilesSelected when a file is chosen via the file picker", () => {
    const onFilesSelected = vi.fn();
    render(<UploadDropzone onFilesSelected={onFilesSelected} />);

    const input = screen.getByTestId("upload-file-input");
    fireEvent.change(input, { target: { files: [makeFile("clip.mp4")] } });

    expect(onFilesSelected).toHaveBeenCalledTimes(1);
    const files = onFilesSelected.mock.calls[0]?.[0] as FileList;
    expect(files[0]?.name).toBe("clip.mp4");
  });

  it("calls onFilesSelected when a file is dropped onto the zone", () => {
    const onFilesSelected = vi.fn();
    render(<UploadDropzone onFilesSelected={onFilesSelected} />);

    const dropzone = screen.getByTestId("upload-dropzone");
    fireEvent.drop(dropzone, { dataTransfer: { files: [makeFile("dropped.mp4")] } });

    expect(onFilesSelected).toHaveBeenCalledTimes(1);
    const files = onFilesSelected.mock.calls[0]?.[0] as FileList;
    expect(files[0]?.name).toBe("dropped.mp4");
  });
});
