import { z } from 'zod';

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').optional(),
  branch: z.string().min(1, 'Branch is required').optional(),
  rootDirectory: z.string().optional(),
  buildCommand: z.string().optional(),
  outputDirectory: z.string().optional(),
  installCommand: z.string().optional(),
  envVars: z.record(z.string()).optional(),
});

export type UpdateProjectDto = z.infer<typeof updateProjectSchema>;
