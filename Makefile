SHELL := /bin/bash

.PHONY: k8s-apply-core k8s-apply-monitoring k8s-apply-observability k8s-apply-backup k8s-apply-all
.PHONY: helm-template helm-install

k8s-apply-core:
	kubectl apply -f infra/k8s/namespace.yaml
	kubectl apply -f infra/k8s/postgres/service.yaml
	kubectl apply -f infra/k8s/postgres/statefulset.yaml
	kubectl apply -f infra/k8s/redis/service.yaml
	kubectl apply -f infra/k8s/redis/statefulset.yaml
	kubectl apply -f infra/k8s/api/service.yaml
	kubectl apply -f infra/k8s/api/deployment.yaml
	kubectl apply -f infra/k8s/api/hpa.yaml
	kubectl apply -f infra/k8s/builder/service.yaml
	kubectl apply -f infra/k8s/builder/deployment.yaml
	kubectl apply -f infra/k8s/billing/service.yaml
	kubectl apply -f infra/k8s/billing/deployment.yaml
	kubectl apply -f infra/k8s/gateway/service.yaml
	kubectl apply -f infra/k8s/gateway/deployment.yaml
	kubectl apply -f infra/k8s/web/service.yaml
	kubectl apply -f infra/k8s/web/deployment.yaml
	kubectl apply -f infra/k8s/traefik/service.yaml
	kubectl apply -f infra/k8s/traefik/deployment.yaml
	kubectl apply -f infra/k8s/traefik/ingressroute.yaml
	kubectl apply -f infra/k8s/cert-manager/cluster-issuer.yaml
	kubectl apply -f infra/k8s/cert-manager/certificate.yaml

k8s-apply-monitoring:
	kubectl apply -f infra/k8s/monitoring/prometheus-config.yaml
	kubectl apply -f infra/k8s/monitoring/prometheus-rules-config.yaml
	kubectl apply -f infra/k8s/monitoring/prometheus-deployment.yaml
	kubectl apply -f infra/k8s/monitoring/loki.yaml
	kubectl apply -f infra/k8s/monitoring/grafana-config.yaml
	kubectl apply -f infra/k8s/monitoring/grafana-deployment.yaml
	kubectl apply -f infra/k8s/monitoring/alertmanager-config.yaml
	kubectl apply -f infra/k8s/monitoring/alertmanager-deployment.yaml

k8s-apply-observability:
	kubectl apply -f infra/k8s/observability/jaeger.yaml
	kubectl apply -f infra/k8s/observability/otel-collector-config.yaml
	kubectl apply -f infra/k8s/observability/otel-collector-deployment.yaml

k8s-apply-backup:
	kubectl apply -f infra/k8s/postgres/backup-cronjob.yaml

k8s-apply-all: k8s-apply-core k8s-apply-monitoring k8s-apply-observability k8s-apply-backup

helm-template:
	helm template deployx infra/helm/deployx --namespace deployx

helm-install:
	helm upgrade --install deployx infra/helm/deployx --namespace deployx --create-namespace
