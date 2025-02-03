resource "aws_ecr_repository" "frontend" {
  name = "interview-prep-frontend"
  image_tag_mutability = "MUTABLE" # Allows using a tag like "latest" to refer to the latest version of the image.
  # Allows you to enable or disable automatic scanning of container images for vulnerabilities when they are pushed to the repository.
  image_scanning_configuration {
    scan_on_push = true # Images are automatically scanned for vulnerabilities when they are pushed to the repository.
  }

    tags = {
        Name = "interview-prep-frontend"
        Environment = var.environment
    }
}

resource "aws_ecr_repository" "backend" {
  name = "interview-prep-backend"
  image_tag_mutability = "MUTABLE"
  # Allows you to enable or disable automatic scanning of container images for vulnerabilities when they are pushed to the repository.
  image_scanning_configuration {
    scan_on_push = true # Images are automatically scanned for vulnerabilities when they are pushed to the repository.
  }

    tags = {
        Name = "interview-prep-backend"
        Environment = var.environment
    }
}