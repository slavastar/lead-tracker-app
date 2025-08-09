import React, { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useNavigate, useSearchParams } from "react-router-dom";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type Period = "minute" | "hour" | "day";

type ApiResponse = {
  period: Period;
  limit: number;
  series: { bucketStart: string; credits: number }[];
};

const formatLabel = (iso: string, period: Period) => {
  const d = new Date(iso);
  if (period === "minute") return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (period === "hour") return d.toLocaleTimeString([], { hour: "2-digit" });
  return d.toLocaleDateString();
};

const hasAnyData = (series: ApiResponse["series"]) =>
  series.some((b) => b.credits > 0);

const DEFAULT_PERIOD: Period = "minute";
const DEFAULT_LIMIT = 14;

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [search] = useSearchParams();

  const userId = search.get("userId") || "";
  const [period, setPeriod] = useState<Period>(
    (search.get("period") as Period) || DEFAULT_PERIOD
  );
  const [limit, setLimit] = useState<number>(
    Number(search.get("limit")) || DEFAULT_LIMIT
  );

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");
  const [data, setData] = useState<ApiResponse | null>(null);

  useEffect(() => {
    if (!userId) {
      setErr("Missing userId. Navigate here as /dashboard?userId=YOUR_ID");
      return;
    }

    let aborted = false;
    const load = async () => {
      setLoading(true);
      setErr("");
      try {
        const q = new URLSearchParams({
          userId,
          period,
          limit: String(limit),
        }).toString();

        const res = await fetch(`/api/analytics/credits?${q}`);
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || `Request failed: ${res.status}`);
        }
        const json: ApiResponse = await res.json();
        if (!aborted) setData(json);
      } catch (e: any) {
        if (!aborted) setErr(e?.message || "Failed to load analytics");
      } finally {
        if (!aborted) setLoading(false);
      }
    };

    load();
    return () => {
      aborted = true;
    };
  }, [userId, period, limit]);

  const chart = useMemo(() => {
    const series = data?.series || [];
    const labels = series.map((b) => formatLabel(b.bucketStart, data?.period || period));
    const values = series.map((b) => b.credits);

    return {
      data: {
        labels,
        datasets: [
          {
            label: "Credits Purchased",
            data: values,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "top" as const },
          tooltip: { enabled: true },
        },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } },
        },
      },
      empty: series.length === 0 || !hasAnyData(series),
    };
  }, [data, period]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Credits Dashboard</h1>
        <button
          onClick={() => navigate("/")}
          className="bg-gray-200 px-3 py-2 rounded hover:bg-gray-300"
        >
          ← Back to Leads
        </button>
      </div>

      <div className="flex gap-3 items-center mb-4">
        <label className="text-sm">
          Period:{" "}
          <select
            className="border rounded px-2 py-1"
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
          >
            <option value="minute">Minute</option>
            <option value="hour">Hour</option>
            <option value="day">Day</option>
          </select>
        </label>
        <label className="text-sm">
          Buckets:{" "}
          <input
            type="number"
            min={1}
            max={200}
            className="border rounded px-2 py-1 w-20"
            value={limit}
            onChange={(e) => setLimit(Math.max(1, Math.min(200, Number(e.target.value) || DEFAULT_LIMIT)))}
          />
        </label>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        {err && <p className="text-red-600 mb-2">{err}</p>}
        {loading && <p>Loading…</p>}
        {!loading && !err && chart.empty && (
          <div className="text-center text-gray-500 py-10">
            No purchases in the selected period.
          </div>
        )}
        {!loading && !err && !chart.empty && (
          <Bar data={chart.data} options={chart.options as any} />
        )}
      </div>
    </div>
  );
};