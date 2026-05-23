import { Framework } from "../types/project";
export interface FrameworkConfig {
    name: string;
    buildCmd: string;
    outputDir: string;
    installCmd: string;
    devCmd: string;
}
export declare const FRAMEWORK_CONFIGS: Record<Framework, FrameworkConfig>;
//# sourceMappingURL=frameworks.d.ts.map