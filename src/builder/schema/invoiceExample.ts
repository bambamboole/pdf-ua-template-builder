import type { Template } from "../../types/generated/template";

export type TableRow = Record<string, string>;
export type InvoiceData = Record<string, TableRow[]>;

const LOGO_SRC =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNjAiIGhlaWdodD0iNzIiIHZpZXdCb3g9IjAgMCAyNjAgNzIiPjx0ZXh0IHg9IjAiIHk9IjQyIiBmaWxsPSIjMTExODI3IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzAiIGZvbnQtd2VpZ2h0PSI3MDAiPlBERiBVQSBLaXQ8L3RleHQ+PC9zdmc+";

export interface InvoiceExample {
  template: Template;
  data: InvoiceData;
}

export function createInvoiceExample(): InvoiceExample {
  const template: Template = {
    version: 1,
    config: {
      page: {
        size: { format: "A4", orientation: "portrait" },
        locale: "de_DE",
        margins: { top: 20, right: 20, bottom: 20, left: 25 },
        pageNumbers: { enabled: true, position: "center" },
        footer: {
          repeat: true,
          rows: [
            {
              blocks: [
                {
                  type: "text",
                  id: "footer-legal",
                  text: "PDF UA Kit GmbH · Musterstraße 1 · 10115 Berlin · Germany · Invoice was created electronically and is valid without signature.",
                  config: { width: "68%" },
                },
                {
                  type: "key-value",
                  id: "footer-meta",
                  values: {
                    registration: "HRB 123456 B",
                    taxNumber: "DE123456789",
                  },
                  config: {
                    width: "32%",
                    align: "right",
                    fields: [
                      { key: "registration", label: "Registry" },
                      { key: "taxNumber", label: "Tax no." },
                    ],
                  },
                },
              ],
            },
          ],
        },
      },
      typography: { family: "Inter", size: 10 },
    },
    rows: [
      {
        blocks: [
          {
            type: "image",
            id: "logo",
            src: LOGO_SRC,
            alt: "PDF UA Kit GmbH logo",
            config: { width: "58%", maxHeight: 28 },
          },
          {
            type: "key-value",
            id: "invoice-meta",
            values: {
              invoiceNumber: "RE-2026-001234",
              issueDate: "2026-02-17",
              dueDate: "2026-03-19",
              currency: "EUR",
            },
            config: {
              width: "42%",
              align: "right",
              fields: [
                { key: "invoiceNumber", label: "Invoice number" },
                { key: "issueDate", label: "Issue date" },
                { key: "dueDate", label: "Due date" },
                { key: "currency", label: "Currency" },
              ],
            },
          },
        ],
      },
      {
        blocks: [
          {
            type: "heading",
            id: "title",
            text: "Invoice",
            config: { level: 1 },
          },
        ],
      },
      {
        blocks: [
          {
            type: "key-value",
            id: "seller",
            values: {
              name: "PDF UA Kit GmbH",
              address: "Musterstraße 1, 10115 Berlin, DE",
              contact: "Max Mustermann",
              email: "billing@pdfua-kit.example",
              vatId: "DE123456789",
            },
            config: {
              width: "50%",
              fields: [
                { key: "name", label: "Seller" },
                { key: "address", label: "Address" },
                { key: "contact", label: "Contact" },
                { key: "email", label: "Email" },
                { key: "vatId", label: "VAT ID" },
              ],
            },
          },
          {
            type: "key-value",
            id: "buyer",
            values: {
              name: "Musterkunde AG",
              address: "Käuferweg 2, 80331 München, DE",
              email: "invoice@musterkunde.example",
              reference: "04011000-12345-67",
            },
            config: {
              width: "50%",
              fields: [
                { key: "name", label: "Buyer" },
                { key: "address", label: "Address" },
                { key: "email", label: "Email" },
                { key: "reference", label: "Buyer reference" },
              ],
            },
          },
        ],
      },
      {
        blocks: [{ type: "divider", id: "address-rule" }],
      },
      {
        blocks: [
          {
            type: "table",
            id: "lineItems",
            config: {
              style: "striped",
              numberRows: true,
              columns: [
                { key: "description", label: "Description", align: "left", width: "38%" },
                { key: "quantity", label: "Qty", align: "right", width: "12%" },
                { key: "unitPrice", label: "Unit price", align: "right", width: "16%" },
                { key: "vatRate", label: "VAT", align: "right", width: "11%" },
                { key: "total", label: "Total", align: "right", width: "16%" },
              ],
            },
          },
        ],
      },
      {
        blocks: [
          {
            type: "table",
            id: "vat-breakdown",
            config: {
              style: "minimal",
              width: "54%",
              numberRows: false,
              columns: [
                { key: "vatCategory", label: "VAT category", align: "left" },
                { key: "rate", label: "Rate", align: "right" },
                { key: "taxableAmount", label: "Taxable amount", align: "right" },
                { key: "vatAmount", label: "VAT amount", align: "right" },
              ],
            },
          },
          {
            type: "key-value",
            id: "totals",
            values: {
              netAmount: "6.120,00 €",
              vatAmount: "1.162,80 €",
              grandTotal: "7.282,80 €",
              amountDue: "7.282,80 €",
            },
            config: {
              width: "46%",
              align: "right",
              fields: [
                { key: "netAmount", label: "Net amount" },
                { key: "vatAmount", label: "VAT 19%" },
                { key: "grandTotal", label: "Grand total" },
                { key: "amountDue", label: "Amount due" },
              ],
            },
          },
        ],
      },
      {
        blocks: [
          {
            type: "text",
            id: "notice",
            text: "Please transfer the amount due within 30 days. Include the invoice number as the payment reference.",
            config: { width: "54%", spacing: { top: 4 } },
          },
          {
            type: "key-value",
            id: "payment",
            values: {
              bank: "Musterbank Berlin",
              iban: "DE89370400440532013000",
              bic: "COBADEFFXXX",
              reference: "RE-2026-001234",
            },
            config: {
              width: "46%",
              align: "right",
              fields: [
                { key: "bank", label: "Bank" },
                { key: "iban", label: "IBAN" },
                { key: "bic", label: "BIC" },
                { key: "reference", label: "Payment reference" },
              ],
            },
          },
        ],
      },
    ],
  };

  const data: InvoiceData = {
    lineItems: [
      {
        description: "Accessible PDF template implementation",
        quantity: "40",
        unitPrice: "95,00 €",
        vatRate: "19%",
        total: "3.800,00 €",
      },
      {
        description: "Document structure and tagging review",
        quantity: "16",
        unitPrice: "85,00 €",
        vatRate: "19%",
        total: "1.360,00 €",
      },
      {
        description: "Project management and acceptance testing",
        quantity: "8",
        unitPrice: "90,00 €",
        vatRate: "19%",
        total: "720,00 €",
      },
      {
        description: "Annual hosting and maintenance package",
        quantity: "1",
        unitPrice: "240,00 €",
        vatRate: "19%",
        total: "240,00 €",
      },
    ],
    "vat-breakdown": [
      {
        vatCategory: "Standard rate",
        rate: "19%",
        taxableAmount: "6.120,00 €",
        vatAmount: "1.162,80 €",
      },
    ],
  };

  return { template, data };
}
