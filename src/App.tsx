import { TemplateBuilder } from "./builder/TemplateBuilder";

export default function App() {
  return <TemplateBuilder apiUrl={import.meta.env.VITE_PDF_UA_API_URL} />;
}
