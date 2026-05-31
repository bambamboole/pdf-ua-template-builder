import type { EmptyTextValue, SelectFieldOption } from "./BuilderField";

export function textValue(value: string, emptyValue: EmptyTextValue): string | undefined {
  if (value === "" && emptyValue === "undefined") {
    return undefined;
  }

  return value;
}

export function numberValue(value: string, valueAsNumber: number): number | undefined {
  if (value === "" || Number.isNaN(valueAsNumber)) {
    return undefined;
  }

  return valueAsNumber;
}

export function selectValue<Value extends string>(
  value: string,
  options: readonly SelectFieldOption<Value>[],
): Value | undefined {
  if (value === "") {
    return undefined;
  }

  return options.find((option) => option.value === value)?.value;
}
