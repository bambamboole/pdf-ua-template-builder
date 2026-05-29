import type { ChangeEvent, ReactNode } from "react";
import { checkboxClass, inputClass, selectClass, textareaClass } from "./fieldStyles";

export type EmptyTextValue = "empty-string" | "undefined";

export interface BuilderControlProps {
  name: string;
  label: string;
  help?: ReactNode;
  error?: ReactNode;
  id?: string;
  className?: string;
  disabled?: boolean;
}

export interface TextFieldProps extends BuilderControlProps {
  value?: string;
  placeholder?: string;
  emptyValue?: EmptyTextValue;
  autoComplete?: string;
  onChange: (value: string | undefined) => void;
}

export interface TextAreaFieldProps extends BuilderControlProps {
  value?: string;
  placeholder?: string;
  emptyValue?: EmptyTextValue;
  rows?: number;
  onChange: (value: string | undefined) => void;
}

export interface NumberFieldProps extends BuilderControlProps {
  value?: number;
  min?: number;
  max?: number;
  step?: number | "any";
  placeholder?: string;
  onChange: (value: number | undefined) => void;
}

export interface SelectFieldOption<Value extends string> {
  value: Value;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps<Value extends string> extends BuilderControlProps {
  value?: Value;
  options: readonly SelectFieldOption<Value>[];
  optional?: boolean;
  emptyLabel?: string;
  onChange: (value: Value | undefined) => void;
}

export interface CheckboxFieldProps extends BuilderControlProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export interface ColorFieldProps extends BuilderControlProps {
  value?: string;
  fallbackValue?: string;
  onChange: (value: string | undefined) => void;
}

export interface UnitFieldProps extends BuilderControlProps {
  value?: string;
  placeholder?: string;
  emptyValue?: EmptyTextValue;
  onChange: (value: string | undefined) => void;
}

interface FieldLayoutProps extends BuilderControlProps {
  children: ReactNode;
}

interface FieldControlState {
  id: string;
  describedBy?: string;
  invalid: boolean;
}

export function TextField({
  value,
  placeholder,
  emptyValue = "empty-string",
  autoComplete,
  onChange,
  ...fieldProps
}: TextFieldProps): ReactNode {
  const fieldState = createFieldState(fieldProps);

  return (
    <BuilderField {...fieldProps}>
      <input
        id={fieldState.id}
        className={inputClass}
        name={fieldProps.name}
        type="text"
        value={value ?? ""}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={fieldProps.disabled}
        aria-describedby={fieldState.describedBy}
        aria-invalid={fieldState.invalid || undefined}
        onChange={(event) => onChange(textValue(event.currentTarget.value, emptyValue))}
      />
    </BuilderField>
  );
}

export function TextAreaField({
  value,
  placeholder,
  emptyValue = "empty-string",
  rows = 4,
  onChange,
  ...fieldProps
}: TextAreaFieldProps): ReactNode {
  const fieldState = createFieldState(fieldProps);

  return (
    <BuilderField {...fieldProps}>
      <textarea
        id={fieldState.id}
        className={textareaClass}
        name={fieldProps.name}
        value={value ?? ""}
        placeholder={placeholder}
        rows={rows}
        disabled={fieldProps.disabled}
        aria-describedby={fieldState.describedBy}
        aria-invalid={fieldState.invalid || undefined}
        onChange={(event) => onChange(textValue(event.currentTarget.value, emptyValue))}
      />
    </BuilderField>
  );
}

export function NumberField({
  value,
  min,
  max,
  step,
  placeholder,
  onChange,
  ...fieldProps
}: NumberFieldProps): ReactNode {
  const fieldState = createFieldState(fieldProps);

  return (
    <BuilderField {...fieldProps}>
      <input
        id={fieldState.id}
        className={inputClass}
        name={fieldProps.name}
        type="number"
        value={value ?? ""}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        disabled={fieldProps.disabled}
        aria-describedby={fieldState.describedBy}
        aria-invalid={fieldState.invalid || undefined}
        onChange={(event) => onChange(numberValue(event))}
      />
    </BuilderField>
  );
}

export function SelectField<Value extends string>({
  value,
  options,
  optional = false,
  emptyLabel = "",
  onChange,
  ...fieldProps
}: SelectFieldProps<Value>): ReactNode {
  const fieldState = createFieldState(fieldProps);

  return (
    <BuilderField {...fieldProps}>
      <select
        id={fieldState.id}
        className={selectClass}
        name={fieldProps.name}
        value={value ?? ""}
        disabled={fieldProps.disabled}
        aria-describedby={fieldState.describedBy}
        aria-invalid={fieldState.invalid || undefined}
        onChange={(event) => onChange(selectValue(event.currentTarget.value, options))}
      >
        {optional ? <option value="">{emptyLabel}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </BuilderField>
  );
}

export function CheckboxField({
  checked,
  onChange,
  ...fieldProps
}: CheckboxFieldProps): ReactNode {
  const fieldState = createFieldState(fieldProps);

  return (
    <BuilderField {...fieldProps} className={fieldProps.className}>
      <input
        id={fieldState.id}
        className={checkboxClass}
        name={fieldProps.name}
        type="checkbox"
        checked={checked}
        disabled={fieldProps.disabled}
        aria-describedby={fieldState.describedBy}
        aria-invalid={fieldState.invalid || undefined}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
    </BuilderField>
  );
}

export function ColorField({
  value,
  fallbackValue = "#000000",
  onChange,
  ...fieldProps
}: ColorFieldProps): ReactNode {
  const fieldState = createFieldState(fieldProps);

  return (
    <BuilderField {...fieldProps}>
      <input
        id={fieldState.id}
        className={`${inputClass} p-1`}
        name={fieldProps.name}
        type="color"
        value={value ?? fallbackValue}
        disabled={fieldProps.disabled}
        aria-describedby={fieldState.describedBy}
        aria-invalid={fieldState.invalid || undefined}
        onChange={(event) => onChange(textValue(event.currentTarget.value, "undefined"))}
      />
    </BuilderField>
  );
}

export function UnitField({
  value,
  placeholder = "auto, 50%, 80mm",
  emptyValue = "undefined",
  onChange,
  ...fieldProps
}: UnitFieldProps): ReactNode {
  const fieldState = createFieldState(fieldProps);

  return (
    <BuilderField {...fieldProps}>
      <input
        id={fieldState.id}
        className={inputClass}
        name={fieldProps.name}
        type="text"
        inputMode="text"
        spellCheck={false}
        value={value ?? ""}
        placeholder={placeholder}
        disabled={fieldProps.disabled}
        aria-describedby={fieldState.describedBy}
        aria-invalid={fieldState.invalid || undefined}
        onChange={(event) => onChange(textValue(event.currentTarget.value, emptyValue))}
      />
    </BuilderField>
  );
}

export function BuilderField({
  name,
  label,
  help,
  error,
  id,
  className,
  children,
}: FieldLayoutProps): ReactNode {
  const fieldState = createFieldState({ name, label, help, error, id });
  const helpId = help ? `${fieldState.id}-help` : undefined;
  const errorId = error ? `${fieldState.id}-error` : undefined;

  return (
    <div className={classNames("grid min-w-0 gap-1", className)}>
      <label className="text-2xs font-medium text-stone-500" htmlFor={fieldState.id}>
        {label}
      </label>
      <div className="min-w-0">{children}</div>
      {help ? (
        <p className="m-0 text-2xs text-stone-500" id={helpId}>
          {help}
        </p>
      ) : null}
      {error ? (
        <p className="m-0 text-2xs text-red-700" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function createFieldState({
  name,
  help,
  error,
  id,
}: BuilderControlProps): FieldControlState {
  const fieldId = id ?? createFieldId(name);
  const helpId = help ? `${fieldId}-help` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;
  const invalid = error !== undefined && error !== null && error !== "";

  return {
    id: fieldId,
    describedBy,
    invalid,
  };
}

function textValue(value: string, emptyValue: EmptyTextValue): string | undefined {
  if (value === "" && emptyValue === "undefined") {
    return undefined;
  }

  return value;
}

function numberValue(event: ChangeEvent<HTMLInputElement>): number | undefined {
  const { value, valueAsNumber } = event.currentTarget;

  if (value === "" || Number.isNaN(valueAsNumber)) {
    return undefined;
  }

  return valueAsNumber;
}

function selectValue<Value extends string>(
  value: string,
  options: readonly SelectFieldOption<Value>[],
): Value | undefined {
  if (value === "") {
    return undefined;
  }

  return options.find((option) => option.value === value)?.value;
}

export function createFieldId(name: string): string {
  return `builder-field-${name.replace(/[^A-Za-z0-9_-]+/g, "-")}`;
}

function classNames(...names: Array<string | undefined>): string {
  return names.filter((name): name is string => Boolean(name)).join(" ");
}
