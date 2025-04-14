variable "environment" {
    description = "The environment in which the resources are being created"
    type        = string
}

variable "project_name" {
    description = "The name of the project"
    type        = string
}

variable "region" {
    description = "The AWS region to deploy to"
    type        = string
}

variable "frontend_image" {
    description = "The image to use for the frontend container"
    type        = string
}

variable "backend_image" {
    description = "The image to use for the backend container"
    type        = string
}

variable "database_url" {
    description = "The URL of the database"
    type        = string
}

variable "private_subnet_ids" {
    description = "The IDs of the private subnets in which to place the ECS tasks"
    type        = list(string)
}

variable "frontend_sg_id" {
    description = "The ID of the security group to attach to the frontend ECS task"
    type        = string
}

variable "backend_sg_id" {
    description = "The ID of the security group to attach to the backend ECS task"
    type        = string
}

variable "alb_sg_id" {
    description = "The ID of the security group to attach to the ALB"
    type        = string
}

variable "ecs_task_execution_role" {
    description = "The ARN of the ECS task execution role"
    type        = string
}

variable "frontend_repository_url" {
    description = "The URL of the ECR repository for the frontend image"
    type        = string
}

variable "backend_repository_url" {
    description = "The URL of the ECR repository for the backend image"
    type        = string
}

variable "ecs_task_role_arn" {
    description = "The ARN of the ECS task role"
    type        = string
}

variable "db_username" {
    description = "The username to use when connecting to the database"
    type        = string
}

variable "db_password" {
    description = "The password to use when connecting to the database"
    type        = string
}

variable "frontend_target_group_arn" {
    description = "The ARN of the frontend target group to attach to the load balancer"
    type        = string
}

variable "backend_target_group_arn" {
    description = "The ARN of the backend target group to attach to the load balancer"
    type        = string
}

variable "cognito_user_pool_id" {
    description = "The ID of the Cognito user pool"
    type        = string
}

variable "cognito_client_id" {
    description = "The ID of the Cognito client"
    type        = string
}