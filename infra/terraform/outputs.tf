output "cluster_endpoint" {
  description = "EKS cluster API endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "database_url" {
  description = "PostgreSQL connection URL"
  value       = "postgresql://${var.db_username}:****@${module.rds.cluster_endpoint}:5432/deployx"
  sensitive   = true
}

output "database_endpoint" {
  description = "RDS cluster endpoint"
  value       = module.rds.cluster_endpoint
}

output "redis_url" {
  description = "Redis connection URL"
  value       = "redis://${module.elasticache.primary_endpoint}:6379"
}

output "redis_primary_endpoint" {
  description = "ElastiCache primary endpoint"
  value       = module.elasticache.primary_endpoint
}

output "s3_bucket_name" {
  description = "S3 bucket for build artifacts"
  value       = module.s3.bucket_id
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = module.s3.bucket_arn
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "ecr_repository_urls" {
  description = "ECR repository URLs"
  value = {
    api      = "${aws_ecr_repository.api.repository_url}"
    builder  = "${aws_ecr_repository.builder.repository_url}"
    billing  = "${aws_ecr_repository.billing.repository_url}"
    gateway  = "${aws_ecr_repository.gateway.repository_url}"
    web      = "${aws_ecr_repository.web.repository_url}"
    admin    = "${aws_ecr_repository.admin.repository_url}"
  }
}
