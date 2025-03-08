variable "environment" {
    description = "The environment in which the resources are being created"
    type        = string
  
}

variable "region" {
    description = "The AWS region to deploy to"
    default     = "us-east-1"
}

variable "account_id" {
    description = "The AWS account ID"
    type        = string
}
