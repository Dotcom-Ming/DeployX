variable "environment" {
  description = "Environment name"
  type        = string
}

variable "s3_bucket_name" {
  description = "S3 bucket name for build artifacts"
  type        = string
}

variable "cluster_name" {
  description = "Cluster name for resource naming"
  type        = string
}
