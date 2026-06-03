import type {
  BarcodeBlock,
  BarcodeContent,
  Gs1Element,
  Swiss,
  SwissAddress,
  Symbology,
} from "../../types/generated/template";
import type { SelectFieldOption } from "../controls";

export type BarcodeContentType = BarcodeContent["type"];

export const SYMBOLOGY_OPTIONS = [
  { value: "qr", label: "QR" },
  { value: "datamatrix", label: "Data Matrix" },
  { value: "aztec", label: "Aztec" },
  { value: "pdf417", label: "PDF417" },
  { value: "code128", label: "Code 128" },
  { value: "code39", label: "Code 39" },
  { value: "ean13", label: "EAN-13" },
  { value: "ean8", label: "EAN-8" },
  { value: "upca", label: "UPC-A" },
  { value: "upce", label: "UPC-E" },
  { value: "itf14", label: "ITF-14" },
  { value: "codabar", label: "Codabar" },
  { value: "gs1-128", label: "GS1-128" },
  { value: "gs1-datamatrix", label: "GS1 Data Matrix" },
  { value: "gs1-qr", label: "GS1 QR" },
  { value: "gs1-databar", label: "GS1 DataBar" },
  { value: "gs1-databar-expanded", label: "GS1 DataBar Expanded" },
  { value: "swiss-qr", label: "Swiss QR" },
] as const satisfies readonly SelectFieldOption<Symbology>[];

export const BARCODE_CONTENT_OPTIONS = [
  { value: "raw", label: "Raw value" },
  { value: "text", label: "Text" },
  { value: "url", label: "URL" },
  { value: "epc", label: "EPC payment" },
  { value: "vcard", label: "vCard" },
  { value: "wifi", label: "Wi-Fi" },
  { value: "gs1", label: "GS1 elements" },
  { value: "swiss", label: "Swiss QR bill" },
] as const satisfies readonly SelectFieldOption<BarcodeContentType>[];

const allSymbologies: readonly Symbology[] = SYMBOLOGY_OPTIONS.map((option) => option.value);
const matrixSymbologies: readonly Symbology[] = ["qr", "datamatrix", "aztec", "pdf417"];
const gs1ContentSymbologies: readonly Symbology[] = [
  "gs1-128",
  "gs1-datamatrix",
  "gs1-qr",
  "gs1-databar-expanded",
] as const;

const compatibleByContent: Record<BarcodeContentType, readonly Symbology[]> = {
  raw: allSymbologies,
  text: matrixSymbologies,
  url: matrixSymbologies,
  epc: ["qr"],
  vcard: ["qr"],
  wifi: ["qr"],
  gs1: gs1ContentSymbologies,
  swiss: ["swiss-qr"],
};

export function isBarcodeCompatible(
  symbology: Symbology,
  contentType: BarcodeContentType,
): boolean {
  return compatibleByContent[contentType].includes(symbology);
}

export function compatibleSymbologies(contentType: BarcodeContentType): readonly Symbology[] {
  return compatibleByContent[contentType];
}

export function withBarcodeSymbology(block: BarcodeBlock, symbology: Symbology): BarcodeBlock {
  const content = isBarcodeCompatible(symbology, block.content.type)
    ? block.content
    : defaultContentForSymbology(symbology);

  return withSwissHeight({ ...block, symbology, content });
}

export function withBarcodeContentType(
  block: BarcodeBlock,
  contentType: BarcodeContentType,
): BarcodeBlock {
  const compatible = compatibleSymbologies(contentType);
  const symbology = compatible.includes(block.symbology) ? block.symbology : compatible[0];

  return withSwissHeight({
    ...block,
    symbology,
    content: createBarcodeContent(contentType),
  });
}

export function createBarcodeContent(contentType: BarcodeContentType): BarcodeContent {
  switch (contentType) {
    case "raw":
      return { type: "raw", value: "Example" };
    case "text":
      return { type: "text", text: "Example" };
    case "url":
      return { type: "url", url: "https://example.com" };
    case "epc":
      return { type: "epc", name: "", iban: "" };
    case "vcard":
      return { type: "vcard", firstName: "", lastName: "" };
    case "wifi":
      return { type: "wifi", ssid: "", security: "WPA", hidden: false };
    case "gs1":
      return { type: "gs1", elements: [{ ai: "01", value: "09521234543213" }] };
    case "swiss":
      return createSwissQrContent();
  }
}

export function createSwissAddress(): SwissAddress {
  return {
    name: "",
    postalCode: "",
    town: "",
    country: "CH",
  };
}

export function createSwissQrContent(): Swiss {
  return {
    type: "swiss",
    creditorIban: "CH4431999123000889012",
    creditor: {
      name: "Robert Schneider AG",
      street: "Rue du Lac",
      buildingNumber: "1268/2/22",
      postalCode: "2501",
      town: "Biel",
      country: "CH",
    },
    amount: "1949.75",
    currency: "CHF",
    referenceType: "QRR",
    reference: "210000000003139471430009017",
  };
}

export function addGs1Element(content: Extract<BarcodeContent, { type: "gs1" }>): BarcodeContent {
  return {
    ...content,
    elements: [...content.elements, { ai: "", value: "" }],
  };
}

export function updateGs1Element(
  content: Extract<BarcodeContent, { type: "gs1" }>,
  index: number,
  element: Gs1Element,
): BarcodeContent {
  return {
    ...content,
    elements: content.elements.map((current, currentIndex) =>
      currentIndex === index ? element : current,
    ),
  };
}

export function removeGs1Element(
  content: Extract<BarcodeContent, { type: "gs1" }>,
  index: number,
): BarcodeContent {
  return {
    ...content,
    elements: content.elements.filter((_, currentIndex) => currentIndex !== index),
  };
}

export function describeBarcodeContent(content: BarcodeContent): string {
  switch (content.type) {
    case "raw":
      return content.value;
    case "text":
      return content.text;
    case "url":
      return content.url;
    case "epc":
      return content.name || content.iban;
    case "vcard":
      return [content.firstName, content.lastName].filter(Boolean).join(" ");
    case "wifi":
      return content.ssid;
    case "gs1":
      return content.elements.map((element) => `(${element.ai}) ${element.value}`).join(", ");
    case "swiss":
      return content.creditor.name || content.creditorIban;
  }
}

export function barcodeContentLabel(contentType: BarcodeContentType): string {
  return (
    BARCODE_CONTENT_OPTIONS.find((option) => option.value === contentType)?.label ??
    prettify(contentType)
  );
}

export function symbologyLabel(symbology: Symbology): string {
  return (
    SYMBOLOGY_OPTIONS.find((option) => option.value === symbology)?.label ?? prettify(symbology)
  );
}

function defaultContentForSymbology(symbology: Symbology): BarcodeContent {
  if (symbology === "swiss-qr") {
    return createBarcodeContent("swiss");
  }

  if (gs1ContentSymbologies.includes(symbology)) {
    return createBarcodeContent("gs1");
  }

  return createBarcodeContent("raw");
}

function withSwissHeight(block: BarcodeBlock): BarcodeBlock {
  if (block.symbology !== "swiss-qr") {
    return block;
  }

  return block.height ? block : { ...block, height: "46mm" };
}

function prettify(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
