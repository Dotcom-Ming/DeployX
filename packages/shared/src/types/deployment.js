"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildStage = exports.DeploymentType = exports.DeploymentStatus = void 0;
var DeploymentStatus;
(function (DeploymentStatus) {
    DeploymentStatus["PENDING"] = "PENDING";
    DeploymentStatus["BUILDING"] = "BUILDING";
    DeploymentStatus["READY"] = "READY";
    DeploymentStatus["ERROR"] = "ERROR";
    DeploymentStatus["CANCELLED"] = "CANCELLED";
    DeploymentStatus["QUEUED"] = "QUEUED";
})(DeploymentStatus || (exports.DeploymentStatus = DeploymentStatus = {}));
var DeploymentType;
(function (DeploymentType) {
    DeploymentType["PRODUCTION"] = "PRODUCTION";
    DeploymentType["PREVIEW"] = "PREVIEW";
    DeploymentType["ROLLBACK"] = "ROLLBACK";
})(DeploymentType || (exports.DeploymentType = DeploymentType = {}));
var BuildStage;
(function (BuildStage) {
    BuildStage["CLONING"] = "CLONING";
    BuildStage["INSTALLING"] = "INSTALLING";
    BuildStage["BUILDING"] = "BUILDING";
    BuildStage["DEPLOYING"] = "DEPLOYING";
    BuildStage["READY"] = "READY";
})(BuildStage || (exports.BuildStage = BuildStage = {}));
//# sourceMappingURL=deployment.js.map