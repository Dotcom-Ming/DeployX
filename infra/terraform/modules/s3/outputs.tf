output "bucket_id" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.artifacts.id
}

output "bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.artifacts.arn
}

output "bucket_region" {
  description = "S3 bucket region"
  value       = aws_s3_bucket.artifacts.region
}
