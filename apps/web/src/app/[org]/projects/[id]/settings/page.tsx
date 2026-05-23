"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";

export default function ProjectSettingsPage() {
  const [projectName, setProjectName] = useState("");
  const [buildCommand, setBuildCommand] = useState("");
  const [outputDirectory, setOutputDirectory] = useState("");
  const [installCommand, setInstallCommand] = useState("");

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Project Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure your project build and deployment settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Basic project information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Build Settings</CardTitle>
          <CardDescription>Customize how your project is built</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="buildCommand">Build Command</Label>
            <Input
              id="buildCommand"
              placeholder="npm run build"
              value={buildCommand}
              onChange={(e) => setBuildCommand(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="outputDirectory">Output Directory</Label>
            <Input
              id="outputDirectory"
              placeholder=".next"
              value={outputDirectory}
              onChange={(e) => setOutputDirectory(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="installCommand">Install Command</Label>
            <Input
              id="installCommand"
              placeholder="npm install"
              value={installCommand}
              onChange={(e) => setInstallCommand(e.target.value)}
            />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      <Separator />

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Project</p>
              <p className="text-sm text-muted-foreground">
                Once deleted, there is no going back. All deployments and data will be permanently removed.
              </p>
            </div>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
