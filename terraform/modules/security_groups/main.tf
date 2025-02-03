resource "aws_security_group" "alb_sg" {
    name = "${var.environment}-interview-prep-alb-sg"
    description = "Security group for the ALB. Managed by Terraform"
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
        from_port = 3000
        to_port = 3000
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
        Name = "${var.environment}-interview-prep-alb-sg"
        Environment = var.environment
    }
}

resource "aws_security_group" "frontend_sg" {
  name = "interview-prep-frontend-sg"
  description = "Managed by Terraform"
  vpc_id = var.vpc_id

    ingress {
        from_port = 80
        to_port = 80
        protocol = "tcp"
        security_groups = [aws_security_group.alb_sg.id]
    }

    ingress {
        from_port = 443
        to_port = 443
        protocol = "tcp"
        security_groups = [aws_security_group.alb_sg.id]
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
        security_groups = [aws_security_group.alb_sg.id]
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

resource "aws_security_group" "lambda_sg" {
    name = "${var.environment}-interview-prep-lambda-sg"
    description = "Managed by Terraform"
    vpc_id = var.vpc_id

    egress {
        from_port = 443
        to_port = 443
        protocol = "tcp"
        cidr_blocks = ["0.0.0.0/0"]
        description = "Allow outbound HTTPS traffic for SSM access"
    }

    egress {
        from_port = 5432
        to_port = 5432
        protocol = "tcp"
        security_groups = [aws_security_group.db_sg.id]
        description = "Allow outbound traffic to RDS"
    }

    tags = {
        Name = "${var.environment}-interview-prep-lambda-sg"
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
        cidr_blocks = [var.vpn_ip]  # Allow VPN
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

resource "aws_security_group_rule" "allow_lambda_to_db" {
    type = "ingress"
    from_port = 5432
    to_port = 5432
    protocol = "tcp"
    source_security_group_id = aws_security_group.lambda_sg.id
    security_group_id = aws_security_group.db_sg.id
    description = "Allow Lambda function to access the db"
}

resource "aws_security_group_rule" "allow_bastion_to_db" {
    type = "ingress"
    from_port = 5432
    to_port = 5432
    protocol = "tcp"
    source_security_group_id = aws_security_group.bastion_sg.id
    security_group_id = aws_security_group.db_sg.id
}

resource "aws_security_group_rule" "allow_backend_to_db" {
    type = "ingress"
    from_port = 5432
    to_port = 5432
    protocol = "tcp"
    source_security_group_id = aws_security_group.backend_sg.id
    security_group_id = aws_security_group.db_sg.id
    description = "Allow backend to access the db"
}