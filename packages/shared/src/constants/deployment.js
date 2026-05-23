"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUILD_STAGE_ORDER = exports.BUILD_STAGES = void 0;
const deployment_1 = require("../types/deployment");
exports.BUILD_STAGES = {
    [deployment_1.BuildStage.CLONING]: {
        label: "Cloning",
        description: "Fetching repository from git provider",
    },
    [deployment_1.BuildStage.INSTALLING]: {
        label: "Installing",
        description: "Installing project dependencies",
    },
    [deployment_1.BuildStage.BUILDING]: {
        label: "Building",
        description: "Compiling and bundling the application",
    },
    [deployment_1.BuildStage.DEPLOYING]: {
        label: "Deploying",
        description: "Deploying built assets to the edge network",
    },
    [deployment_1.BuildStage.READY]: {
        label: "Ready",
        description: "Deployment is live and serving traffic",
    },
};
exports.BUILD_STAGE_ORDER = [
    deployment_1.BuildStage.CLONING,
    deployment_1.BuildStage.INSTALLING,
    deployment_1.BuildStage.BUILDING,
    deployment_1.BuildStage.DEPLOYING,
    deployment_1.BuildStage.READY,
];
//# sourceMappingURL=deployment.js.map