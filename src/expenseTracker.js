export function validateExpense(input) {
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const valueText = String(input?.value ?? "");
  const value = Number(valueText);
  const quantity = Number(input?.quantity);
  const date = typeof input?.date === "string" ? input.date : "";

  if (!name || name.length > 100) {
    throw new TypeError("Name must contain between 1 and 100 characters.");
  }
  if (!/^\d+(?:\.\d{1,2})?$/.test(valueText) || !Number.isFinite(value) || value <= 0 || value * 100 > Number.MAX_SAFE_INTEGER) {
    throw new TypeError("Value must be a positive amount in euros.");
  }
  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    throw new TypeError("Amount must be a positive whole number.");
  }
  const parsedDate = new Date(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    throw new TypeError("Enter a valid expense date.");
  }

  const valueCents = Math.round(value * 100);
  if (!Number.isSafeInteger(valueCents * quantity)) {
    throw new TypeError("Value multiplied by amount is too large.");
  }

  return {
    name,
    valueCents,
    quantity,
    date
  };
}

export function getExpenseTotalCents(expense) {
  return expense.valueCents * expense.quantity;
}

export function getTotalCents(expenses) {
  return expenses.reduce((sum, expense) => sum + getExpenseTotalCents(expense), 0);
}

export function getTotal(expenses) {
  return getTotalCents(expenses) / 100;
}