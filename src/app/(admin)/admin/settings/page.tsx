"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Save,
  Globe,
  Mail,
  Shield,
  Palette,
  Link,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  postsPerPage: number;
  enableRegistration: boolean;
  enableComments: boolean;
  moderateComments: boolean;
  enableNewsletter: boolean;
  socialLinks: {
    twitter: string;
    github: string;
    linkedin: string;
    facebook: string;
  };
  appearance: {
    primaryColor: string;
    fontFamily: string;
  };
  email: {
    fromName: string;
    fromEmail: string;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
  };
}

const defaultSettings: SiteSettings = {
  siteName: "ModernBlog",
  siteDescription: "A modern blogging platform for sharing ideas, stories, and knowledge with the world.",
  siteUrl: "http://localhost:3000",
  postsPerPage: 10,
  enableRegistration: true,
  enableComments: true,
  moderateComments: false,
  enableNewsletter: true,
  socialLinks: {
    twitter: "",
    github: "",
    linkedin: "",
    facebook: "",
  },
  appearance: {
    primaryColor: "#6366f1",
    fontFamily: "Inter",
  },
  email: {
    fromName: "ModernBlog",
    fromEmail: "noreply@modernblog.com",
  },
  seo: {
    metaTitle: "ModernBlog - A Modern Blogging Platform",
    metaDescription: "A modern blogging platform for sharing ideas, stories, and knowledge with the world.",
    metaKeywords: "blog, writing, content, modern, technology",
  },
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    // Load settings from localStorage or API
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          setSettings({ ...defaultSettings, ...data });
        }
      } catch {
        // Use defaults if API fails
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save settings"
      );
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof SiteSettings>(
    key: K,
    value: SiteSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateNestedSetting = <
    T extends keyof SiteSettings,
    K extends keyof SiteSettings[T]
  >(
    parent: T,
    key: K,
    value: SiteSettings[T][K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      [parent]: { ...(prev[parent] as Record<string, unknown>), [key]: value },
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your site configuration and preferences.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">
            <Globe className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="mr-2 h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="social">
            <Link className="mr-2 h-4 w-4" />
            Social Links
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="mr-2 h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="seo">
            <Shield className="mr-2 h-4 w-4" />
            SEO
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Site Information</CardTitle>
              <CardDescription>
                Basic information about your blog site.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => updateSetting("siteName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) =>
                    updateSetting("siteDescription", e.target.value)
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteUrl">Site URL</Label>
                <Input
                  id="siteUrl"
                  value={settings.siteUrl}
                  onChange={(e) => updateSetting("siteUrl", e.target.value)}
                  placeholder="https://yourdomain.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postsPerPage">Posts Per Page</Label>
                <Input
                  id="postsPerPage"
                  type="number"
                  min={1}
                  max={100}
                  value={settings.postsPerPage}
                  onChange={(e) =>
                    updateSetting("postsPerPage", parseInt(e.target.value) || 10)
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
              <CardDescription>
                Enable or disable site features.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableRegistration" className="font-medium">
                    User Registration
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow new users to create accounts
                  </p>
                </div>
                <Switch
                  id="enableRegistration"
                  checked={settings.enableRegistration}
                  onCheckedChange={(checked) =>
                    updateSetting("enableRegistration", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableComments" className="font-medium">
                    Comments
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to comment on posts
                  </p>
                </div>
                <Switch
                  id="enableComments"
                  checked={settings.enableComments}
                  onCheckedChange={(checked) =>
                    updateSetting("enableComments", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="moderateComments" className="font-medium">
                    Moderate Comments
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Require approval before comments are published
                  </p>
                </div>
                <Switch
                  id="moderateComments"
                  checked={settings.moderateComments}
                  onCheckedChange={(checked) =>
                    updateSetting("moderateComments", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableNewsletter" className="font-medium">
                    Newsletter
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enable newsletter subscription
                  </p>
                </div>
                <Switch
                  id="enableNewsletter"
                  checked={settings.enableNewsletter}
                  onCheckedChange={(checked) =>
                    updateSetting("enableNewsletter", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of your site.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-lg border"
                    style={{ backgroundColor: settings.appearance.primaryColor }}
                  />
                  <Input
                    value={settings.appearance.primaryColor}
                    onChange={(e) =>
                      updateNestedSetting("appearance", "primaryColor", e.target.value)
                    }
                    className="w-32 font-mono"
                  />
                  <div className="flex gap-1">
                    {[
                      "#6366f1",
                      "#8b5cf6",
                      "#ec4899",
                      "#ef4444",
                      "#f97316",
                      "#22c55e",
                      "#14b8a6",
                      "#3b82f6",
                    ].map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                          settings.appearance.primaryColor === color
                            ? "border-foreground"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() =>
                          updateNestedSetting("appearance", "primaryColor", color)
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fontFamily">Font Family</Label>
                <select
                  id="fontFamily"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={settings.appearance.fontFamily}
                  onChange={(e) =>
                    updateNestedSetting("appearance", "fontFamily", e.target.value)
                  }
                >
                  <option value="Inter">Inter</option>
                  <option value="system-ui">System UI</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Arial">Arial</option>
                  <option value="Roboto">Roboto</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Links */}
        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>
                Add links to your social media profiles.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter / X URL</Label>
                <Input
                  id="twitter"
                  value={settings.socialLinks.twitter}
                  onChange={(e) =>
                    updateNestedSetting("socialLinks", "twitter", e.target.value)
                  }
                  placeholder="https://twitter.com/yourhandle"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github">GitHub URL</Label>
                <Input
                  id="github"
                  value={settings.socialLinks.github}
                  onChange={(e) =>
                    updateNestedSetting("socialLinks", "github", e.target.value)
                  }
                  placeholder="https://github.com/yourhandle"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn URL</Label>
                <Input
                  id="linkedin"
                  value={settings.socialLinks.linkedin}
                  onChange={(e) =>
                    updateNestedSetting("socialLinks", "linkedin", e.target.value)
                  }
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook URL</Label>
                <Input
                  id="facebook"
                  value={settings.socialLinks.facebook}
                  onChange={(e) =>
                    updateNestedSetting("socialLinks", "facebook", e.target.value)
                  }
                  placeholder="https://facebook.com/yourpage"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Configure email sender settings for notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fromName">From Name</Label>
                <Input
                  id="fromName"
                  value={settings.email.fromName}
                  onChange={(e) =>
                    updateNestedSetting("email", "fromName", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromEmail">From Email</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  value={settings.email.fromEmail}
                  onChange={(e) =>
                    updateNestedSetting("email", "fromEmail", e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Settings */}
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>
                Configure search engine optimization defaults.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Default Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={settings.seo.metaTitle}
                  onChange={(e) =>
                    updateNestedSetting("seo", "metaTitle", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription">Default Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={settings.seo.metaDescription}
                  onChange={(e) =>
                    updateNestedSetting("seo", "metaDescription", e.target.value)
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaKeywords">Default Meta Keywords</Label>
                <Input
                  id="metaKeywords"
                  value={settings.seo.metaKeywords}
                  onChange={(e) =>
                    updateNestedSetting("seo", "metaKeywords", e.target.value)
                  }
                  placeholder="keyword1, keyword2, keyword3"
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of keywords
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
