import type { Align } from "../../types/generated/template";
import type { SelectFieldOption } from "../forms/controls";

export const ALIGN_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
] as const satisfies readonly SelectFieldOption<Align>[];
