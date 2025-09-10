import React from "react";
import ThemeControls from "./ThemeControls";

export default function Settings() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] p-6">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      {/* Section: Appearance */}
      <div className="bg-[var(--color-surface)] rounded-lg shadow p-6 border border-[var(--color-border)]">
        <h2 className="text-lg font-medium mb-4">Appearance</h2>
        <p className="text-sm text-[var(--color-muted)] mb-4">
          Choose your preferred theme for the dashboard.
        </p>

        <ThemeControls />
      </div>
    </div>
  );
}
