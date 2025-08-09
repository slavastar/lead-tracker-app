import React, { useEffect, useState } from "react";
import { LeadForm } from "./LeadForm";
import { LeadList } from "./LeadList";
import { SignOutButton } from "./SignOutButton";
import { useNavigate } from "react-router-dom";

interface Lead {
  id: string;
  name: string;
  email: string;
  company?: string;
  userId: string;
  createdAt: string;
}

interface Props {
  user: {
    id: string;
    email: string;
    [key: string]: any;
  };
}

export const LeadsPage: React.FC<Props> = ({ user }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeads();
    fetchCredits();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      const userLeads = data.filter((lead: Lead) => lead.userId === user.id);
      setLeads(userLeads);
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCredits = async () => {
    try {
      const res = await fetch(`/api/leads/users/${user.id}/credits`);
      if (!res.ok) throw new Error("Failed to fetch credits");
      const data = await res.json();
      setCredits(data.credits);
    } catch (err) {
      console.error("Failed to fetch user credits:", err);
      setCredits(null);
    }
  };

  const handleAddLead = async ({
    name,
    email,
    company,
  }: {
    name: string;
    email: string;
    company?: string;
  }) => {
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company, userId: user.id }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to add lead");
      }
      const newLead = await res.json();
      setLeads((prev) => [newLead, ...prev]);
    } catch (error) {
      console.error("Failed to add lead:", error);
      alert("Failed to add lead");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete lead");
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete");
    }
  };

  const handleBuyCredits = async () => {
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else throw new Error("Checkout session not created");
    } catch (err) {
      console.error("Stripe checkout failed:", err);
      alert("Payment failed. Please try again.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-4 items-center">
          <span className="text-sm text-gray-700 bg-gray-100 rounded px-3 py-1">
            Credits: <strong>{credits !== null ? credits : "Loading..."}</strong>
          </span>
          <button
            onClick={handleBuyCredits}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            Buy 10 Credits (€0.50)
          </button>
        </div>

        <div className="flex items-center space-x-2">
        <button
          onClick={() => navigate(`/dashboard?userId=${user.id}`)}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          View Dashboard
        </button>
          <SignOutButton />
        </div>
      </div>

      <LeadForm onAdd={handleAddLead} />

      {loading ? (
        <p className="text-center mt-6">Loading leads...</p>
      ) : (
        <LeadList leads={leads} onDelete={handleDelete} />
      )}
    </div>
  );
};