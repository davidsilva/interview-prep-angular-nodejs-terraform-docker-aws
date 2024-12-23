variable "vpc_id" {
  description = "The ID of the VPC"
  type = string
}

variable "public_subnet_a_cidr" {
  description = "CIDR block for public subnet A"
  type = string
}

variable "public_subnet_b_cidr" {
  description = "CIDR block for public subnet B"
  type = string
}

variable "private_subnet_a_cidr" {
  description = "CIDR block for private subnet A"
  type = string
}

variable "private_subnet_b_cidr" {
  description = "CIDR block for private subnet B"
  type = string
}

variable "availability_zone_a" {
  description = "Availability zone for subnet A"
  type = string
}

variable "availability_zone_b" {
  description = "Availability zone for subnet B"
  type = string
}

variable "environment" {
  description = "The environment for the resources (e.g., development, staging, production)"
  type = string
}