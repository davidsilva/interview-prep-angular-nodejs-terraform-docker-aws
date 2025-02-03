variable "vpc_id" {
    description = "The ID of the VPC"
    type = string
}

variable "private_subnet_ids" {
    description = "The IDs of the private subnets"
    type = list(string)
}

variable "db_username" {
    description = "Username for interview prep postgres db"
    type = string
    sensitive = true
}

variable "db_password" {
    description = "Password for interview prep postgres db"
    type = string
    sensitive = true
}

variable "db_sg_id" {
    description = "The ID of the security group for the RDS instance"
    type = string
}

variable "environment" {
    description = "The environment for the resources (e.g., development, staging, production)"
    type = string
}