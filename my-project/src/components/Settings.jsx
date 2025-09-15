import React from "react";
import ThemeControls from "./ThemeControls";

export default function Settings() {
  return (
    <div className="min-h-screen p-6">
      {/* Regular webpage styling - unaffected by theme */}
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
        
        {/* This section will have the default webpage styling */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">General Settings</h2>
          <p className="text-gray-600 mb-4">
            This section uses the default webpage styling and won't be affected by theme changes.
          </p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Save General Settings
          </button>
        </div>

        {/* Themed Container - Only this section will be affected by theme */}
        <div className="themed-container min-h-[400px] rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-theme-text">Appearance (Themed Section)</h2>
          <p className="text-theme-text-secondary mb-6">
            This section is themed and will change colors based on your theme selection. 
            Choose your preferred theme and background style below.
          </p>
          
          {/* Theme Controls */}
          <div className="mb-6">
            <ThemeControls />
          </div>

          {/* Sample themed components to show the theme in action */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="themed-card">
              <h3 className="text-lg font-medium mb-3 text-theme-text">Sample Card</h3>
              <p className="text-theme-text-secondary mb-4">
                This card demonstrates how the theme affects different elements.
              </p>
              <div className="flex gap-2">
                <button className="themed-button-primary">Primary Button</button>
                <button className="themed-button-secondary">Secondary Button</button>
              </div>
            </div>

            <div className="themed-card">
              <h3 className="text-lg font-medium mb-3 text-theme-text">Form Elements</h3>
              <div className="space-y-3">
                <input 
                  type="text" 
                  placeholder="Themed input field..." 
                  className="themed-input"
                />
                <select className="themed-input">
                  <option>Themed select option</option>
                  <option>Another option</option>
                </select>
              </div>
            </div>
          </div>

          {/* Color palette display */}
          <div className="mt-6 themed-card">
            <h3 className="text-lg font-medium mb-3 text-theme-text">Current Theme Colors</h3>
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <div className="bg-theme-primary h-12 w-full rounded mb-2"></div>
                <span className="text-xs text-theme-text-secondary">Primary</span>
              </div>
              <div className="text-center">
                <div className="bg-theme-secondary h-12 w-full rounded mb-2"></div>
                <span className="text-xs text-theme-text-secondary">Secondary</span>
              </div>
              <div className="text-center">
                <div className="bg-theme-accent h-12 w-full rounded mb-2"></div>
                <span className="text-xs text-theme-text-secondary">Accent</span>
              </div>
              <div className="text-center">
                <div className="bg-theme-surface border border-theme-border h-12 w-full rounded mb-2"></div>
                <span className="text-xs text-theme-text-secondary">Surface</span>
              </div>
            </div>
          </div>
        </div>

        {/* Another regular section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Account Settings</h2>
          <p className="text-gray-600 mb-4">
            This section also uses default webpage styling and remains unaffected by themes.
          </p>
          <div className="flex gap-3">
            <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
              Update Profile
            </button>
            <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}