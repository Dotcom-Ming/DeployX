resource "aws_db_subnet_group" "main" {
  name       = "${var.cluster_name}-${var.environment}-db-subnet"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name        = "${var.cluster_name}-${var.environment}-db-subnet-group"
    Environment = var.environment
  }
}

resource "aws_security_group" "rds" {
  name        = "${var.cluster_name}-${var.environment}-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
    description = "Allow PostgreSQL access from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.cluster_name}-${var.environment}-rds-sg"
    Environment = var.environment
  }
}

resource "aws_rds_cluster" "main" {
  cluster_identifier     = "${var.cluster_name}-${var.environment}"
  engine                 = "aurora-postgresql"
  engine_version         = "16.1"
  database_name          = "deployx"
  master_username        = var.db_username
  master_password        = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  storage_encrypted = true

  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"

  deletion_protection = var.environment == "production" ? true : false

  skip_final_snapshot       = var.environment == "production" ? false : true
  final_snapshot_identifier  = "${var.cluster_name}-${var.environment}-final-snapshot"

  tags = {
    Name        = "${var.cluster_name}-${var.environment}-aurora"
    Environment = var.environment
  }
}

resource "aws_rds_cluster_instance" "main" {
  count                      = var.environment == "production" ? 2 : 1
  identifier                 = "${var.cluster_name}-${var.environment}-${count.index + 1}"
  cluster_identifier         = aws_rds_cluster.main.id
  instance_class              = var.db_instance_class
  engine                     = aws_rds_cluster.main.engine
  engine_version             = aws_rds_cluster.main.engine_version
  db_subnet_group_name       = aws_db_subnet_group.main.name
  performance_insights_enabled = true

  tags = {
    Name        = "${var.cluster_name}-${var.environment}-instance-${count.index + 1}"
    Environment = var.environment
  }
}
