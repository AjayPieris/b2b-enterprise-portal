"use client";

import { useState } from "react";
import AuthGuard from "../../components/AuthGuard";

function SettingsContent() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>Organization Settings</h1>
          <p className="text-sm mt-1" style={{ color: '#9e9e9e' }}>
            Configure your organization — Admin access only
          </p>
        </div>
        <span
          className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider"
          style={{
            background: 'rgba(212,168,67,0.1)',
            color: '#b8922e',
            border: '1px solid rgba(212,168,67,0.2)',
          }}
        >
          🔒 Admin Only
        </span>
      </div>

      {/* Identity Provider section */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: '#ffffff',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <h2 className="text-lg font-semibold mb-1" style={{ color: '#1a1a1a' }}>Identity Provider</h2>
        <p className="text-xs mb-6" style={{ color: '#9e9e9e' }}>Your authentication is managed by WSO2 Asgardeo</p>

        <div className="space-y-4">
          <SettingsRow label="Provider" value="WSO2 Asgardeo" />
          <SettingsRow label="Tenant" value={process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL || "—"} />
          <SettingsRow label="Client ID" value={process.env.NEXT_PUBLIC_ASGARDEO_CLIENT_ID || "—"} masked />
          <SettingsRow label="Protocol" value="OpenID Connect (OIDC)" />
          <SettingsRow label="Grant Type" value="Authorization Code + PKCE" />
        </div>
      </div>

      {/* Security settings */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: '#ffffff',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <h2 className="text-lg font-semibold mb-1" style={{ color: '#1a1a1a' }}>Security Configuration</h2>
        <p className="text-xs mb-6" style={{ color: '#9e9e9e' }}>Authentication and access control settings</p>

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
      <div
        className="rounded-2xl p-6"
        style={{
          background: '#ffffff',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <h2 className="text-lg font-semibold mb-1" style={{ color: '#1a1a1a' }}>Requested OIDC Scopes</h2>
        <p className="text-xs mb-6" style={{ color: '#9e9e9e' }}>Scopes requested during the Asgardeo login flow</p>

        <div className="flex flex-wrap gap-2">
          {["openid", "profile", "groups", "roles"].map((scope) => (
            <span
              key={scope}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium"
              style={{
                background: 'rgba(212,168,67,0.08)',
                color: '#b8922e',
                border: '1px solid rgba(212,168,67,0.15)',
              }}
            >
              {scope}
            </span>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300"
        style={{
          background: saved
            ? 'rgba(34,197,94,0.08)'
            : 'linear-gradient(135deg, #d4a843, #b8922e)',
          color: saved ? '#16a34a' : '#ffffff',
          border: saved ? '1px solid rgba(34,197,94,0.2)' : 'none',
          boxShadow: saved ? 'none' : '0 4px 16px rgba(212, 168, 67, 0.3)',
        }}
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
    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
      <span className="text-sm" style={{ color: '#6b6b6b' }}>{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium font-mono" style={{ color: '#1a1a1a' }}>
          {masked && !revealed ? "••••••••••••••" : value}
        </span>
        {masked && (
          <button
            onClick={() => setRevealed(!revealed)}
            className="text-xs transition-colors"
            style={{ color: '#b8922e' }}
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
    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
      <div>
        <p className="text-sm font-medium" style={{ color: '#1a1a1a' }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: '#9e9e9e' }}>{description}</p>
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className={`toggle-warm ${enabled ? 'active' : 'inactive'}`}
      >
        <div className="toggle-knob" />
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
