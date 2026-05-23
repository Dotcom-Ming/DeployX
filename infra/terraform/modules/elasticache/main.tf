resource "aws_security_group" "redis" {
  name        = "${var.cluster_name}-${var.environment}-redis-sg"
  description = "Security group for ElastiCache Redis"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
    description = "Allow Redis access from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.cluster_name}-${var.environment}-redis-sg"
    Environment = var.environment
  }
}

resource "aws_elasticache_subnet_group" "main" {
  name        = "${var.cluster_name}-${var.environment}-redis-subnet"
  description = "Subnet group for ElastiCache Redis"
  subnet_ids  = var.private_subnet_ids

  tags = {
    Environment = var.environment
  }
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id          = "${var.cluster_name}-${var.environment}"
  replication_group_description = "DeployX Redis cluster for ${var.environment}"
  engine                        = "redis"
  engine_version                = "7.1"
  node_type                     = var.redis_node_type
  number_cache_clusters         = var.redis_num_nodes
  parameter_group_name          = "default.redis7"
  port                          = 6379

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  automatic_failover_enabled = var.redis_num_nodes > 1 ? true : false
  multi_az_enabled           = var.redis_num_nodes > 1 ? true : false

  snapshot_retention_limit = var.environment == "production" ? 7 : 1
  snapshot_window          = "04:00-05:00"

  tags = {
    Name        = "${var.cluster_name}-${var.environment}-redis"
    Environment = var.environment
  }
}
