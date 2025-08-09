import { Lead } from "./types";

const API_BASE = "http://localhost:4000/api/leads";

export async function fetchLeads(): Promise<Lead[]> {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error("Failed to fetch leads");
  return res.json();
}

export async function createLead(lead: Omit<Lead, "id" | "createdAt">): Promise<Lead> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead),
  });
  if (!res.ok) throw new Error("Failed to create lead");
  return res.json();
}