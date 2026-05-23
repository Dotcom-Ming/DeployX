import { BuildStage } from "../types/deployment.js";

export interface BuildStageInfo {
  label: string;
  description: string;
}

export const BUILD_STAGES: Record<BuildStage, BuildStageInfo> = {
  [BuildStage.CLONING]: {
    label: "Cloning",
    description: "Fetching repository from git provider",
  },
  [BuildStage.INSTALLING]: {
    label: "Installing",
    description: "Installing project dependencies",
  },
  [BuildStage.BUILDING]: {
    label: "Building",
    description: "Compiling and bundling the application",
  },
  [BuildStage.DEPLOYING]: {
    label: "Deploying",
    description: "Deploying built assets to the edge network",
  },
  [BuildStage.READY]: {
    label: "Ready",
    description: "Deployment is live and serving traffic",
  },
};

export const BUILD_STAGE_ORDER: BuildStage[] = [
  BuildStage.CLONING,
  BuildStage.INSTALLING,
  BuildStage.BUILDING,
  BuildStage.DEPLOYING,
  BuildStage.READY,
];
