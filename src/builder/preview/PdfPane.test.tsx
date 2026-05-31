import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PdfPane } from "./PdfPane";

describe("PdfPane", () => {
  it("renders the PDF as a non-sandboxed object", () => {
    const { container } = render(
      <PdfPane pdfUrl="blob:http://localhost:5174/test" error={null} loading={false} />,
    );

    const object = container.querySelector("object");
    expect(object).toHaveAttribute("data", "blob:http://localhost:5174/test");
    expect(object).not.toHaveAttribute("sandbox");
    // The rendered PDF is white paper, so it stays light even in dark mode.
    expect(object).toHaveAttribute("data-theme", "light");
  });

  it("omits the Render button unless onRender is provided", () => {
    render(<PdfPane pdfUrl={null} error={null} loading={false} />);

    expect(screen.queryByRole("button", { name: "Render PDF" })).not.toBeInTheDocument();
  });

  it("invokes onRender when the Render button is clicked", async () => {
    const user = userEvent.setup();
    const onRender = vi.fn();

    render(<PdfPane pdfUrl={null} error={null} loading={false} onRender={onRender} />);

    await user.click(screen.getByRole("button", { name: "Render PDF" }));

    expect(onRender).toHaveBeenCalledTimes(1);
  });
});
