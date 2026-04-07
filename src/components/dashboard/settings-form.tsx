"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  updateSettings,
  type UserSettingsData,
} from "@/lib/actions/settings";

interface SettingsFormProps {
  initialSettings: UserSettingsData;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [newLang, setNewLang] = useState("");
  const [newExcludedRepo, setNewExcludedRepo] = useState("");
  const [newExcludedTopic, setNewExcludedTopic] = useState("");

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      await updateSettings(settings);
      setMessage({ type: "success", text: "Settings saved successfully" });
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save",
      });
    } finally {
      setSaving(false);
    }
  }

  function addToList(
    key: "preferredLanguages" | "excludedRepos" | "excludedTopics",
    value: string,
    setter: (v: string) => void
  ) {
    const trimmed = value.trim();
    if (!trimmed || settings[key].includes(trimmed)) return;
    setSettings({ ...settings, [key]: [...settings[key], trimmed] });
    setter("");
  }

  function removeFromList(
    key: "preferredLanguages" | "excludedRepos" | "excludedTopics",
    value: string
  ) {
    setSettings({
      ...settings,
      [key]: settings[key].filter((v) => v !== value),
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Preferred Languages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferred Languages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Focus scouting on repos using these languages. Leave empty to match
            all languages from your profile.
          </p>
          <div className="flex flex-wrap gap-2">
            {settings.preferredLanguages.map((lang) => (
              <Badge key={lang} variant="secondary" className="gap-1">
                {lang}
                <button
                  onClick={() => removeFromList("preferredLanguages", lang)}
                  className="ml-1 hover:text-destructive"
                >
                  x
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newLang}
              onChange={(e) => setNewLang(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                addToList("preferredLanguages", newLang, setNewLang)
              }
              placeholder="e.g., TypeScript"
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                addToList("preferredLanguages", newLang, setNewLang)
              }
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Excluded Repos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Excluded Repositories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Never recommend these repos (use owner/repo format).
          </p>
          <div className="flex flex-wrap gap-2">
            {settings.excludedRepos.map((repo) => (
              <Badge key={repo} variant="secondary" className="gap-1">
                {repo}
                <button
                  onClick={() => removeFromList("excludedRepos", repo)}
                  className="ml-1 hover:text-destructive"
                >
                  x
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newExcludedRepo}
              onChange={(e) => setNewExcludedRepo(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                addToList(
                  "excludedRepos",
                  newExcludedRepo,
                  setNewExcludedRepo
                )
              }
              placeholder="e.g., facebook/react"
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                addToList(
                  "excludedRepos",
                  newExcludedRepo,
                  setNewExcludedRepo
                )
              }
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Excluded Topics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Excluded Topics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Skip repos with these topics.
          </p>
          <div className="flex flex-wrap gap-2">
            {settings.excludedTopics.map((topic) => (
              <Badge key={topic} variant="secondary" className="gap-1">
                {topic}
                <button
                  onClick={() => removeFromList("excludedTopics", topic)}
                  className="ml-1 hover:text-destructive"
                >
                  x
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newExcludedTopic}
              onChange={(e) => setNewExcludedTopic(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                addToList(
                  "excludedTopics",
                  newExcludedTopic,
                  setNewExcludedTopic
                )
              }
              placeholder="e.g., blockchain"
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                addToList(
                  "excludedTopics",
                  newExcludedTopic,
                  setNewExcludedTopic
                )
              }
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scouting Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scouting Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Minimum Stars</label>
            <p className="text-xs text-muted-foreground mb-2">
              Only recommend repos with at least this many stars
            </p>
            <input
              type="number"
              min={0}
              max={100000}
              value={settings.minStars}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  minStars: parseInt(e.target.value) || 0,
                })
              }
              className="w-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Difficulty Preference</label>
            <p className="text-xs text-muted-foreground mb-2">
              Filter recommendations by difficulty level
            </p>
            <select
              value={settings.difficultyPreference}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  difficultyPreference: e.target.value,
                })
              }
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="any">Any difficulty</option>
              <option value="beginner-friendly">Beginner-friendly</option>
              <option value="moderate">Moderate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Scout Frequency</label>
            <p className="text-xs text-muted-foreground mb-2">
              How often to automatically re-scout for new projects
            </p>
            <select
              value={settings.scoutFrequency}
              onChange={(e) =>
                setSettings({ ...settings, scoutFrequency: e.target.value })
              }
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="weekly">Weekly</option>
              <option value="biweekly">Every 2 weeks</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
        {message && (
          <p
            className={`text-sm ${message.type === "success" ? "text-primary" : "text-destructive"}`}
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
