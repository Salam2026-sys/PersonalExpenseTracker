import { describe, it, expect } from "vitest";
import { getTotal } from "../src/expenseTracker.js";

describe("Expense Tracker", () => {
  it("calculates total expenses", () => {
    const expenses = [
      { amount: 10 },
      { amount: 20 }
    ];

    expect(getTotal(expenses)).toBe(30);
  });
});