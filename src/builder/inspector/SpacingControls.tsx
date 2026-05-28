import type { ReactNode } from "react";
import type { Block, SpacingConfig, Template } from "../../types/generated/template";
import { NumberField } from "../forms/controls";
import { setBlockSpacingField, setTemplatePageMargin } from "../state/configUpdates";

const spacingSides = ["top", "right", "bottom", "left"] as const;

type SpacingSide = (typeof spacingSides)[number];

interface BlockSpacingControlsProps {
  scope: "block";
  block: Block;
  onChangeBlock: (block: Block) => void;
}

interface PageMarginControlsProps {
  scope: "page";
  template: Template;
  onChangeTemplate: (template: Template) => void;
}

export type SpacingControlsProps = BlockSpacingControlsProps | PageMarginControlsProps;

export function SpacingControls(props: SpacingControlsProps): ReactNode {
  const title = props.scope === "block" ? "Block spacing" : "Page margins";
  const spacing =
    props.scope === "block" ? props.block.config?.spacing : props.template.config?.page?.margins;

  return (
    <fieldset className="spacing-controls" aria-label={title}>
      <legend>{title}</legend>
      <div className="spacing-controls__grid">
        {spacingSides.map((side) => (
          <NumberField
            key={side}
            name={fieldName(props.scope, side)}
            label={sideLabel(side)}
            value={fieldValue(spacing, side)}
            min={0}
            step={0.5}
            onChange={(value) => {
              if (props.scope === "block") {
                props.onChangeBlock(setBlockSpacingField(props.block, side, value));
                return;
              }

              props.onChangeTemplate(setTemplatePageMargin(props.template, side, value));
            }}
          />
        ))}
      </div>
    </fieldset>
  );
}

function fieldName(scope: SpacingControlsProps["scope"], side: SpacingSide): string {
  return scope === "block" ? `config.spacing.${side}` : `config.page.margins.${side}`;
}

function sideLabel(side: SpacingSide): string {
  return `${side[0].toUpperCase()}${side.slice(1)} (mm)`;
}

function fieldValue(spacing: SpacingConfig | undefined, side: SpacingSide): number | undefined {
  return spacing?.[side] ?? undefined;
}
