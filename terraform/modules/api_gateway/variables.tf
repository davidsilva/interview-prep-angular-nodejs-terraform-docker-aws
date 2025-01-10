variable "environment" {
  description = "The environment to deploy the resources to"
  type        = string
}

variable "region" {
  description = "The region to deploy the resources to"
  type        = string
}

variable "cloudwatch_role_arn" {
  description = "The ARN of the CloudWatch role"
  type        = string
}

variable "lb_dns_name" {
  description = "The DNS name of the load balancer"
  type        = string
}

variable "certificate_arn" {
  description = "The ARN of the certificate to use for the custom domain"
  type        = string
}