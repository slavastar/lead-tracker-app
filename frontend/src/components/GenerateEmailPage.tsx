import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { TokenCreditInfo } from "../components/TokenCreditInfo";
import { supabase } from "../supabaseClient";

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
}

export const GenerateEmailPage: React.FC = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("english");
  const [formality, setFormality] = useState("formal");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [creditsLeft, setCreditsLeft] = useState(0);
  const [tokenValid, setTokenValid] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user?.id) {
        console.error("Failed to fetch user", error);
        setError("User not authenticated");
      } else {
        setUserId(data.user.id);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!userId || !leadId) return;

    const fetchLead = async () => {
      try {
        const res = await fetch("/api/leads");
        const data = await res.json();
        const found = data.find((l: Lead) => l.id === leadId);
        setLead(found);
      } catch (err) {
        console.error("Failed to fetch lead:", err);
      }
    };

    const fetchCredits = async () => {
      try {
        const res = await fetch(`/api/users/${userId}/credits`);
        const data = await res.json();
        setCreditsLeft(data.credits);
      } catch (err) {
        console.error("Failed to fetch user credits:", err);
      }
    };

    fetchLead();
    fetchCredits();
  }, [userId, leadId]);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setSubject("");
    setBody("");

    if (!userId) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }
    if (!lead) {
      setError("Lead data is missing");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/leads/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          language,
          formality,
          userId,
          lead,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate email");
      }

      const data = await res.json();

      if (data.subject && data.body) {
        setSubject(data.subject);
        setBody(data.body);
      } else if (data.email) {
        setSubject("Generated Email");
        setBody(data.email);
      }

      if (typeof data.creditsLeft === "number") {
        setCreditsLeft(data.creditsLeft);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return <p className="text-center mt-8">Loading user...</p>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Generate Cold Email</h1>

      {lead ? (
        <div className="mb-6 p-4 border rounded bg-gray-100">
          <p><strong>Name:</strong> {lead.name}</p>
          <p><strong>Email:</strong> {lead.email}</p>
          <p><strong>Company:</strong> {lead.company || "-"}</p>
        </div>
      ) : (
        <p>Loading lead data...</p>
      )}

      <div className="mb-4">
        <label className="block font-semibold">Prompt:</label>
        <textarea
          className="w-full p-2 border rounded mt-1"
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="What should the email say?"
        />
      </div>

      <TokenCreditInfo
        prompt={prompt}
        creditsLeft={creditsLeft}
        onTokenStatusChange={(valid) => setTokenValid(valid)}
      />

      <div className="mb-4">
        <label className="block font-semibold">Language:</label>
        <select
          className="w-full p-2 border rounded mt-1"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="english">English</option>
          <option value="spanish">Spanish</option>
          <option value="german">German</option>
          <option value="french">French</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block font-semibold">Formality:</label>
        <select
          className="w-full p-2 border rounded mt-1"
          value={formality}
          onChange={(e) => setFormality(e.target.value)}
        >
          <option value="formal">Formal</option>
          <option value="informal">Informal</option>
        </select>
      </div>

      <button
        onClick={handleGenerate}
        className={`px-4 py-2 rounded text-white ${
          loading || !tokenValid || creditsLeft <= 0
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
        disabled={loading || !tokenValid || creditsLeft <= 0}
      >
        {loading ? "Generating..." : "Generate Email"}
      </button>

      {error && <p className="mt-4 text-red-600">{error}</p>}

      {(subject || body) && (
        <div className="mt-6 p-4 border rounded bg-green-50 whitespace-pre-line">
          <h2 className="text-lg font-semibold mb-2">Generated Email</h2>
          {subject && (
            <p className="mb-2">
              <strong>Subject:</strong> {subject}
            </p>
          )}
          {body && <pre className="whitespace-pre-wrap">{body}</pre>}
        </div>
      )}
    </div>
  );
};