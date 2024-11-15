resource "aws_security_group" "frontend_sg" {
  name = "interview-prep-frontend-sg"
  description = "Managed by Terraform"
  vpc_id = var.vpc_id

    ingress {
        from_port = 80
        to_port = 80
        protocol = "tcp"
        cidr_blocks = ["0.0.0.0/0"]
    }

    ingress {
        from_port = 443
        to_port = 443
        protocol = "tcp"
        cidr_blocks = ["0.0.0.0/0"]
    }

    ingress {
        from_port = 22
        to_port = 22
        protocol = "tcp"
        security_groups = [aws_security_group.bastion_sg.id]
    }

    egress {
        from_port = 0
        to_port = 0
        protocol = "-1"
        cidr_blocks = ["0.0.0.0/0"]
    }

  tags = {
    Name = "internet-prep-frontend-sg"
    Environment = var.environment
  }
}

resource "aws_security_group" "backend_sg" {
    name = "interview-prep-backend-sg"
    description = "Managed by Terraform"
    vpc_id = var.vpc_id

    ingress {
        from_port = 3000
        to_port = 3000
        protocol = "tcp"
        security_groups = [aws_security_group.frontend_sg.id]
    }

    ingress {
        from_port = 22
        to_port = 22
        protocol = "tcp"
        security_groups = [aws_security_group.bastion_sg.id]
    }

    egress {
        from_port = 0
        to_port = 0
        protocol = "-1"
        cidr_blocks = ["0.0.0.0/0"]
    }

    tags = {
        Name = "interview-prep-backend-sg"
        Environment = var.environment
    }
}

resource "aws_security_group" "db_sg" {
    name = "interview-prep-db-sg"
    description = "Managed by Terraform"
    vpc_id = var.vpc_id

    ingress {
        from_port = 5432
        to_port = 5432
        protocol = "tcp"
        security_groups = [aws_security_group.backend_sg.id, aws_security_group.bastion_sg.id]
    }

    egress {
        from_port = 0
        to_port = 0
        protocol = "-1"
        cidr_blocks = ["0.0.0.0/0"]
    }

    tags = {
        Name = "interview-prep-db-sg"
        Environment = var.environment
    }
}

resource "aws_security_group" "bastion_sg" {
    name = "interview-prep-bastion-sg"
    description = "Managed by Terraform"
    vpc_id = var.vpc_id

    ingress {
        from_port = 22
        to_port = 22
        protocol = "tcp"
        cidr_blocks = ["0.0.0.0/0"]
    }

    egress {
        from_port = 0
        to_port = 0
        protocol = "-1"
        cidr_blocks = ["0.0.0.0/0"]
    }

    tags = {
        Name = "interview-prep-bastion-sg"
        Environment = var.environment
    }
}
