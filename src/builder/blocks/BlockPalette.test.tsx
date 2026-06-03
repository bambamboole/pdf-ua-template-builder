import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BlockPalette } from "./BlockPalette";

describe("BlockPalette", () => {
  it("server-renders block chips and labels with descriptive aria labels", () => {
    render(<BlockPalette blockTypes={["heading", "text", "barcode", "divider"]} />);

    expect(screen.getByText("Heading")).toBeInTheDocument();
    expect(screen.getByText("Text")).toBeInTheDocument();
    expect(screen.getByText("Barcode / QR")).toBeInTheDocument();
    expect(screen.getByText("Divider")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Heading" })).toHaveAttribute(
      "aria-label",
      "Add Heading",
    );
    expect(screen.getByRole("button", { name: "Add Text" })).toHaveAttribute(
      "aria-label",
      "Add Text",
    );
    expect(screen.getByRole("button", { name: "Add Barcode / QR" })).toHaveAttribute(
      "aria-label",
      "Add Barcode / QR",
    );
    expect(screen.getByRole("button", { name: "Add Divider" })).toHaveAttribute(
      "aria-label",
      "Add Divider",
    );
  });
});
