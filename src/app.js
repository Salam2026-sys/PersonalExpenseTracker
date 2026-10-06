const form = document.querySelector("#expense-form");
const list = document.querySelector("#expense-list");
const totalOutput = document.querySelector("#total-value");
const countOutput = document.querySelector("#expense-count");
const emptyState = document.querySelector("#empty-state");
const formMessage = document.querySelector("#form-message");
const listMessage = document.querySelector("#list-message");
const submitButton = document.querySelector("#submit-button");
const dateInput = document.querySelector("#date");

const euro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });
const shortDate = new Intl.DateTimeFormat("en-IE", { day: "2-digit", month: "2-digit", year: "numeric" });

function todayAsInputValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function formatDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return shortDate.format(new Date(year, month - 1, day));
}

function addCell(row, label, value, className = "") {
  const cell = document.createElement("td");
  cell.dataset.label = label;
  if (className) cell.className = className;
  cell.textContent = value;
  row.append(cell);
}

function renderExpenses(expenses, totalCents) {
  const sortedExpenses = [...expenses].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  list.replaceChildren();
  totalOutput.textContent = euro.format(totalCents / 100);
  countOutput.textContent = sortedExpenses.length;
  emptyState.hidden = sortedExpenses.length > 0;

  for (const expense of sortedExpenses) {
    const row = document.createElement("tr");
    addCell(row, "Date", formatDate(expense.date));
    addCell(row, "Expense", expense.name);
    addCell(row, "Value", euro.format(expense.valueCents / 100));
    addCell(row, "Qty", String(expense.quantity));
    addCell(row, "Total", euro.format(expense.valueCents * expense.quantity / 100), "align-right");

    const actionCell = document.createElement("td");
    actionCell.dataset.label = "";
    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.setAttribute("aria-label", `Delete ${expense.name}`);
    deleteButton.title = "Delete expense";
    deleteButton.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16M9 7V4h6v3m3 0-.8 13H6.8L6 7m4 3v7m4-7v7" /></svg>`;
    deleteButton.addEventListener("click", () => deleteExpense(expense));
    actionCell.append(deleteButton);
    row.append(actionCell);
    list.append(row);
  }
}

async function request(path, options) {
  const response = await fetch(path, options);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "The request could not be completed.");
  return result;
}

async function loadExpenses() {
  listMessage.textContent = "";
  try {
    const result = await request("/api/expenses");
    renderExpenses(result.expenses, result.totalCents);
  } catch (error) {
    listMessage.textContent = `Could not load expenses. ${error.message}`;
  }
}

async function deleteExpense(expense) {
  if (!window.confirm(`Delete “${expense.name}”?`)) return;
  listMessage.textContent = "";
  try {
    const result = await request(`/api/expenses/${encodeURIComponent(expense.id)}`, { method: "DELETE" });
    renderExpenses(result.expenses, result.totalCents);
  } catch (error) {
    listMessage.textContent = `Could not delete this expense. ${error.message}`;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formMessage.textContent = "";

  if (!form.reportValidity()) return;

  submitButton.disabled = true;
  try {
    const formData = new FormData(form);
    const result = await request("/api/expenses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        value: formData.get("value"),
        quantity: Number(formData.get("quantity")),
        date: formData.get("date")
      })
    });
    renderExpenses(result.expenses, result.totalCents);
    form.reset();
    dateInput.value = todayAsInputValue();
    document.querySelector("#name").focus();
    formMessage.textContent = "Expense added.";
    formMessage.classList.add("success-message");
  } catch (error) {
    formMessage.classList.remove("success-message");
    formMessage.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});

document.querySelector("#today-label").textContent = new Intl.DateTimeFormat("en-IE", {
  weekday: "short", day: "2-digit", month: "short", year: "numeric"
}).format(new Date());
dateInput.value = todayAsInputValue();
loadExpenses();