import { z } from 'zod';
import { Framework, GitProvider } from '@deployx/shared';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  framework: z.nativeEnum(Framework),
  gitProvider: z.nativeEnum(GitProvider),
  repositoryUrl: z.string().url('Invalid repository URL'),
  branch: z.string().min(1, 'Branch is required'),
  rootDirectory: z.string().optional().default('/'),
  buildCommand: z.string().optional(),
  outputDirectory: z.string().optional(),
  installCommand: z.string().optional(),
  envVars: z.record(z.string()).optional(),
});

export type CreateProjectDto = z.infer<typeof createProjectSchema>;
