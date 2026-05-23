import { registerAs } from '@nestjs/config';

export default registerAs('builder', () => ({
  tempDir: process.env.BUILDER_TEMP_DIR || '/tmp/deployx-builds',
  registry: process.env.BUILDER_REGISTRY || 'registry.deployx.app',
  mode: process.env.BUILDER_MODE || 'local', // 'local' or 'k8s'
}));
