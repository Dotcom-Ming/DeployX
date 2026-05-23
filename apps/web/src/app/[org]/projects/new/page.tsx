"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Github, Gitlab, Box, Search, ChevronRight, ChevronLeft,
  Loader2, CheckCircle2, Play, Settings2, Plus, X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { GitProvider, Framework, FRAMEWORK_CONFIGS, PLAN_LIMITS } from "@deployx/shared";

type Step = 1 | 2 | 3 | 4;

interface Repo {
  id: string;
  name: string;
  fullName: string;
  private: boolean;
  htmlUrl: string;
  description: string | null;
  language: string | null;
  updatedAt: string;
  provider: string;
  defaultBranch: string;
}

const providers = [
  {
    id: GitProvider.GITHUB,
    name: "GitHub",
    icon: Github,
    description: "Import repositories from GitHub",
  },
  {
    id: GitProvider.GITLAB,
    name: "GitLab",
    icon: Gitlab,
    description: "Import repositories from GitLab",
  },
  {
    id: GitProvider.BITBUCKET,
    name: "Bitbucket",
    icon: Box,
    description: "Import repositories from Bitbucket",
  },
];

const buildStages = [
  { label: "Cloning", status: "completed" as const },
  { label: "Installing", status: "completed" as const },
  { label: "Building", status: "running" as const },
  { label: "Deploying", status: "pending" as const },
  { label: "Ready", status: "pending" as const },
];

export default function NewProjectPage() {
  const params = useParams();
  const org = params.org as string;

  const [step, setStep] = useState<Step>(1);
  const [selectedProvider, setSelectedProvider] = useState<GitProvider | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoSearch, setRepoSearch] = useState("");
  const [projectName, setProjectName] = useState("");
  const [framework, setFramework] = useState<Framework>(Framework.NEXTJS);
  const [rootDir, setRootDir] = useState(".");
  const [buildCmd, setBuildCmd] = useState("next build");
  const [outputDir, setOutputDir] = useState(".next");
  const [installCmd, setInstallCmd] = useState("npm install");
  const [envVars, setEnvVars] = useState<{ key: string; value: string }[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [projectCount, setProjectCount] = useState(0);
  const [projectLimit, setProjectLimit] = useState(10);

  useEffect(() => {
    const fetchProjectCount = async () => {
      try {
        const res = await fetch(`/api/orgs/${org}/projects`);
        if (res.ok) {
          const projects = await res.json();
          setProjectCount(projects.length);
        }
      } catch {
        // Silently fail
      }
    };

    fetchProjectCount();
  }, [org]);

  const filteredRepos = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(repoSearch.toLowerCase()) ||
      r.fullName.toLowerCase().includes(repoSearch.toLowerCase())
  );

  const handleSelectProvider = async (provider: GitProvider) => {
    setSelectedProvider(provider);
    setLoadingRepos(true);

    try {
      const endpoint = provider === GitProvider.GITHUB ? 'github' : 'gitlab';
      const res = await fetch(`/api/git-repos/${endpoint}`);

      if (!res.ok) {
        toast.error(`Failed to fetch ${provider} repositories`);
        setRepos([]);
        return;
      }

      const data = await res.json();
      setRepos(data);
      setStep(2);
    } catch {
      toast.error(`Failed to connect to ${provider}`);
      setRepos([]);
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleSelectRepo = (repo: Repo) => {
    setSelectedRepo(repo);
    setProjectName(repo.name);
    setStep(3);
  };

  const handleFrameworkChange = (fw: Framework) => {
    setFramework(fw);
    const config = FRAMEWORK_CONFIGS[fw];
    setBuildCmd(config.buildCmd);
    setOutputDir(config.outputDir);
    setInstallCmd(config.installCmd);
  };

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: "", value: "" }]);
  };

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const updateEnvVar = (index: number, field: "key" | "value", val: string) => {
    const updated = [...envVars];
    updated[index][field] = val;
    setEnvVars(updated);
  };

  const handleDeploy = async () => {
    if (projectCount >= projectLimit) {
      toast.error(`Project limit reached (${projectCount}/${projectLimit}). Upgrade your plan to create more projects.`);
      return;
    }

    setIsDeploying(true);
    setStep(4);

    try {
      const res = await fetch(`/api/orgs/${org}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          framework,
          gitProvider: selectedProvider,
          gitRepo: selectedRepo?.fullName,
          rootDir,
          buildCmd,
          outputDir,
          installCmd,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to create project");
        setIsDeploying(false);
        return;
      }

      toast.success("Project created and deployment started!");
    } catch {
      toast.error("Something went wrong");
      setIsDeploying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-8 space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {["Provider", "Repository", "Configure", "Deploy"].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-medium ${
              step > i + 1 ? "bg-green-500 text-white" : step === i + 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {step > i + 1 ? "✓" : i + 1}
            </div>
            <span className={step === i + 1 ? "font-medium" : "text-muted-foreground"}>{label}</span>
            {i < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      <Separator />

      {/* Step 1: Choose Provider */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Choose Git Provider</h2>
            <p className="text-muted-foreground mt-1">Select where your repository is hosted</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {providers.map((provider) => (
              <Card
                key={provider.id}
                className={`cursor-pointer transition-all hover:border-primary/50 ${
                  selectedProvider === provider.id ? "border-primary ring-1 ring-primary" : ""
                }`}
                onClick={() => handleSelectProvider(provider.id)}
              >
                <CardContent className="p-6 text-center space-y-3">
                  <provider.icon className="h-10 w-10 mx-auto" />
                  <h3 className="font-semibold">{provider.name}</h3>
                  <p className="text-xs text-muted-foreground">{provider.description}</p>
                  {loadingRepos && selectedProvider === provider.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  ) : (
                    <Badge variant="success" className="text-xs">Click to connect</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Step 2: Choose Repository */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Import Repository</h2>
            <p className="text-muted-foreground mt-1">Select the repository you want to deploy</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Repository list */}
            <div className="lg:col-span-3 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search repositories..."
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="border rounded-lg divide-y max-h-[400px] overflow-auto">
                {loadingRepos ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredRepos.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    No repositories found
                  </div>
                ) : (
                  filteredRepos.map((repo) => (
                    <div
                      key={repo.id}
                      className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleSelectRepo(repo)}
                    >
                      <div className="flex items-center gap-3">
                        {repo.provider === 'GITHUB' ? (
                          <Github className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Gitlab className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{repo.fullName}</span>
                            {repo.private && <Badge variant="outline" className="text-[10px] py-0">Private</Badge>}
                          </div>
                          <span className="text-xs text-muted-foreground">Updated {new Date(repo.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs">
                        Import <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
            {/* Config preview */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Configuration Preview</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-2">
                  <p>Select a repository to configure your project settings.</p>
                  <div className="space-y-1">
                    <div className="flex justify-between"><span>Provider:</span><span className="font-medium text-foreground">{providers.find((p) => p.id === selectedProvider)?.name}</span></div>
                    <div className="flex justify-between"><span>Auto-detect:</span><span className="font-medium text-foreground">Framework & Build</span></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Configure Project */}
      {step === 3 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Configure Project</h2>
            <p className="text-muted-foreground mt-1">Set up your project build settings</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Project Name</Label>
                <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Framework Preset</Label>
                <Select value={framework} onValueChange={(v) => handleFrameworkChange(v as Framework)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.values(Framework).map((f) => (
                      <SelectItem key={f} value={f}>{FRAMEWORK_CONFIGS[f].name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Root Directory</Label>
                <Input value={rootDir} onChange={(e) => setRootDir(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Build Command</Label>
                <Input value={buildCmd} onChange={(e) => setBuildCmd(e.target.value)} className="font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label>Output Directory</Label>
                <Input value={outputDir} onChange={(e) => setOutputDir(e.target.value)} className="font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label>Install Command</Label>
                <Input value={installCmd} onChange={(e) => setInstallCmd(e.target.value)} className="font-mono text-sm" />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Environment Variables</Label>
                  <Button variant="ghost" size="sm" onClick={addEnvVar}>
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {envVars.map((env, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        placeholder="KEY"
                        value={env.key}
                        onChange={(e) => updateEnvVar(i, "key", e.target.value)}
                        className="font-mono text-sm flex-1"
                      />
                      <Input
                        placeholder="value"
                        value={env.value}
                        onChange={(e) => updateEnvVar(i, "value", e.target.value)}
                        className="font-mono text-sm flex-1"
                      />
                      <Button variant="ghost" size="icon" className="shrink-0" onClick={() => removeEnvVar(i)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {envVars.length === 0 && (
                    <p className="text-xs text-muted-foreground py-4 text-center border rounded-lg border-dashed">
                      No environment variables added yet
                    </p>
                  )}
                </div>
              </div>
              <Card className="bg-muted/50">
                <CardContent className="p-4 space-y-2 text-sm">
                  <h4 className="font-medium">Project Summary</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="text-muted-foreground">Repository:</span>
                    <span className="font-mono">{selectedRepo?.fullName}</span>
                    <span className="text-muted-foreground">Framework:</span>
                    <span>{FRAMEWORK_CONFIGS[framework].name}</span>
                    <span className="text-muted-foreground">Build:</span>
                    <span className="font-mono">{buildCmd}</span>
                    <span className="text-muted-foreground">Output:</span>
                    <span className="font-mono">{outputDir}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button size="lg" onClick={handleDeploy} disabled={isDeploying}>
              {isDeploying ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Deploy
            </Button>
          </div>
        </motion.div>
      )}

      {/* Step 4: Deploy Progress */}
      {step === 4 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Deploying {projectName}</h2>
            <p className="text-muted-foreground mt-1">Your project is being built and deployed</p>
          </div>
          {/* Build stage timeline */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {buildStages.map((stage, i) => (
                  <div key={stage.label} className="flex items-center gap-3">
                    <div className={`flex items-center justify-center h-8 w-8 rounded-full ${
                      stage.status === "completed" ? "bg-green-500/20 text-green-500" :
                      stage.status === "running" ? "bg-blue-500/20 text-blue-500" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {stage.status === "completed" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : stage.status === "running" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <span className="text-xs">{i + 1}</span>
                      )}
                    </div>
                    <div>
                      <p className={`font-medium ${stage.status === "pending" ? "text-muted-foreground" : ""}`}>
                        {stage.label}
                      </p>
                      {stage.status === "running" && (
                        <p className="text-xs text-muted-foreground animate-pulse">In progress...</p>
                      )}
                      {stage.status === "completed" && (
                        <p className="text-xs text-green-500">Completed</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          {/* Live log terminal */}
          <Card>
            <CardContent className="p-0">
              <div className="bg-zinc-950 rounded-lg p-4 font-mono text-xs text-zinc-400 space-y-1 h-64 overflow-auto">
                <p className="text-blue-400">[10:30:01] Cloning repository from {selectedRepo?.fullName}</p>
                <p className="text-blue-400">[10:30:03] Repository cloned successfully</p>
                <p className="text-green-400">[10:30:04] Detected framework: {FRAMEWORK_CONFIGS[framework].name}</p>
                <p className="text-blue-400">[10:30:05] Running: {installCmd}</p>
                <p className="text-zinc-500">[10:30:08] added 1247 packages in 3.2s</p>
                <p className="text-blue-400">[10:30:09] Running: {buildCmd}</p>
                <p className="text-zinc-500">[10:30:12] Creating an optimized production build...</p>
                <p className="text-yellow-400">[10:30:14] Warning: Image optimization may be slow</p>
                <p className="text-zinc-500">[10:30:18] Compiled successfully</p>
                <p className="text-zinc-500">[10:30:20] Generating static pages (12/12)</p>
                <p className="text-blue-400">[10:30:22] Build completed in 13.4s</p>
                <p className={isDeploying ? "text-blue-400 animate-pulse" : "text-blue-400"}>[10:30:23] Deploying to edge network...</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
