import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  CheckboxField,
  ColorField,
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
  UnitField,
} from "./BuilderField";

describe("builder form controls", () => {
  it("server-renders shared label, help, and error layout", () => {
    render(
      <TextField
        name="block.text"
        label="Heading text"
        value="Invoice"
        help="Shown in the PDF"
        error="Required"
        onChange={() => undefined}
      />,
    );

    const input = screen.getByLabelText("Heading text");

    expect(input).toHaveAttribute("id", "builder-field-block-text");
    expect(input).toHaveAttribute("name", "block.text");
    expect(input).toHaveValue("Invoice");
    expect(input).toHaveAttribute("aria-invalid", "true");

    const helpId = "builder-field-block-text-help";
    const errorId = "builder-field-block-text-error";
    expect(input).toHaveAttribute("aria-describedby", `${helpId} ${errorId}`);
    expect(screen.getByText("Shown in the PDF")).toHaveAttribute("id", helpId);
    expect(screen.getByRole("alert")).toHaveTextContent("Required");
  });

  it("preserves empty text values by default and can clear optional text to undefined", async () => {
    const user = userEvent.setup();

    const preserved = vi.fn();
    function PreservedHarness() {
      const [value, setValue] = useState<string | undefined>("Body");

      return (
        <TextField
          name="text"
          label="Text"
          value={value}
          onChange={(next) => {
            preserved(next);
            setValue(next);
          }}
        />
      );
    }

    const cleared = vi.fn();
    function ClearedHarness() {
      const [value, setValue] = useState<string | undefined>("50%");

      return (
        <TextField
          name="config.width"
          label="Width"
          value={value}
          emptyValue="undefined"
          onChange={(next) => {
            cleared(next);
            setValue(next);
          }}
        />
      );
    }

    render(
      <>
        <PreservedHarness />
        <ClearedHarness />
      </>,
    );

    await user.clear(screen.getByLabelText("Text"));
    await user.clear(screen.getByLabelText("Width"));

    expect(preserved).toHaveBeenLastCalledWith("");
    expect(cleared).toHaveBeenLastCalledWith(undefined);
  });

  it("renders textarea controls and applies the same optional empty text handling", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    function Harness() {
      const [value, setValue] = useState<string | undefined>("Initial");

      return (
        <TextAreaField
          name="description"
          label="Description"
          value={value}
          emptyValue="undefined"
          onChange={(next) => {
            onChange(next);
            setValue(next);
          }}
        />
      );
    }

    render(<Harness />);

    const textarea = screen.getByLabelText("Description");
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toHaveAttribute("name", "description");

    await user.clear(textarea);

    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  it("converts number input values and clears empty numbers to undefined", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    function Harness() {
      const [value, setValue] = useState<number | undefined>(28);

      return (
        <NumberField
          name="config.maxHeight"
          label="Max height"
          value={value}
          min={0}
          step={0.5}
          onChange={(next) => {
            onChange(next);
            setValue(next);
          }}
        />
      );
    }

    render(<Harness />);

    const input = screen.getByLabelText("Max height");
    expect(input).toHaveAttribute("type", "number");

    await user.clear(input);
    await user.type(input, "42.5");
    expect(onChange).toHaveBeenLastCalledWith(42.5);

    await user.clear(input);
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  it("renders optional selects with an empty option and clears empty selections", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    function Harness() {
      const [value, setValue] = useState<"left" | "center" | undefined>("center");

      return (
        <SelectField
          name="config.align"
          label="Align"
          value={value}
          optional
          options={
            [
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
            ] as const
          }
          onChange={(next) => {
            onChange(next);
            setValue(next);
          }}
        />
      );
    }

    render(<Harness />);

    const select = screen.getByRole("combobox", { name: "Align" });
    const emptyOption = within(select).getByText("", { selector: "option[value='']" });
    expect(emptyOption).toBeInTheDocument();
    expect(select).toHaveValue("center");

    await user.selectOptions(select, "");
    expect(onChange).toHaveBeenLastCalledWith(undefined);

    await user.selectOptions(select, "left");
    expect(onChange).toHaveBeenLastCalledWith("left");
  });

  it("renders an accessible controlled checkbox", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    function Harness() {
      const [checked, setChecked] = useState(false);

      return (
        <CheckboxField
          name="config.repeat"
          label="Repeat footer"
          checked={checked}
          onChange={(next) => {
            onChange(next);
            setChecked(next);
          }}
        />
      );
    }

    render(<Harness />);

    const checkbox = screen.getByLabelText("Repeat footer");
    expect(checkbox).toHaveAttribute("type", "checkbox");
    expect(checkbox).toHaveAttribute("name", "config.repeat");
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(checkbox).toBeChecked();
  });

  it("renders color and CSS unit fields as controlled typed inputs", async () => {
    const user = userEvent.setup();
    const onColorChange = vi.fn();
    const onWidthChange = vi.fn();

    function Harness() {
      const [color, setColor] = useState<string | undefined>("#334455");
      const [width, setWidth] = useState<string | undefined>("80mm");

      return (
        <>
          <ColorField
            name="config.color"
            label="Color"
            value={color}
            onChange={(next) => {
              onColorChange(next);
              setColor(next);
            }}
          />
          <UnitField
            name="config.width"
            label="Width"
            value={width}
            onChange={(next) => {
              onWidthChange(next);
              setWidth(next);
            }}
          />
        </>
      );
    }

    render(<Harness />);

    const colorInput = screen.getByLabelText("Color");
    const unitInput = screen.getByLabelText("Width");
    expect(colorInput).toHaveAttribute("type", "color");
    expect(unitInput).toHaveAttribute("inputmode", "text");

    fireEvent.change(colorInput, { target: { value: "#112233" } });
    expect(onColorChange).toHaveBeenLastCalledWith("#112233");

    await user.clear(unitInput);
    await user.type(unitInput, "auto");
    expect(onWidthChange).toHaveBeenLastCalledWith("auto");

    await user.clear(unitInput);
    expect(onWidthChange).toHaveBeenLastCalledWith(undefined);
  });
});
