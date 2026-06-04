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
          <h1 className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>Organization Settings</h1>
          <p className="text-sm mt-1" style={{ color: "#9e9e9e" }}>
            Configure directory settings and tenant access controls
          </p>
        </div>
        <span
          className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider"
          style={{
            background: "rgba(212,168,67,0.1)",
            color: "#b8922e",
            border: "1px solid rgba(212,168,67,0.2)",
          }}
        >
          🔒 Admin Control
        </span>
      </div>

      <div
        className="rounded-2xl p-6"
        style={{
          background: "#ffffff",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <h2 className="text-lg font-semibold mb-1" style={{ color: "#1a1a1a" }}>Identity Provider Connection</h2>
        <p className="text-xs mb-6" style={{ color: "#9e9e9e" }}>Active directory connection via WSO2 Asgardeo SSO tenant</p>

        <div className="space-y-4">
          <SettingsRow label="Connection Provider" value="WSO2 Asgardeo" />
          <SettingsRow label="Tenant Endpoint" value={process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL || "—"} />
          <SettingsRow label="OAuth Client ID" value={process.env.NEXT_PUBLIC_ASGARDEO_CLIENT_ID || "—"} masked />
          <SettingsRow label="Identity Protocol" value="OpenID Connect 1.0 (OIDC)" />
          <SettingsRow label="Authorization Flow" value="Auth Code with PKCE protection" />
        </div>
      </div>

      <div
        className="rounded-2xl p-6"
        style={{
          background: "#ffffff",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <h2 className="text-lg font-semibold mb-1" style={{ color: "#1a1a1a" }}>Access Security Policies</h2>
        <p className="text-xs mb-6" style={{ color: "#9e9e9e" }}>Control tenant access rules and session restrictions</p>

        <div className="space-y-5">
          <ToggleSetting
            label="Enforce Multi-Factor Authentication"
            description="Require MFA setups on user enrollment."
            defaultOn={true}
          />
          <ToggleSetting
            label="Role-Based Access Control"
            description="Restrict portal sections matching claims permissions."
            defaultOn={true}
          />
          <ToggleSetting
            label="Idle Session Timeout"
            description="Sign users out automatically on session inactivity."
            defaultOn={false}
          />
          <ToggleSetting
            label="API Signature Verification"
            description="Authenticate API gateway requests with cryptographic token checking."
            defaultOn={true}
          />
        </div>
      </div>

      <div
        className="rounded-2xl p-6"
        style={{
          background: "#ffffff",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <h2 className="text-lg font-semibold mb-1" style={{ color: "#1a1a1a" }}>Requested Scopes</h2>
        <p className="text-xs mb-6" style={{ color: "#9e9e9e" }}>Scopes mapped for JWT identity parsing</p>

        <div className="flex flex-wrap gap-2">
          {["openid", "profile", "groups", "roles"].map((scope) => (
            <span
              key={scope}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium"
              style={{
                background: "rgba(212,168,67,0.08)",
                color: "#b8922e",
                border: "1px solid rgba(212,168,67,0.15)",
              }}
            >
              {scope}
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300"
        style={{
          background: saved
            ? "rgba(34,197,94,0.08)"
            : "linear-gradient(135deg, #d4a843, #b8922e)",
          color: saved ? "#16a34a" : "#ffffff",
          border: saved ? "1px solid rgba(34,197,94,0.2)" : "none",
          boxShadow: saved ? "none" : "0 4px 16px rgba(212, 168, 67, 0.3)",
        }}
      >
        {saved ? "✓ Settings Saved" : "Save Changes"}
      </button>
    </div>
  );
}

function SettingsRow({ label, value, masked }: { label: string; value: string; masked?: boolean }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
      <span className="text-sm text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium font-mono text-gray-800">
          {masked && !revealed ? "••••••••••••••" : value}
        </span>
        {masked && (
          <button
            onClick={() => setRevealed(!revealed)}
            className="text-xs transition-colors"
            style={{ color: "#b8922e" }}
          >
            {revealed ? "Hide ID" : "Show ID"}
          </button>
        )}
      </div>
    </div>
  );
}

function ToggleSetting({ label, description, defaultOn }: { label: string; description: string; defaultOn: boolean }) {
  const [enabled, setEnabled] = useState(defaultOn);

  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs mt-0.5 text-gray-400">{description}</p>
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className={`toggle-warm ${enabled ? "active" : "inactive"}`}
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
