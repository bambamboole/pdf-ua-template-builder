const baseUrl =
  process.env.PDF_UA_OPENAPI_URL ??
  `${(process.env.PDF_UA_API_PROXY_URL ?? process.env.PDF_UA_API_URL ?? "http://localhost:9999").replace(
    /\/+$/,
    "",
  )}/openapi.json`;
const timeoutMs = Number(process.env.PDF_UA_API_WAIT_TIMEOUT_MS ?? 30_000);
const retryMs = 500;
const deadline = Date.now() + timeoutMs;

await waitForOpenApi();
console.log(`pdf-ua-api ready at ${baseUrl}`);
process.exit(0);

function waitForOpenApi() {
  return checkReady().then((ready) => {
    if (ready) {
      return undefined;
    }

    if (Date.now() >= deadline) {
      throw new Error(`Timed out waiting for pdf-ua-api OpenAPI document at ${baseUrl}`);
    }

    return delay(retryMs).then(waitForOpenApi);
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkReady() {
  try {
    const response = await fetch(baseUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}
