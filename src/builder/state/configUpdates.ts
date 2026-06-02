import type {
  Block,
  BlockConfig,
  SpacingConfig,
  Template,
  TemplateConfig,
  TypographyConfig,
} from "../../types/generated/template";

type EmptyConfigValue = "" | null | undefined;
type BlockType = Block["type"];
type BlockByType<TType extends BlockType> = Extract<Block, { type: TType }>;

export function setBlockField<TType extends BlockType, TKey extends keyof BlockByType<TType>>(
  block: BlockByType<TType>,
  field: TKey,
  value: BlockByType<TType>[TKey] | EmptyConfigValue,
): BlockByType<TType> {
  return setObjectField(block, field, value) as BlockByType<TType>;
}

export function setBlockConfigField<TType extends BlockType, TKey extends keyof BlockConfig>(
  block: BlockByType<TType>,
  field: TKey,
  value: BlockConfig[TKey] | EmptyConfigValue,
): BlockByType<TType> {
  const nextConfig = setObjectField<BlockConfig, TKey>(block.config, field, value);

  return withBlockConfig(block, nextConfig);
}

export function setBlockTypographyField<
  TType extends BlockType,
  TKey extends keyof TypographyConfig,
>(
  block: BlockByType<TType>,
  field: TKey,
  value: TypographyConfig[TKey] | EmptyConfigValue,
): BlockByType<TType> {
  const nextTypography = setObjectField(block.config?.typography, field, value);

  return setCommonBlockConfigField(block, "typography", nextTypography);
}

export function setBlockSpacingField<TType extends BlockType, TKey extends keyof SpacingConfig>(
  block: BlockByType<TType>,
  field: TKey,
  value: SpacingConfig[TKey] | EmptyConfigValue,
): BlockByType<TType> {
  const nextSpacing = setObjectField(block.config?.spacing, field, value);

  return setCommonBlockConfigField(block, "spacing", nextSpacing);
}

export function setTemplateTypographyField<TKey extends keyof TypographyConfig>(
  template: Template,
  field: TKey,
  value: TypographyConfig[TKey] | EmptyConfigValue,
): Template {
  const nextTypography = setObjectField(template.config?.typography, field, value);
  const nextConfig = setObjectField(template.config, "typography", nextTypography);

  return withTemplateConfig(template, nextConfig);
}

export function setTemplatePageMargin<TKey extends keyof SpacingConfig>(
  template: Template,
  field: TKey,
  value: SpacingConfig[TKey] | EmptyConfigValue,
): Template {
  const nextMargins = setObjectField(template.config?.page?.margins, field, value);
  const nextPage = setObjectField(template.config?.page, "margins", nextMargins);
  const nextConfig = setObjectField(template.config, "page", nextPage);

  return withTemplateConfig(template, nextConfig);
}

function setObjectField<TObject extends object, TKey extends keyof TObject>(
  source: TObject | undefined,
  field: TKey,
  value: TObject[TKey] | EmptyConfigValue,
): TObject | undefined {
  const next = { ...source } as TObject;

  if (isClearedConfigValue(value)) {
    delete next[field];
  } else {
    next[field] = value;
  }

  return pruneEmptyObject(next);
}

function withBlockConfig<TType extends BlockType>(
  block: BlockByType<TType>,
  config: BlockConfig | undefined,
): BlockByType<TType> {
  if (config === undefined) {
    const { config: _config, ...rest } = block;

    return rest as BlockByType<TType>;
  }

  return { ...block, config } as BlockByType<TType>;
}

function setCommonBlockConfigField<TType extends BlockType, TKey extends keyof BlockConfig>(
  block: BlockByType<TType>,
  field: TKey,
  value: BlockConfig[TKey] | EmptyConfigValue,
): BlockByType<TType> {
  const nextConfig = setObjectField<BlockConfig, TKey>(block.config, field, value);

  return withBlockConfig(block, nextConfig);
}

function withTemplateConfig(template: Template, config: TemplateConfig | undefined): Template {
  if (config === undefined) {
    const { config: _config, ...rest } = template;

    return rest;
  }

  return { ...template, config };
}

function pruneEmptyObject<TObject extends object>(value: TObject): TObject | undefined {
  return Object.keys(value).length === 0 ? undefined : value;
}

function isClearedConfigValue(value: unknown): value is EmptyConfigValue {
  return value === "" || value === null || value === undefined;
}
