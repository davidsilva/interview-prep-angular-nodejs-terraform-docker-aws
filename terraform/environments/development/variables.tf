variable "project_name" {
    description = "The name of the project"
    type = string
    default = "interview-prep"
}

variable "account_id" {
    description = "The AWS account ID"
    type = string
}

variable "region" {
  description = "The AWS region to deploy to"
  default     = "us-east-1"
}

variable "profile" {
  description = "The AWS profile to use"
  default     = "aws-cli-user"
}

variable "environment" {
  description = "The environment for the resources (e.g., development, staging, production)"
  type = string
  default = "development"
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

variable "vpc_cidr" {
    description = "CIDR block for the VPC"
    type = string
    default = "10.0.0.0/16"
}

variable "public_subnet_a_cidr" {
    description = "CIDR block for public subnet A"
    type = string
    default = "10.0.1.0/24"
}

variable "public_subnet_b_cidr" {
    description = "CIDR block for public subnet B"
    type = string
    default = "10.0.2.0/24"
}

variable "private_subnet_a_cidr" {
    description = "CIDR block for private subnet A"
    type = string
    default = "10.0.3.0/24"
}

variable "private_subnet_b_cidr" {
    description = "CIDR block for private subnet B"
    type = string
    default = "10.0.4.0/24"
}

variable "availability_zone_a" {
    description = "Availability zone for subnet A"
    type = string
    default = "us-east-1a"
}

variable "availability_zone_b" {
    description = "Availability zone for subnet B"
    type = string
    default = "us-east-1b"
}

variable "vpn_ip" {
    description = "The IP address and subnet mask of the VPN, e.g., 22.146.171.139/32"
    type = string
}

variable "bastion_ami" {
    description = "The AMI ID for the bastion host"
    type = string
    default = "" # Update with the latest Amazon Linux 2 AMI ID
}

variable "bastion_instance_type" {
    description = "The instance type for the bastion host"
    type = string
}

variable "key_name" {
    description = "The name of the key pair to use for the bastion host"
    type = string
}

variable "lambda_package_migrate" {
    description = "The path to the ZIP file containing the Lambda function code"
    type = string
}

variable "certificate_arn" {
    description = "The ARN of the certificate to use for the custom domain"
    type = string
}

variable "lambda_package_get_api_key" {
    description = "The path to the ZIP file containing the Lambda function code"
    type = string
}