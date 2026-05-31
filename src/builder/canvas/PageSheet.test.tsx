import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageSheet } from "./PageSheet";

describe("PageSheet", () => {
  it("stays a light 'paper' island so it matches the white PDF in dark mode", () => {
    render(
      <PageSheet format="A4" orientation="portrait">
        <span>page body</span>
      </PageSheet>,
    );

    const paper = screen.getByText("page body").closest("[data-theme]");
    expect(paper).toHaveAttribute("data-theme", "light");
  });
});
