import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "../server.js";

describe("expense tracker server", () => {
  let directory;
  let dataFile;
  let server;
  let baseUrl;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), "expense-tracker-"));
    dataFile = join(directory, "expenses.json");
    server = createServer({ dataFile });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  afterEach(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await rm(directory, { recursive: true, force: true });
  });

  it("serves the app and starts with an empty expense list", async () => {
    const page = await fetch(baseUrl);
    const result = await (await fetch(`${baseUrl}/api/expenses`)).json();

    expect(page.status).toBe(200);
    expect(page.headers.get("content-type")).toContain("text/html");
    expect(result).toEqual({ expenses: [], totalCents: 0 });
  });

  it("creates, persists, and deletes expenses", async () => {
    const createdResponse = await fetch(`${baseUrl}/api/expenses`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Coffee", value: "2.50", quantity: 3, date: "2026-10-06" })
    });
    const created = await createdResponse.json();
    const reloaded = await (await fetch(`${baseUrl}/api/expenses`)).json();
    const persisted = JSON.parse(await readFile(dataFile, "utf8"));
    const deletedResponse = await fetch(`${baseUrl}/api/expenses/${created.expense.id}`, { method: "DELETE" });

    expect(createdResponse.status).toBe(201);
    expect(created.totalCents).toBe(750);
    expect(created.expenses).toHaveLength(1);
    expect(reloaded.expenses[0].id).toBe(created.expense.id);
    expect(reloaded.totalCents).toBe(750);
    expect(persisted).toHaveLength(1);
    expect((await deletedResponse.json()).totalCents).toBe(0);
  });

  it("rejects invalid data and unknown delete IDs", async () => {
    const invalidResponse = await fetch(`${baseUrl}/api/expenses`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "", value: 4, quantity: 1, date: "2026-10-06" })
    });
    const missingResponse = await fetch(`${baseUrl}/api/expenses/unknown-id`, { method: "DELETE" });

    expect(invalidResponse.status).toBe(400);
    expect(missingResponse.status).toBe(404);
  });

  it("returns an error for malformed JSON", async () => {
    const response = await fetch(`${baseUrl}/api/expenses`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not json"
    });

    expect(response.status).toBe(400);
  });
});