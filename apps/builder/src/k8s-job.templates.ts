import { Deployment } from '@deployx/database';

export function generateBuildJob(deployment: Deployment & { project?: any }): string {
  const name = `build-${deployment.id.slice(-8)}`;
  const registry = process.env.BUILDER_REGISTRY || 'registry.deployx.app';
  const imageTag = `${registry}/${deployment.projectId}:${deployment.commitSha || 'latest'}`;

  return `
apiVersion: batch/v1
kind: Job
metadata:
  name: ${name}
  namespace: deployx-builder
  labels:
    app: deployx-builder
    deployment-id: ${deployment.id}
    project-id: ${deployment.projectId}
spec:
  backoffLimit: 3
  ttlSecondsAfterFinished: 3600
  template:
    metadata:
      labels:
        app: deployx-builder
        deployment-id: ${deployment.id}
    spec:
      restartPolicy: Never
      containers:
        - name: kaniko
          image: gcr.io/kaniko-project/executor:latest
          args:
            - "--dockerfile=Dockerfile"
            - "--context=git://${deployment.project?.gitRepo || ''}#ref=${deployment.branch || 'main'}"
            - "--destination=${imageTag}"
            - "--cache=true"
            - "--cache-repo=${registry}/cache"
          env:
            - name: DOCKER_CONFIG
              value: /kaniko/.docker
          volumeMounts:
            - name: docker-config
              mountPath: /kaniko/.docker
          resources:
            requests:
              cpu: "500m"
              memory: "1Gi"
            limits:
              cpu: "2"
              memory: "4Gi"
      volumes:
        - name: docker-config
          secret:
            secretName: registry-credentials
`.trim();
}

export function generateDockerBuildConfig(
  projectId: string,
  commitSha: string,
  repoUrl: string,
  branch: string,
): string {
  const registry = process.env.BUILDER_REGISTRY || 'registry.deployx.app';
  const imageTag = `${registry}/${projectId}:${commitSha}`;

  return `
apiVersion: v1
kind: ConfigMap
metadata:
  name: build-config-${projectId}-${commitSha.slice(0, 8)}
  namespace: deployx-builder
data:
  REPO_URL: "${repoUrl}"
  BRANCH: "${branch}"
  IMAGE_TAG: "${imageTag}"
  REGISTRY: "${registry}"
`.trim();
}
