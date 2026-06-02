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

  it("shows validation results in the validation tab", async () => {
    const user = userEvent.setup();

    render(
      <PdfPane
        pdfUrl="blob:http://localhost:5174/test"
        validation={validation}
        error={null}
        loading={false}
      />,
    );

    expect(screen.queryByRole("tab", { name: "Data" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Validation" }));

    expect(screen.getByText("Issues found")).toBeInTheDocument();
    expect(screen.getByText("42 of 45 checks passed")).toBeInTheDocument();
    expect(screen.getByText("Alt text is missing")).toBeInTheDocument();
  });
});

const validation = {
  isCompliant: false,
  profiles: [
    {
      profile: "PDF/UA-1",
      specification: "ISO 14289-1",
      isCompliant: false,
      totalChecks: 45,
      passedChecks: 42,
      failedChecks: 3,
    },
  ],
  summary: {
    totalChecks: 45,
    passedChecks: 42,
    failedChecks: 3,
    categories: [{ category: "Images", passedChecks: 4, failedChecks: 1 }],
  },
  failures: [
    {
      profile: "PDF/UA-1",
      clause: "7.18.1",
      testNumber: 1,
      category: "Images",
      message: "Alt text is missing",
      location: "page=1",
    },
  ],
};
