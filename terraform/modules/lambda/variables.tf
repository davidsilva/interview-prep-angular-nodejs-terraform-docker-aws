variable "environment" {
  description = "Environment name"
  type        = string  
}

variable "function_name" {
  description = "Name of the lambda function"
  type        = string
}

variable "handler" {
  description = "Handler for the lambda function"
  type        = string
}

variable "runtime" {
  description = "Runtime for the lambda function"
  type        = string
}

variable "lambda_package" {
  description = "Path to the lambda zip file"
  type        = string
}

variable "lambda_subnet_ids" {
  description = "Subnet ids for the lambda function"
  type        = list(string)
}

variable "lambda_sg_id" {
  description = "Security group id for the lambda function"
  type        = string
}

variable "lambda_exec_role_arn" {
  description = "ARN of the role for the lambda function"
  type        = string
}

variable "timeout" {
  description = "Timeout for the lambda function"
  type        = number  
}

variable "memory_size" {
  description = "Memory size for the lambda function"
  type        = number
}

variable "environment_variables" {
  description = "Environment variables for the lambda function"
  type        = map(string)
  default = {}
}