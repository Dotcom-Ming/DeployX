output "primary_endpoint" {
  description = "ElastiCache primary endpoint"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "reader_endpoint" {
  description = "ElastiCache reader endpoint"
  value       = aws_elasticache_replication_group.main.reader_endpoint_address
}

output "security_group_id" {
  description = "Security group ID for ElastiCache"
  value       = aws_security_group.redis.id
}
