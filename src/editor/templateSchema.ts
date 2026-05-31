import schema from "../../schemas/template.schema.json";

// The validation contract shipped with the package, fed to codemirror-json-schema.
export const templateSchema = schema as Record<string, unknown>;
