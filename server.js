import { createServer as createHttpServer } from "node:http";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { getTotalCents, validateExpense } from "./src/expenseTracker.js";

const root = dirname(fileURLToPath(import.meta.url));
const publicFiles = new Map([
  ["/", join(root, "index.html")],
  ["/index.html", join(root, "index.html")],
  ["/src/app.js", join(root, "src", "app.js")],
  ["/src/styles.css", join(root, "src", "styles.css")]
]);
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8"
};

async function readExpenses(dataFile) {
  try {
    const content = await readFile(dataFile, "utf8");
    const expenses = JSON.parse(content);
    return Array.isArray(expenses) ? expenses : [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeExpenses(dataFile, expenses) {
  await mkdir(dirname(dataFile), { recursive: true });
  const temporaryFile = `${dataFile}.${randomUUID()}.tmp`;
  await writeFile(temporaryFile, `${JSON.stringify(expenses, null, 2)}\n`, "utf8");
  await rename(temporaryFile, dataFile);
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 16_384) throw Object.assign(new Error("Request body is too large."), { statusCode: 413 });
  }
  try {
    return JSON.parse(body);
  } catch {
    throw Object.assign(new Error("Request body must be valid JSON."), { statusCode: 400 });
  }
}

function sendJson(response, statusCode, value) {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(value));
}

export function createServer({ dataFile = join(root, "data", "expenses.json") } = {}) {
  let writeQueue = Promise.resolve();
  const serializeUpdate = (update) => {
    const operation = writeQueue.then(async () => {
      const expenses = await readExpenses(dataFile);
      const result = update(expenses);
      await writeExpenses(dataFile, expenses);
      return result;
    });
    writeQueue = operation.catch(() => {});
    return operation;
  };

  return createHttpServer(async (request, response) => {
    const url = new URL(request.url, "http://localhost");

    try {
      if (url.pathname === "/api/expenses" && request.method === "GET") {
        await writeQueue;
        const expenses = await readExpenses(dataFile);
        sendJson(response, 200, { expenses, totalCents: getTotalCents(expenses) });
        return;
      }

      if (url.pathname === "/api/expenses" && request.method === "POST") {
        const input = await readJson(request);
        const normalized = validateExpense(input);
        const expense = { id: randomUUID(), ...normalized, createdAt: new Date().toISOString() };
        const expenses = await serializeUpdate((current) => {
          current.push(expense);
          return current;
        });
        sendJson(response, 201, { expense, expenses, totalCents: getTotalCents(expenses) });
        return;
      }

      const deleteMatch = url.pathname.match(/^\/api\/expenses\/([\w-]+)$/);
      if (deleteMatch && request.method === "DELETE") {
        let deleted = false;
        const expenses = await serializeUpdate((current) => {
          const index = current.findIndex((expense) => expense.id === deleteMatch[1]);
          if (index !== -1) {
            current.splice(index, 1);
            deleted = true;
          }
          return current;
        });
        if (!deleted) {
          sendJson(response, 404, { error: "Expense not found." });
          return;
        }
        sendJson(response, 200, { expenses, totalCents: getTotalCents(expenses) });
        return;
      }

      if (request.method === "GET" && publicFiles.has(url.pathname)) {
        const filePath = publicFiles.get(url.pathname);
        const content = await readFile(filePath);
        response.writeHead(200, {
          "content-type": contentTypes[extname(filePath)],
          "x-content-type-options": "nosniff"
        });
        response.end(content);
        return;
      }

      sendJson(response, 404, { error: "Not found." });
    } catch (error) {
      const statusCode = error.statusCode ?? (error instanceof TypeError ? 400 : 500);
      sendJson(response, statusCode, { error: error.message || "Internal server error." });
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT) || 3000;
  createServer().listen(port, "127.0.0.1", () => {
    console.log(`Expense Tracker running at http://127.0.0.1:${port}`);
  });
}