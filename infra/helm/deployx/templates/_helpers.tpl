{{- define "deployx.name" -}}
deployx
{{- end -}}

{{- define "deployx.namespace" -}}
{{- .Values.namespace | default .Release.Namespace -}}
{{- end -}}

{{- define "deployx.labels" -}}
app.kubernetes.io/name: {{ include "deployx.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/part-of: deployx-platform
{{- end -}}
