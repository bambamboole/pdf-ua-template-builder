import { controlClass, fieldLabelClass } from "./fieldStyles";

export interface AlignSelectProps {
  name: string;
  value: string;
  label?: string;
  onChange: (value: string) => void;
}

export function AlignSelect({ name, value, label = "Align", onChange }: AlignSelectProps) {
  return (
    <label className={fieldLabelClass}>
      {label}
      <select
        className={controlClass}
        name={name}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      >
        <option value="" />
        <option value="left">left</option>
        <option value="center">center</option>
        <option value="right">right</option>
      </select>
    </label>
  );
}
