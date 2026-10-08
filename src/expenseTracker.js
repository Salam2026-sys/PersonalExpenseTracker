export function validateExpense(input) { //receives expense data, checks that it is valid, and returns it in a consistent format.
  const name = typeof input?.name === "string" ? input.name.trim() : ""; //defines the name variable as a string, trims whitespace, or sets it to an empty string if not provided.
  const valueText = String(input?.value ?? "");    //defines the valueText variable as a string representation of the value, or an empty string if not provided.
  const value = Number(valueText);  //Converts the valueText to a number so the code can check and calculate with it.
  const quantity = Number(input?.quantity); //defines the quantity variable as a number representation of the quantity.
  const date = typeof input?.date === "string" ? input.date : "";   //defines the date variable as a string representation of the date, or an empty string if not provided.
  if (!name) {
    throw new TypeError("Enter a name.");
  } //checks that a name was entered.
  if (name.length > 100) {
    throw new TypeError("Name must be 100 characters or fewer.");
  } //checks that the name is within the 100-character limit.
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(valueText)) {
    throw new TypeError("Enter a valid value with up to 2 decimal places.");
  } //checks that the value has a valid number format.
  if (value <= 0) {
    throw new TypeError("Value must be greater than 0.");
  } //checks that the value is positive.
  if (!Number.isFinite(value) || value * 100 > Number.MAX_SAFE_INTEGER) {
    throw new TypeError("Value is too big.");
  } //checks that the value can be safely stored in cents.
  if (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity <= 0) {
    throw new TypeError("Amount must be a positive whole number.");
  } //checks that the amount is a positive whole number.
  if (!Number.isSafeInteger(quantity)) {
    throw new TypeError("Amount is too big.");
  } //checks that the amount is within JavaScript's safe integer limit.
  const parsedDate = new Date(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    throw new TypeError("Enter a valid date.");
  } //checks that the date format and calendar date are valid.
  const valueCents = Math.round(value * 100); //converts euros to whole cents.
  if (!Number.isSafeInteger(valueCents * quantity)) {
    throw new TypeError("Expense total is too big.");
  } //checks that the expense total is safe to calculate.

  return {
    name,
    valueCents,
    quantity,
    date
  };
}   //checks and cleans the input

export function getExpenseTotalCents(expense) {
  return expense.valueCents * expense.quantity;
}   //calculates one expense

export function getTotalCents(expenses) {
  return expenses.reduce((sum, expense) => sum + getExpenseTotalCents(expense), 0);
}   //adds all expenses

export function getTotal(expenses) {
  return getTotalCents(expenses) / 100;
}   //converts that total back to euros