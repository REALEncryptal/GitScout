import { getSettings } from "@/lib/actions/settings";
import { SettingsForm } from "@/components/dashboard/settings-form";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Customize how GitScout scouts for projects
        </p>
      </div>
      <SettingsForm initialSettings={settings} />
    </div>
  );
}
