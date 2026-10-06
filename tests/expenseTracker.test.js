import { describe, it, expect } from "vitest";
import { getExpenseTotalCents, getTotal, getTotalCents, validateExpense } from "../src/expenseTracker.js";

describe("Expense Tracker", () => {
  it("calculates total expenses", () => {
    const expenses = [
      { valueCents: 1000, quantity: 1 },
      { valueCents: 500, quantity: 4 }
    ];

    expect(getExpenseTotalCents(expenses[1])).toBe(2000);
    expect(getTotalCents(expenses)).toBe(3000);
    expect(getTotal(expenses)).toBe(30);
  });

  it("normalizes valid expense input", () => {
    expect(validateExpense({ name: "  Coffee ", value: "2.50", quantity: "3", date: "2026-10-06" })).toEqual({
      name: "Coffee",
      valueCents: 250,
      quantity: 3,
      date: "2026-10-06"
    });
  });

  it.each([
    [{ name: "", value: 2, quantity: 1, date: "2026-10-06" }, /Name/],
    [{ name: "Coffee", value: 0, quantity: 1, date: "2026-10-06" }, /Value/],
    [{ name: "Coffee", value: "1.005", quantity: 1, date: "2026-10-06" }, /Value/],
    [{ name: "Coffee", value: 2, quantity: 1.5, date: "2026-10-06" }, /whole number/],
    [{ name: "Coffee", value: "90071992547409.90", quantity: 2, date: "2026-10-06" }, /too large/],
    [{ name: "Coffee", value: 2, quantity: 1, date: "2026-02-30" }, /date/]
  ])("rejects invalid expense input", (input, message) => {
    expect(() => validateExpense(input)).toThrow(message);
  });
});