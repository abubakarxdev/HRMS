import React from "react";
import Card from "../../components/ui/Card";

const PlatformSettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">System Settings</h1>
        <p className="text-slate-500">Configure global platform settings.</p>
      </div>

      <Card className="p-12 text-center text-slate-500">
        <p>System Settings feature is coming soon.</p>
      </Card>
    </div>
  );
};

export default PlatformSettingsPage;
