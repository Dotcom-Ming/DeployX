# ---- VPC ----
module "vpc" {
  source = "./modules/vpc"

  environment         = var.environment
  vpc_cidr            = var.vpc_cidr
  availability_zones  = var.availability_zones
  cluster_name        = var.cluster_name
}

# ---- EKS ----
module "eks" {
  source = "./modules/eks"

  environment       = var.environment
  cluster_name      = var.cluster_name
  cluster_version   = var.cluster_version
  vpc_id            = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  public_subnet_ids  = module.vpc.public_subnet_ids
  node_instance_type = var.node_instance_type
  node_desired_size  = var.node_desired_size
  node_min_size      = var.node_min_size
  node_max_size      = var.node_max_size
}

# ---- RDS ----
module "rds" {
  source = "./modules/rds"

  environment         = var.environment
  vpc_id              = module.vpc.vpc_id
  private_subnet_ids  = module.vpc.private_subnet_ids
  db_instance_class   = var.db_instance_class
  db_allocated_storage = var.db_allocated_storage
  db_username         = var.db_username
  db_password         = var.db_password
  cluster_name        = var.cluster_name
}

# ---- ElastiCache ----
module "elasticache" {
  source = "./modules/elasticache"

  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  redis_node_type    = var.redis_node_type
  redis_num_nodes    = var.redis_num_nodes
  cluster_name       = var.cluster_name
}

# ---- S3 ----
module "s3" {
  source = "./modules/s3"

  environment      = var.environment
  s3_bucket_name   = "${var.s3_bucket_name}-${var.environment}"
  cluster_name     = var.cluster_name
}

# ---- ECR Repositories ----
resource "aws_ecr_repository" "api" {
  name                 = "deployx/api"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "builder" {
  name                 = "deployx/builder"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "billing" {
  name                 = "deployx/billing"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "gateway" {
  name                 = "deployx/gateway"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "web" {
  name                 = "deployx/web"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "admin" {
  name                 = "deployx/admin"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

# ---- ECR Lifecycle Policies ----
resource "aws_ecr_lifecycle_policy" "api" {
  repository = aws_ecr_repository.api.name
  policy     = data.aws_ecr_lifecycle_policy_document.default.json
}

resource "aws_ecr_lifecycle_policy" "builder" {
  repository = aws_ecr_repository.builder.name
  policy     = data.aws_ecr_lifecycle_policy_document.default.json
}

resource "aws_ecr_lifecycle_policy" "billing" {
  repository = aws_ecr_repository.billing.name
  policy     = data.aws_ecr_lifecycle_policy_document.default.json
}

resource "aws_ecr_lifecycle_policy" "gateway" {
  repository = aws_ecr_repository.gateway.name
  policy     = data.aws_ecr_lifecycle_policy_document.default.json
}

resource "aws_ecr_lifecycle_policy" "web" {
  repository = aws_ecr_repository.web.name
  policy     = data.aws_ecr_lifecycle_policy_document.default.json
}

resource "aws_ecr_lifecycle_policy" "admin" {
  repository = aws_ecr_repository.admin.name
  policy     = data.aws_ecr_lifecycle_policy_document.default.json
}

data "aws_ecr_lifecycle_policy_document" "default" {
  rule {
    priority     = 1
    description  = "Keep last 30 tagged images"
    selection {
      tag_status   = "tagged"
      count_type   = "imageCountMoreThan"
      count_number = 30
    }
  }

  rule {
    priority     = 2
    description  = "Remove untagged images older than 7 days"
    selection {
      tag_status   = "untagged"
      count_type   = "sinceImagePushed"
      count_unit   = "days"
      count_number = 7
    }
  }
}
