import type { ReactNode } from "react";
import type {
  BarcodeBlock,
  BarcodeContent,
  Block,
  Swiss,
  SwissAddress,
  SwissReferenceType,
  WifiSecurity,
} from "../../../types/generated/template";
import {
  addGs1Element,
  BARCODE_CONTENT_OPTIONS,
  barcodeContentLabel,
  createSwissAddress,
  describeBarcodeContent,
  isBarcodeCompatible,
  removeGs1Element,
  SYMBOLOGY_OPTIONS,
  updateGs1Element,
  withBarcodeContentType,
  withBarcodeSymbology,
} from "../../blocks/barcode";
import {
  CheckboxField,
  SelectField,
  TextAreaField,
  TextField,
  type SelectFieldOption,
} from "../../controls";
import { AddButton, Button } from "../../primitives/Button";
import { setBlockField } from "../../state/configUpdates";
import { InspectorSection } from "../InspectorShell";
import type { BlockEditorProps } from "./blockEditors";

const wifiSecurityOptions = [
  { value: "WPA", label: "WPA/WPA2" },
  { value: "WEP", label: "WEP" },
  { value: "nopass", label: "No password" },
] as const satisfies readonly SelectFieldOption<WifiSecurity>[];

const swissReferenceOptions = [
  { value: "NON", label: "None" },
  { value: "QRR", label: "QR reference" },
  { value: "SCOR", label: "Creditor reference" },
] as const satisfies readonly SelectFieldOption<SwissReferenceType>[];

export function BarcodeBlockEditor({ block, onChangeBlock }: BlockEditorProps): ReactNode {
  const barcode = block as BarcodeBlock;
  const summary = describeBarcodeContent(barcode.content);
  const incompatible = !isBarcodeCompatible(barcode.symbology, barcode.content.type);

  return (
    <>
      <InspectorSection title="Barcode">
        <div className="grid gap-2">
          <div className="grid grid-cols-2 gap-2">
            <SelectField
              name="symbology"
              label="Symbology"
              value={barcode.symbology}
              options={SYMBOLOGY_OPTIONS}
              onChange={(value) => {
                if (value) {
                  onChangeBlock(withBarcodeSymbology(barcode, value));
                }
              }}
            />
            <SelectField
              name="content.type"
              label="Content"
              value={barcode.content.type}
              options={BARCODE_CONTENT_OPTIONS}
              onChange={(value) => {
                if (value) {
                  onChangeBlock(withBarcodeContentType(barcode, value));
                }
              }}
            />
          </div>
          {incompatible ? (
            <p className="m-0 rounded border border-solid border-danger bg-danger-soft px-2 py-1.5 text-2xs text-danger">
              {barcodeContentLabel(barcode.content.type)} is not compatible with {barcode.symbology}
              .
            </p>
          ) : null}
          {summary ? <p className="m-0 line-clamp-2 text-2xs text-fg-muted">{summary}</p> : null}
        </div>
      </InspectorSection>

      <InspectorSection title={barcodeContentLabel(barcode.content.type)}>
        {renderContentFields(barcode, onChangeBlock)}
      </InspectorSection>
    </>
  );
}

function renderContentFields(
  block: BarcodeBlock,
  onChangeBlock: (block: Block) => void,
): ReactNode {
  const { content } = block;

  switch (content.type) {
    case "raw":
      return (
        <TextAreaField
          name="content.value"
          label="Value"
          value={content.value}
          rows={3}
          onChange={(value) =>
            onChangeBlock(withContent(block, { ...content, value: value ?? "" }))
          }
        />
      );
    case "text":
      return (
        <TextAreaField
          name="content.text"
          label="Text"
          value={content.text}
          rows={3}
          onChange={(value) => onChangeBlock(withContent(block, { ...content, text: value ?? "" }))}
        />
      );
    case "url":
      return (
        <TextField
          name="content.url"
          label="URL"
          value={content.url}
          placeholder="https://example.com"
          onChange={(value) => onChangeBlock(withContent(block, { ...content, url: value ?? "" }))}
        />
      );
    case "epc":
      return (
        <div className="grid gap-2">
          <TextField
            name="content.name"
            label="Recipient"
            value={content.name}
            onChange={(value) =>
              onChangeBlock(withContent(block, { ...content, name: value ?? "" }))
            }
          />
          <TextField
            name="content.iban"
            label="IBAN"
            value={content.iban}
            onChange={(value) =>
              onChangeBlock(withContent(block, { ...content, iban: value ?? "" }))
            }
          />
          <div className="grid grid-cols-2 gap-2">
            <TextField
              name="content.bic"
              label="BIC"
              value={content.bic ?? undefined}
              emptyValue="undefined"
              onChange={(value) =>
                onChangeBlock(withContent(block, setOptional(content, "bic", value)))
              }
            />
            <TextField
              name="content.amount"
              label="Amount"
              value={content.amount ?? undefined}
              placeholder="12.50"
              emptyValue="undefined"
              onChange={(value) =>
                onChangeBlock(withContent(block, setOptional(content, "amount", value)))
              }
            />
          </div>
          <TextField
            name="content.purpose"
            label="Purpose"
            value={content.purpose ?? undefined}
            emptyValue="undefined"
            onChange={(value) =>
              onChangeBlock(withContent(block, setOptional(content, "purpose", value)))
            }
          />
          <TextField
            name="content.reference"
            label="Reference"
            value={content.reference ?? undefined}
            emptyValue="undefined"
            onChange={(value) =>
              onChangeBlock(withContent(block, setOptional(content, "reference", value)))
            }
          />
          <TextAreaField
            name="content.remittance"
            label="Remittance"
            value={content.remittance ?? undefined}
            emptyValue="undefined"
            rows={3}
            onChange={(value) =>
              onChangeBlock(withContent(block, setOptional(content, "remittance", value)))
            }
          />
        </div>
      );
    case "vcard":
      return (
        <div className="grid gap-2">
          <div className="grid grid-cols-2 gap-2">
            <TextField
              name="content.firstName"
              label="First name"
              value={content.firstName}
              onChange={(value) =>
                onChangeBlock(withContent(block, { ...content, firstName: value ?? "" }))
              }
            />
            <TextField
              name="content.lastName"
              label="Last name"
              value={content.lastName}
              onChange={(value) =>
                onChangeBlock(withContent(block, { ...content, lastName: value ?? "" }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TextField
              name="content.org"
              label="Organization"
              value={content.org ?? undefined}
              emptyValue="undefined"
              onChange={(value) =>
                onChangeBlock(withContent(block, setOptional(content, "org", value)))
              }
            />
            <TextField
              name="content.title"
              label="Title"
              value={content.title ?? undefined}
              emptyValue="undefined"
              onChange={(value) =>
                onChangeBlock(withContent(block, setOptional(content, "title", value)))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TextField
              name="content.phone"
              label="Phone"
              value={content.phone ?? undefined}
              emptyValue="undefined"
              onChange={(value) =>
                onChangeBlock(withContent(block, setOptional(content, "phone", value)))
              }
            />
            <TextField
              name="content.email"
              label="Email"
              value={content.email ?? undefined}
              emptyValue="undefined"
              onChange={(value) =>
                onChangeBlock(withContent(block, setOptional(content, "email", value)))
              }
            />
          </div>
          <TextField
            name="content.url"
            label="URL"
            value={content.url ?? undefined}
            emptyValue="undefined"
            onChange={(value) =>
              onChangeBlock(withContent(block, setOptional(content, "url", value)))
            }
          />
        </div>
      );
    case "wifi":
      return (
        <div className="grid gap-2">
          <TextField
            name="content.ssid"
            label="SSID"
            value={content.ssid}
            onChange={(value) =>
              onChangeBlock(withContent(block, { ...content, ssid: value ?? "" }))
            }
          />
          <TextField
            name="content.password"
            label="Password"
            value={content.password ?? undefined}
            emptyValue="undefined"
            onChange={(value) =>
              onChangeBlock(withContent(block, setOptional(content, "password", value)))
            }
          />
          <div className="grid grid-cols-2 gap-2">
            <SelectField
              name="content.security"
              label="Security"
              value={content.security ?? "WPA"}
              options={wifiSecurityOptions}
              onChange={(value) =>
                onChangeBlock(withContent(block, { ...content, security: value ?? "WPA" }))
              }
            />
            <CheckboxField
              name="content.hidden"
              label="Hidden"
              checked={content.hidden === true}
              onChange={(checked) =>
                onChangeBlock(withContent(block, { ...content, hidden: checked }))
              }
            />
          </div>
        </div>
      );
    case "gs1":
      return (
        <div className="grid gap-2">
          {content.elements.map((element, index) => (
            <div
              key={`${element.ai}:${element.value}`}
              className="grid grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)_auto] items-end gap-2"
            >
              <TextField
                name={`content.elements.${index}.ai`}
                label="AI"
                value={element.ai}
                onChange={(value) =>
                  onChangeBlock(
                    withContent(
                      block,
                      updateGs1Element(content, index, { ...element, ai: value ?? "" }),
                    ),
                  )
                }
              />
              <TextField
                name={`content.elements.${index}.value`}
                label="Value"
                value={element.value}
                onChange={(value) =>
                  onChangeBlock(
                    withContent(
                      block,
                      updateGs1Element(content, index, { ...element, value: value ?? "" }),
                    ),
                  )
                }
              />
              <Button
                variant="ghost"
                icon
                aria-label={`Remove GS1 element ${index + 1}`}
                onClick={() => onChangeBlock(withContent(block, removeGs1Element(content, index)))}
              >
                ×
              </Button>
            </div>
          ))}
          <AddButton onClick={() => onChangeBlock(withContent(block, addGs1Element(content)))}>
            Add element
          </AddButton>
        </div>
      );
    case "swiss":
      return <SwissContentEditor block={block} content={content} onChangeBlock={onChangeBlock} />;
  }
}

function SwissContentEditor({
  block,
  content,
  onChangeBlock,
}: {
  block: BarcodeBlock;
  content: Swiss;
  onChangeBlock: (block: Block) => void;
}) {
  return (
    <div className="grid gap-3">
      <TextField
        name="content.creditorIban"
        label="Creditor IBAN"
        value={content.creditorIban}
        onChange={(value) =>
          onChangeBlock(withContent(block, { ...content, creditorIban: value ?? "" }))
        }
      />
      <SwissAddressEditor
        prefix="content.creditor"
        title="Creditor"
        address={content.creditor}
        onChange={(creditor) => onChangeBlock(withContent(block, { ...content, creditor }))}
      />
      <div className="grid grid-cols-2 gap-2">
        <TextField
          name="content.amount"
          label="Amount"
          value={content.amount ?? undefined}
          placeholder="1949.75"
          emptyValue="undefined"
          onChange={(value) =>
            onChangeBlock(withContent(block, setOptional(content, "amount", value)))
          }
        />
        <TextField
          name="content.currency"
          label="Currency"
          value={content.currency ?? "CHF"}
          onChange={(value) =>
            onChangeBlock(withContent(block, { ...content, currency: value ?? "CHF" }))
          }
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <SelectField
          name="content.referenceType"
          label="Reference type"
          value={content.referenceType ?? "NON"}
          options={swissReferenceOptions}
          onChange={(value) =>
            onChangeBlock(withContent(block, { ...content, referenceType: value ?? "NON" }))
          }
        />
        <TextField
          name="content.reference"
          label="Reference"
          value={content.reference ?? undefined}
          emptyValue="undefined"
          onChange={(value) =>
            onChangeBlock(withContent(block, setOptional(content, "reference", value)))
          }
        />
      </div>
      <TextAreaField
        name="content.message"
        label="Message"
        value={content.message ?? undefined}
        emptyValue="undefined"
        rows={3}
        onChange={(value) =>
          onChangeBlock(withContent(block, setOptional(content, "message", value)))
        }
      />
      <CheckboxField
        name="content.debtor.enabled"
        label="Debtor"
        checked={content.debtor !== undefined && content.debtor !== null}
        onChange={(checked) =>
          onChangeBlock(
            withContent(block, {
              ...content,
              debtor: checked ? (content.debtor ?? createSwissAddress()) : undefined,
            }),
          )
        }
      />
      {content.debtor ? (
        <SwissAddressEditor
          prefix="content.debtor"
          title="Debtor"
          address={content.debtor}
          onChange={(debtor) => onChangeBlock(withContent(block, { ...content, debtor }))}
        />
      ) : null}
      <p className="-mt-1 m-0 text-2xs text-fg-muted">
        Swiss QR uses a 46mm default height. Backend validation checks IBAN, reference type, and
        barcode encodability.
      </p>
    </div>
  );
}

function SwissAddressEditor({
  prefix,
  title,
  address,
  onChange,
}: {
  prefix: string;
  title: string;
  address: SwissAddress;
  onChange: (address: SwissAddress) => void;
}) {
  return (
    <div className="grid gap-2 rounded border border-solid border-border bg-surface px-2 py-2">
      <p className="m-0 text-2xs font-semibold text-fg-muted">{title}</p>
      <TextField
        name={`${prefix}.name`}
        label="Name"
        value={address.name}
        onChange={(value) => onChange({ ...address, name: value ?? "" })}
      />
      <div className="grid grid-cols-2 gap-2">
        <TextField
          name={`${prefix}.street`}
          label="Street"
          value={address.street ?? undefined}
          emptyValue="undefined"
          onChange={(value) => onChange(setOptional(address, "street", value))}
        />
        <TextField
          name={`${prefix}.buildingNumber`}
          label="Building"
          value={address.buildingNumber ?? undefined}
          emptyValue="undefined"
          onChange={(value) => onChange(setOptional(address, "buildingNumber", value))}
        />
      </div>
      <div className="grid grid-cols-[0.7fr_1fr_0.55fr] gap-2">
        <TextField
          name={`${prefix}.postalCode`}
          label="Postal"
          value={address.postalCode}
          onChange={(value) => onChange({ ...address, postalCode: value ?? "" })}
        />
        <TextField
          name={`${prefix}.town`}
          label="Town"
          value={address.town}
          onChange={(value) => onChange({ ...address, town: value ?? "" })}
        />
        <TextField
          name={`${prefix}.country`}
          label="Country"
          value={address.country}
          onChange={(value) => onChange({ ...address, country: value ?? "" })}
        />
      </div>
    </div>
  );
}

function withContent(block: BarcodeBlock, content: BarcodeContent): BarcodeBlock {
  return { ...block, content };
}

function setOptional<TObject extends object, TKey extends keyof TObject>(
  source: TObject,
  field: TKey,
  value: TObject[TKey] | string | undefined,
): TObject {
  const next = { ...source };

  if (value === undefined || value === "") {
    delete next[field];
  } else {
    next[field] = value as TObject[TKey];
  }

  return next;
}

export function setBarcodeHeight(block: BarcodeBlock, value: string | undefined): BarcodeBlock {
  return setBlockField(block, "height", value);
}
