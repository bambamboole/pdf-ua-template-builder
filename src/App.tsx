import { TemplateBuilder } from "./builder/TemplateBuilder";
import { createInvoiceExample } from "./builder/schema/invoiceExample";

export default function App() {
  return (
    <TemplateBuilder
      apiUrl={import.meta.env.VITE_PDF_UA_API_URL}
      examples={{ Invoice: createInvoiceExample() }}
    />
  );
}
