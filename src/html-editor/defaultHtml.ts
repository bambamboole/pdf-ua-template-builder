/** Seed document for the HTML editor: a small, accessible page that renders cleanly to PDF/UA. */
export const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Untitled document</title>
    <style>
      body {
        font-family: system-ui, sans-serif;
        margin: 2rem;
        color: #1a1a1a;
        line-height: 1.5;
      }
      h1 {
        font-size: 1.75rem;
        margin-bottom: 0.5rem;
      }
    </style>
  </head>
  <body>
    <h1>Hello, PDF/UA</h1>
    <p>Edit this HTML and render it to preview the accessible PDF.</p>
  </body>
</html>
`;
