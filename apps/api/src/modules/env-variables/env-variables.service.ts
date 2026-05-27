import { prisma } from '@deployx/database';
import { encrypt, decrypt } from '@deployx/shared';

export class EnvVariablesService {

  private get encryptionKey(): string {
    return process.env.ENCRYPTION_KEY || 'default-encryption-key-change-me';
  }

  async list(projectId: string) {
    const variables = await prisma.envVariable.findMany({
      where: { projectId },
      orderBy: [{ key: 'asc' }],
    });

    return variables.map((v) => ({
      id: v.id,
      key: v.key,
      value: this.maskValue(v.encryptedValue),
      target: v.target,
      projectId: v.projectId,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    }));
  }

  async create(projectId: string, key: string, value: string, target: string) {
    const existing = await prisma.envVariable.findFirst({
      where: { projectId, key, target },
    });

    if (existing) {
      throw new Error(`Environment variable ${key} already exists for target ${target}`);
    }

    const encryptedValue = encrypt(value, this.encryptionKey);

    const variable = await prisma.envVariable.create({
      data: {
        projectId,
        key,
        encryptedValue,
        target,
      },
    });

    console.log(`Env var ${key} created for project ${projectId}`);

    return {
      id: variable.id,
      key: variable.key,
      value: this.maskValue(variable.encryptedValue),
      target: variable.target,
      createdAt: variable.createdAt,
      updatedAt: variable.updatedAt,
    };
  }

  async update(varId: string, data: { key?: string; value?: string; target?: string }) {
    const variable = await prisma.envVariable.findUnique({
      where: { id: varId },
    });

    if (!variable) {
      throw new Error('Environment variable not found');
    }

    const updateData: { key?: string; encryptedValue?: string; target?: string } = {};

    if (data.key !== undefined) {
      updateData.key = data.key;
    }

    if (data.value !== undefined) {
      updateData.encryptedValue = encrypt(data.value, this.encryptionKey);
    }

    if (data.target !== undefined) {
      updateData.target = data.target;
    }

    const updated = await prisma.envVariable.update({
      where: { id: varId },
      data: updateData,
    });

    console.log(`Env var ${updated.key} updated`);

    return {
      id: updated.id,
      key: updated.key,
      value: this.maskValue(updated.encryptedValue),
      target: updated.target,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async remove(varId: string) {
    const variable = await prisma.envVariable.findUnique({
      where: { id: varId },
    });

    if (!variable) {
      throw new Error('Environment variable not found');
    }

    await prisma.envVariable.delete({
      where: { id: varId },
    });

    console.log(`Env var ${variable.key} deleted`);

    return { deleted: true };
  }

  async decryptValue(encryptedValue: string): Promise<string> {
    try {
      return decrypt(encryptedValue, this.encryptionKey);
    } catch {
      throw new Error('Failed to decrypt environment variable value');
    }
  }

  private maskValue(value: string): string {
    if (value.length <= 8) {
      return '*'.repeat(value.length);
    }
    return value.substring(0, 3) + '*'.repeat(value.length - 6) + value.substring(value.length - 3);
  }
}
