"use client";

import { useAuthContext } from "@asgardeo/auth-react";
import { useEffect, useState } from "react";
import AuthGuard from "../../components/AuthGuard";

interface Company {
  id: string;
  name: string;
  industry: string;
  plan: string;
  userLimit: number;
  status: string;
  createdAt: string;
  domain: string;
  logo: string;
  userCount: number;
}

function CompaniesContent() {
  const { getAccessToken } = useAuthContext();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', domain: '', industry: 'Technology', plan: 'Startup' });

  const fetchCompanies = async () => {
    try {
      const token = await getAccessToken();
      const res = await fetch("/api/companies", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const result = await res.json();
        setCompanies(result.data);
      }
    } catch (e) {
      console.error("Failed to fetch companies:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [getAccessToken]);

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setShowAddModal(false);
        setFormData({ name: '', domain: '', industry: 'Technology', plan: 'Startup' });
        fetchCompanies();
      } else {
        const errData = await response.json().catch(() => null);
        alert(`Failed to add company: ${errData?.error || response.status}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: "rgba(212,168,67,0.2)", borderTopColor: "#d4a843" }} />
      </div>
    );
  }

  const planColors: Record<string, { bg: string; color: string; border: string }> = {
    Enterprise: { bg: "rgba(212,168,67,0.1)", color: "#b8922e", border: "rgba(212,168,67,0.2)" },
    Business: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "rgba(59,130,246,0.2)" },
    Startup: { bg: "rgba(34,197,94,0.1)", color: "#16a34a", border: "rgba(34,197,94,0.2)" },
  };

  return (
    <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>Company Management</h1>
          <p className="text-sm mt-1" style={{ color: "#9e9e9e" }}>
            Manage multi-tenant organizations and subscription plans
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2" 
          style={{ background: "linear-gradient(135deg, #d4a843, #b8922e)", color: "#fff", boxShadow: "0 4px 12px rgba(212,168,67,0.2)" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Create Company
        </button>
      </div>

      {/* Add Company Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-[fadeInUp_0.3s_ease-out]">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Create New Company</h3>
                <p className="text-xs text-gray-500 mt-0.5">This will provision a new B2B Organization in Asgardeo.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddCompany} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Company Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#d4a843] focus:border-transparent outline-none transition-all" placeholder="e.g. Stark Industries" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Primary Domain</label>
                <input required value={formData.domain} onChange={e => setFormData({...formData, domain: e.target.value})} type="text" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#d4a843] focus:border-transparent outline-none transition-all" placeholder="e.g. stark.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Industry</label>
                  <select value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#d4a843] focus:border-transparent outline-none transition-all bg-white">
                    <option>Technology</option>
                    <option>Finance</option>
                    <option>Healthcare</option>
                    <option>Manufacturing</option>
                    <option>Retail</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Subscription Plan</label>
                  <select value={formData.plan} onChange={e => setFormData({...formData, plan: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#d4a843] focus:border-transparent outline-none transition-all bg-white">
                    <option>Startup</option>
                    <option>Business</option>
                    <option>Enterprise</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button disabled={isAdding} type="submit" className="flex-1 px-4 py-2 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50" style={{ background: "linear-gradient(135deg, #d4a843, #b8922e)" }}>
                  {isAdding ? "Provisioning..." : "Create Organization"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Company cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {companies.map((c) => {
          const plan = planColors[c.plan] || planColors.Startup;
          return (
            <div key={c.id} className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold" style={{ background: "linear-gradient(135deg, #d4a843, #b8922e)", boxShadow: "0 4px 12px rgba(212,168,67,0.25)" }}>{c.logo}</div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{c.name}</h3>
                      <p className="text-xs text-gray-400">{c.domain}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium" style={{ background: "rgba(22,163,106,0.1)", color: "#16a34a" }}>{c.status}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-lg p-3" style={{ background: "rgba(0,0,0,0.02)" }}>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Users</p>
                    <p className="text-lg font-bold text-gray-900">{c.userCount}<span className="text-xs text-gray-400 font-normal">/{c.userLimit}</span></p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: "rgba(0,0,0,0.02)" }}>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Industry</p>
                    <p className="text-sm font-semibold text-gray-700">{c.industry}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-medium" style={{ background: plan.bg, color: plan.color, border: `1px solid ${plan.border}` }}>{c.plan}</span>
                  <span className="text-xs text-gray-400">Since {c.createdAt}</span>
                </div>
              </div>

              <div className="px-6 py-3 border-t border-gray-100 flex gap-3">
                <button className="flex-1 text-xs font-semibold text-gray-600 hover:text-gray-900 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">Edit</button>
                <button className="flex-1 text-xs font-semibold text-gray-600 hover:text-gray-900 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">Users</button>
                <button className="flex-1 text-xs font-semibold text-red-500 hover:text-red-700 py-1.5 rounded-lg hover:bg-red-50 transition-colors">Suspend</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CompaniesPage() {
  return (
    <AuthGuard requireAdmin={true}>
      <CompaniesContent />
    </AuthGuard>
  );
}
