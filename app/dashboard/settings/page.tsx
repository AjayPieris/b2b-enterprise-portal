"use client";

import { useAuthContext } from "@asgardeo/auth-react";
import { useState } from "react";
import AuthGuard from "../../components/AuthGuard";

function SettingsContent() {
  const { state } = useAuthContext();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Organization Settings</h1>
          <p className="text-purple-300/50 text-sm mt-1">
            Configure your organization — Admin access only
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
          🔒 Admin Only
        </span>
      </div>

      {/* Identity Provider section */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-1">Identity Provider</h2>
        <p className="text-purple-300/40 text-xs mb-6">Your authentication is managed by WSO2 Asgardeo</p>

        <div className="space-y-4">
          <SettingsRow label="Provider" value="WSO2 Asgardeo" />
          <SettingsRow label="Tenant" value={process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL || "—"} />
          <SettingsRow label="Client ID" value={process.env.NEXT_PUBLIC_ASGARDEO_CLIENT_ID || "—"} masked />
          <SettingsRow label="Protocol" value="OpenID Connect (OIDC)" />
          <SettingsRow label="Grant Type" value="Authorization Code + PKCE" />
        </div>
      </div>

      {/* Security settings */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-1">Security Configuration</h2>
        <p className="text-purple-300/40 text-xs mb-6">Authentication and access control settings</p>

        <div className="space-y-5">
          <ToggleSetting
            label="Enforce Multi-Factor Authentication"
            description="Require all users to set up MFA via Asgardeo"
            defaultOn={true}
          />
          <ToggleSetting
            label="Role-Based Access Control"
            description="Restrict pages based on Asgardeo groups claim"
            defaultOn={true}
          />
          <ToggleSetting
            label="Session Timeout"
            description="Auto sign-out after 30 minutes of inactivity"
            defaultOn={false}
          />
          <ToggleSetting
            label="API Token Validation"
            description="Validate Bearer tokens on all API routes"
            defaultOn={true}
          />
        </div>
      </div>

      {/* Scopes section */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-1">Requested OIDC Scopes</h2>
        <p className="text-purple-300/40 text-xs mb-6">Scopes requested during the Asgardeo login flow</p>

        <div className="flex flex-wrap gap-2">
          {["openid", "profile", "groups", "roles"].map((scope) => (
            <span
              key={scope}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-purple-500/15 text-purple-300 border border-purple-500/20"
            >
              {scope}
            </span>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
          saved
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/20"
        }`}
      >
        {saved ? "✓ Settings Saved" : "Save Changes"}
      </button>
    </div>
  );
}

// Displays a label-value row
function SettingsRow({ label, value, masked }: { label: string; value: string; masked?: boolean }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5">
      <span className="text-sm text-purple-300/60">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-white font-medium font-mono">
          {masked && !revealed ? "••••••••••••••" : value}
        </span>
        {masked && (
          <button
            onClick={() => setRevealed(!revealed)}
            className="text-purple-400/50 hover:text-purple-400 text-xs transition-colors"
          >
            {revealed ? "Hide" : "Show"}
          </button>
        )}
      </div>
    </div>
  );
}

// Toggle switch component
function ToggleSetting({ label, description, defaultOn }: { label: string; description: string; defaultOn: boolean }) {
  const [enabled, setEnabled] = useState(defaultOn);

  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5">
      <div>
        <p className="text-sm text-white font-medium">{label}</p>
        <p className="text-xs text-purple-300/40 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
          enabled ? "bg-purple-500" : "bg-white/10"
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AuthGuard requireAdmin={true}>
      <SettingsContent />
    </AuthGuard>
  );
}
