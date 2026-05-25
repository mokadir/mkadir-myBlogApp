"use client";

import * as React from "react";
import { Bell, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

interface NotificationPreferences {
  emailOnComment: boolean;
  emailOnReply: boolean;
  emailOnLike: boolean;
  emailOnDigest: boolean;
  pushOnComment: boolean;
  pushOnReply: boolean;
  pushOnLike: boolean;
  pushOnFollow: boolean;
}

export function NotificationPreferencesForm() {
  const [preferences, setPreferences] = React.useState<NotificationPreferences>({
    emailOnComment: true,
    emailOnReply: true,
    emailOnLike: true,
    emailOnDigest: true,
    pushOnComment: true,
    pushOnReply: true,
    pushOnLike: true,
    pushOnFollow: true,
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const res = await fetch("/api/notifications/preferences");
      if (res.ok) {
        const data = await res.json();
        setPreferences(data);
      }
    } catch {
      // Use defaults
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = async (
    key: keyof NotificationPreferences,
    value: boolean
  ) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    setIsSaving(true);

    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });

      if (!res.ok) {
        throw new Error("Failed to update");
      }

      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been saved.",
      });
    } catch {
      // Revert on error
      setPreferences(preferences);
      toast({
        title: "Error",
        description: "Failed to update preferences.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Control how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Control how you receive notifications
            </CardDescription>
          </div>
          {isSaving && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Push Notifications */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">In-App Notifications</h4>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="pushOnComment" className="text-sm font-normal">
                New comments on your posts
              </Label>
              <Switch
                id="pushOnComment"
                checked={preferences.pushOnComment}
                onCheckedChange={(checked) =>
                  updatePreference("pushOnComment", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="pushOnReply" className="text-sm font-normal">
                Replies to your comments
              </Label>
              <Switch
                id="pushOnReply"
                checked={preferences.pushOnReply}
                onCheckedChange={(checked) =>
                  updatePreference("pushOnReply", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="pushOnLike" className="text-sm font-normal">
                Likes on your posts
              </Label>
              <Switch
                id="pushOnLike"
                checked={preferences.pushOnLike}
                onCheckedChange={(checked) =>
                  updatePreference("pushOnLike", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="pushOnFollow" className="text-sm font-normal">
                New followers
              </Label>
              <Switch
                id="pushOnFollow"
                checked={preferences.pushOnFollow}
                onCheckedChange={(checked) =>
                  updatePreference("pushOnFollow", checked)
                }
              />
            </div>
          </div>
        </div>

        {/* Email Notifications */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">Email Notifications</h4>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="emailOnComment" className="text-sm font-normal">
                Email on new comments
              </Label>
              <Switch
                id="emailOnComment"
                checked={preferences.emailOnComment}
                onCheckedChange={(checked) =>
                  updatePreference("emailOnComment", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="emailOnReply" className="text-sm font-normal">
                Email on comment replies
              </Label>
              <Switch
                id="emailOnReply"
                checked={preferences.emailOnReply}
                onCheckedChange={(checked) =>
                  updatePreference("emailOnReply", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="emailOnLike" className="text-sm font-normal">
                Email on likes
              </Label>
              <Switch
                id="emailOnLike"
                checked={preferences.emailOnLike}
                onCheckedChange={(checked) =>
                  updatePreference("emailOnLike", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="emailOnDigest" className="text-sm font-normal">
                Weekly email digest
              </Label>
              <Switch
                id="emailOnDigest"
                checked={preferences.emailOnDigest}
                onCheckedChange={(checked) =>
                  updatePreference("emailOnDigest", checked)
                }
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
