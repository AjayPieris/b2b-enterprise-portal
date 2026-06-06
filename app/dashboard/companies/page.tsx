"use client";

import { useAuthContext } from "@asgardeo/auth-react";
import { useEffect, useState } from "react";
import AuthGuard from "../../components/AuthGuard";
import { mockCompanies, type MockCompany } from "../../lib/mockData";

function CompaniesContent() {
  const { getAccessToken } = useAuthContext();
  const [companies, setCompanies] = useState<MockCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string | null>(null);
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', domain: '', industry: 'Technology', plan: 'Startup' });

  useEffect(() => {
    async function fetchCompanies() {
      try {
        const token = await getAccessToken();
        const res = await fetch("/api/companies", { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const result = await res.json();
          if (result.data && result.data.length > 0) {
            setCompanies(result.data);
          } else {
            setCompanies(mockCompanies);
          }
        } else {
          setCompanies(mockCompanies);
        }
      } catch {
        setCompanies(mockCompanies);
      } finally {
        setLoading(false);
      }
    }
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

  const filteredCompanies = companies.filter(c => {
    const matchesSearch = !searchQuery || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.industry.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = !planFilter || c.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  const planColors: Record<string, { bg: string; color: string; border: string }> = {
    Enterprise: { bg: "rgba(212,168,67,0.1)", color: "#b8922e", border: "rgba(212,168,67,0.2)" },
    Business: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "rgba(59,130,246,0.2)" },
    Startup: { bg: "rgba(34,197,94,0.1)", color: "#16a34a", border: "rgba(34,197,94,0.2)" },
  };

  const statusColors: Record<string, { bg: string; color: string; dot: string }> = {
    Active: { bg: "rgba(22,163,106,0.08)", color: "#16a34a", dot: "#16a34a" },
    Trial: { bg: "rgba(212,168,67,0.08)", color: "#b8922e", dot: "#d4a843" },
    Suspended: { bg: "rgba(220,38,38,0.08)", color: "#dc2626", dot: "#dc2626" },
  };

  const totalUsers = companies.reduce((sum, c) => sum + (c.userCount || 0), 0);
  const totalRevenue = companies.reduce((sum, c) => sum + (c.monthlyRevenue || 0), 0);
  const avgCompliance = Math.round(companies.reduce((sum, c) => sum + (c.complianceScore || 0), 0) / companies.length);

  return (
    <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>Company Management</h1>
          <p className="text-sm mt-1" style={{ color: "#9e9e9e" }}>
            Manage multi-tenant organizations and subscription plans
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-200 hover:shadow-lg" 
          style={{ background: "linear-gradient(135deg, #d4a843, #b8922e)", color: "#fff", boxShadow: "0 4px 12px rgba(212,168,67,0.2)" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Create Company
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Organizations", value: companies.length.toString(), color: "#b8922e" },
          { label: "Total Users", value: totalUsers.toLocaleString(), color: "#3b82f6" },
          { label: "Monthly Revenue", value: `$${(totalRevenue / 1000).toFixed(1)}K`, color: "#16a34a" },
          { label: "Avg Compliance", value: `${avgCompliance}%`, color: avgCompliance >= 90 ? "#16a34a" : "#d4a843" },
        ].map((card, i) => (
          <div
            key={i}
            className="rounded-xl p-5"
            style={{
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#9e9e9e" }}>{card.label}</p>
            <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters + View Toggle */}
      <div
        className="rounded-xl p-4"
        style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[220px] relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9e9e9e" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg text-sm border focus:ring-2 focus:ring-[#d4a843] focus:border-transparent outline-none transition-all"
              style={{ borderColor: "rgba(0,0,0,0.08)" }}
            />
          </div>

          <div className="flex gap-2">
            <FilterChip label="All" active={planFilter === null} onClick={() => setPlanFilter(null)} />
            <FilterChip label="Enterprise" active={planFilter === "Enterprise"} onClick={() => setPlanFilter(planFilter === "Enterprise" ? null : "Enterprise")} />
            <FilterChip label="Business" active={planFilter === "Business"} onClick={() => setPlanFilter(planFilter === "Business" ? null : "Business")} />
            <FilterChip label="Startup" active={planFilter === "Startup"} onClick={() => setPlanFilter(planFilter === "Startup" ? null : "Startup")} />
          </div>

          <div className="w-px h-6" style={{ background: "rgba(0,0,0,0.08)" }} />

          <div className="flex gap-1 p-1 rounded-lg" style={{ background: "rgba(0,0,0,0.03)" }}>
            <button onClick={() => setViewMode("grid")} className="p-1.5 rounded-md transition-all" style={{ background: viewMode === "grid" ? "#fff" : "transparent", boxShadow: viewMode === "grid" ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
              <svg className="w-4 h-4" style={{ color: viewMode === "grid" ? "#1a1a1a" : "#9e9e9e" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button onClick={() => setViewMode("table")} className="p-1.5 rounded-md transition-all" style={{ background: viewMode === "table" ? "#fff" : "transparent", boxShadow: viewMode === "table" ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
              <svg className="w-4 h-4" style={{ color: viewMode === "table" ? "#1a1a1a" : "#9e9e9e" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
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
                    <option>Technology</option><option>Finance</option><option>Healthcare</option><option>Manufacturing</option><option>Retail</option><option>Energy</option><option>Security</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Subscription Plan</label>
                  <select value={formData.plan} onChange={e => setFormData({...formData, plan: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#d4a843] focus:border-transparent outline-none transition-all bg-white">
                    <option>Startup</option><option>Business</option><option>Enterprise</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
                <button disabled={isAdding} type="submit" className="flex-1 px-4 py-2 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50" style={{ background: "linear-gradient(135deg, #d4a843, #b8922e)" }}>
                  {isAdding ? "Provisioning..." : "Create Organization"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((c) => {
            const plan = planColors[c.plan] || planColors.Startup;
            const status = statusColors[c.status] || statusColors.Active;
            const usagePercent = Math.round((c.userCount / c.userLimit) * 100);
            const usageColor = usagePercent > 80 ? "#dc2626" : usagePercent > 60 ? "#d4a843" : "#16a34a";

            return (
              <div key={c.id} className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold" style={{ background: "linear-gradient(135deg, #d4a843, #b8922e)", boxShadow: "0 4px 12px rgba(212,168,67,0.25)" }}>{c.logo}</div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900">{c.name}</h3>
                        <p className="text-xs text-gray-400">{c.domain}</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium" style={{ background: status.bg, color: status.color }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.dot }} />
                      {c.status}
                    </span>
                  </div>

                  {/* User capacity bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">User Capacity</span>
                      <span className="text-xs font-semibold" style={{ color: usageColor }}>{usagePercent}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.04)" }}>
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${usagePercent}%`, background: usageColor }} />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-gray-400">{c.userCount} users</span>
                      <span className="text-[10px] text-gray-400">{c.userLimit} limit</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="rounded-lg p-2.5 text-center" style={{ background: "rgba(0,0,0,0.02)" }}>
                      <p className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">Industry</p>
                      <p className="text-xs font-semibold text-gray-700 mt-0.5">{c.industry}</p>
                    </div>
                    <div className="rounded-lg p-2.5 text-center" style={{ background: "rgba(0,0,0,0.02)" }}>
                      <p className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">Region</p>
                      <p className="text-xs font-semibold text-gray-700 mt-0.5">{c.region}</p>
                    </div>
                    <div className="rounded-lg p-2.5 text-center" style={{ background: "rgba(0,0,0,0.02)" }}>
                      <p className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">Score</p>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: (c.complianceScore || 0) >= 95 ? "#16a34a" : "#d4a843" }}>{c.complianceScore}%</p>
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
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "rgba(0,0,0,0.01)" }}>
                <th className="text-left px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Organization</th>
                <th className="text-left px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Industry</th>
                <th className="text-left px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Plan</th>
                <th className="text-left px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Users</th>
                <th className="text-left px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Revenue</th>
                <th className="text-left px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Status</th>
                <th className="text-left px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-gray-400">SSO</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((c) => {
                const plan = planColors[c.plan] || planColors.Startup;
                const status = statusColors[c.status] || statusColors.Active;
                return (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: "linear-gradient(135deg, #d4a843, #b8922e)" }}>{c.logo}</div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                          <p className="text-[11px] text-gray-400">{c.domain}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.industry}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium" style={{ background: plan.bg, color: plan.color, border: `1px solid ${plan.border}` }}>{c.plan}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.userCount}<span className="text-gray-400 text-xs font-normal">/{c.userLimit}</span></td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">${(c.monthlyRevenue / 1000).toFixed(1)}K</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium w-fit" style={{ background: status.bg, color: status.color }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.dot }} />
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">{c.ssoProvider}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
      style={{
        background: active ? "rgba(212,168,67,0.1)" : "rgba(0,0,0,0.03)",
        color: active ? "#b8922e" : "#6b6b6b",
        border: active ? "1px solid rgba(212,168,67,0.2)" : "1px solid rgba(0,0,0,0.06)",
      }}
    >
      {label}
    </button>
  );
}

export default function CompaniesPage() {
  return (
    <AuthGuard requireAdmin={true}>
      <CompaniesContent />
    </AuthGuard>
  );
}
