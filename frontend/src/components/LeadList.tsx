import React from "react";
import { Lead } from "../types";
import { useNavigate } from "react-router-dom";

interface Props {
  leads: Lead[];
  onDelete: (id: string) => void;
}

export const LeadList: React.FC<Props> = ({ leads, onDelete }) => {

  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Leads</h2>
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-100 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Company</th>
              <th className="px-6 py-3">Actions</th>
              <th className="px-6 py-3">Message</th>              
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, index) => (
              <tr
                key={lead.id}
                className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="px-6 py-4">{lead.name}</td>
                <td className="px-6 py-4">{lead.email}</td>
                <td className="px-6 py-4">{lead.company || "-"}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onDelete(lead.id)}
                    className="text-red-600 hover:text-red-800 font-semibold"
                  >
                    Delete
                  </button>
                </td>
                <td>
                  <button
                    onClick={() => navigate(`/generate-email/${lead.id}`)}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Generate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};