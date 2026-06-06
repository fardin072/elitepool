"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import {
  Settings, Bell, Palette, Globe, Shield, Trash2,
  Sun, Moon, Monitor, Check, ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

const notificationSettings = [
  { id: "task_assigned", label: "Task assigned to me", description: "Get notified when someone assigns you a task", defaultOn: true },
  { id: "task_completed", label: "Task completed", description: "When a task in your projects is completed", defaultOn: true },
  { id: "deadline_reminder", label: "Deadline reminders", description: "24-hour reminder before task due dates", defaultOn: true },
  { id: "project_updates", label: "Project updates", description: "Status changes on projects you belong to", defaultOn: false },
  { id: "mentions", label: "Comments & mentions", description: "When someone comments on your tasks", defaultOn: true },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState<Record<string, boolean>>(
    Object.fromEntries(notificationSettings.map((s) => [s.id, s.defaultOn]))
  );

  const toggleNotification = (id: string) => {
    setNotifications((prev) => ({ ...prev, [id]: !prev[id] }));
    toast.success("Preference saved");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="gradient-text">Work</span>space Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customize your experience and notification preferences
        </p>
      </div>

      {/* Appearance */}
      <Card className="border-white/6 bg-card/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand">
              <Palette className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Appearance</CardTitle>
              <CardDescription>Choose how ElitePool looks to you</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  "relative flex flex-col items-center gap-2.5 rounded-xl border-2 p-4 text-sm font-medium transition-all",
                  theme === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:bg-muted"
                )}
              >
                {theme === value && (
                  <div className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full gradient-brand">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
                <Icon className="h-6 w-6" />
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-white/6 bg-card/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
              <Bell className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Notifications</CardTitle>
              <CardDescription>Control which emails and alerts you receive</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {notificationSettings.map((setting, i) => (
            <div key={setting.id}>
              {i > 0 && <Separator className="my-3" />}
              <div className="flex items-center justify-between gap-4 py-1">
                <div className="min-w-0">
                  <Label className="text-sm font-medium cursor-pointer">{setting.label}</Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">{setting.description}</p>
                </div>
                <button
                  onClick={() => toggleNotification(setting.id)}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none",
                    notifications[setting.id] ? "gradient-brand" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                      notifications[setting.id] ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card className="border-white/6 bg-card/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/20">
              <Globe className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Integrations</CardTitle>
              <CardDescription>Connected services and apps</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { name: "GitHub", desc: "Link commits to tasks", status: "coming soon" },
            { name: "Slack", desc: "Task notifications in Slack", status: "coming soon" },
            { name: "Google Calendar", desc: "Sync deadlines to calendar", status: "coming soon" },
          ].map((item) => (
            <div key={item.name} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                  {item.status}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-rose-500 to-red-600 shadow-lg shadow-rose-500/20">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible and destructive actions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Delete Account</p>
              <p className="text-xs text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => toast.error("Account deletion requires contacting support")}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
