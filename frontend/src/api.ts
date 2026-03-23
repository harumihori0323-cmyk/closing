const API_BASE = import.meta.env.DEV ? "http://localhost:3001/api" : "/api";

export async function fetchCustomers() {
  const res = await fetch(`${API_BASE}/customers`);
  return res.json();
}

export async function createCustomer(data: Record<string, string>) {
  const res = await fetch(`${API_BASE}/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateCustomer(id: string, data: Record<string, string>) {
  const res = await fetch(`${API_BASE}/customers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteCustomer(id: string) {
  const res = await fetch(`${API_BASE}/customers/${id}`, { method: "DELETE" });
  return res.json();
}

export async function getClosingAdvice(customer: Record<string, string>) {
  const res = await fetch(`${API_BASE}/ai/prepare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customer }),
  });
  return res.json();
}

export async function getRealtimeResponse(
  customer: Record<string, string>,
  transcript: string,
  latestUtterance: string
) {
  const res = await fetch(`${API_BASE}/ai/respond`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customer, transcript, latestUtterance }),
  });
  return res.json();
}
