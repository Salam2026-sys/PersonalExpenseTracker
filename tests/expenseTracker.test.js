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
  });   //tests the functions that calculate the total of expenses

  it("returns 0 for empty expense list", () => {
    // An empty list should have no total.
    expect(getTotal([])).toBe(0);
    expect(getTotalCents([])).toBe(0);
  });

  it("normalizes valid expense input", () => {
    expect(validateExpense({ name: "  Coffee ", value: "2.50", quantity: "3", date: "2026-10-06" })).toEqual({
      name: "Coffee",   //checks that the name is trimmed
      valueCents: 250,  //checks that the value is converted to cents
      quantity: 3,  //checks that the quantity is converted to a number
      date: "2026-10-06"    //checks that the date is returned as a string
    });
  });

  it("accepts smallest valid value", () => {
    // One cent is the smallest supported price.
    const expense = validateExpense({
      name: "Coffee",
      value: "0.01",
      quantity: 1,
      date: "2026-10-06"
    });

    expect(expense.valueCents).toBe(1);
  });

  it.each([
    [{ name: "", value: 2, quantity: 1, date: "2026-10-06" }, /Enter a name/],  //checks that the name is not empty
    [{ name: "A".repeat(101), value: 2, quantity: 1, date: "2026-10-06" }, /100 characters/],  //checks that the name is not too long
    [{ name: "Coffee", value: 0, quantity: 1, date: "2026-10-06" }, /greater than 0/],   //checks that the value is positive
    [{ name: "Coffee", value: -1, quantity: 1, date: "2026-10-06" }, /greater than 0/],  //checks that the value is not negative
    [{ name: "Coffee", value: "abc", quantity: 1, date: "2026-10-06" }, /valid value/],   //checks that the value is a number
    [{ name: "Coffee", value: 2, quantity: 0, date: "2026-10-06" }, /Amount/],   //checks that the quantity is positive
    [{ name: "Coffee", value: 2, quantity: -1, date: "2026-10-06" }, /Amount/],  //checks that the quantity is not negative
    [{ name: "Coffee", value: 2, quantity: 1.5, date: "2026-10-06" }, /whole number/],  //checks that the quantity is a whole number
    [{ name: "Coffee", value: 2, quantity: "9007199254740992", date: "2026-10-06" }, /Amount is too big/], //checks that the quantity is not too large
    [{ name: "Coffee", value: 2, quantity: 1, date: "2026-02-30" }, /valid date/],   //checks that the date is valid
    [{ name: "Coffee", value: 2, quantity: 1, date: "2026-13-01" }, /valid date/],   //checks that the date is valid
    [{ name: "Coffee", value: 2, quantity: 1, date: "2026-10-06T00:00:00Z" }, /valid date/],   //checks that the date is valid
    [{ name: "Coffee", value: 2, quantity: 1, date: "" }, /valid date/],   //checks that the date is valid
    [{ name: "Coffee", value: "1.005", quantity: 1, date: "2026-10-06" }, /valid value/],  //checks that the value is not more than two decimal places
    [{ name: "Coffee", value: "90071992547409.92", quantity: 1, date: "2026-10-06" }, /Value is too big/], //checks that the unit value is too big
    [{ name: "Coffee", value: "90071992547409.90", quantity: 2, date: "2026-10-06" }, /Expense total is too big/] //checks that the combined total is too big
  ])("rejects invalid expense input", (input, message) => {
    expect(() => validateExpense(input)).toThrow(message);
  });   //tests that the validateExpense function throws an error for invalid input
});