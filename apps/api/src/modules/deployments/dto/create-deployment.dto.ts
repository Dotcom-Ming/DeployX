import { z } from 'zod';
import { DeploymentType } from '@deployx/shared';

export const createDeploymentSchema = z.object({
  branch: z.string().min(1, 'Branch is required'),
  commitSha: z.string().optional(),
  type: z.nativeEnum(DeploymentType),
});

export type CreateDeploymentDto = z.infer<typeof createDeploymentSchema>;
