resource "aws_ecs_cluster" "main" {
    name = "${var.environment}-${var.project_name}-ecs-cluster"
}

resource "aws_ecs_task_definition" "frontend" {
    family                   = "${var.environment}-frontend-ecs-task"
    // "awsvpc" mode provides each task with its own elastic network interface (ENI)
    // and a primary private IP address, allowing tasks to have full networking features
    network_mode             = "awsvpc"
    // Specifies that the task requires Fargate launch type
    // Fargate is a serverless compute engine for containers that works with ECS
    requires_compatibilities = ["FARGATE"]
    cpu                      = "256"
    memory                   = "512"
    execution_role_arn = var.ecs_task_execution_role
    # task_role_arn is used for task-level permissions, e.g., AmazonS3ReadOnlyAccess, AmazonSSMReadOnlyAccess. It allows the ECS tasks to interact with other AWS services.
    task_role_arn = var.ecs_task_role_arn

    container_definitions = jsonencode([
        {
            name = "frontend"
            image = "${var.frontend_repository_url}:latest"
            # If this container stops or fails, the entire task is considered to have failed, and ECS will stop all other containers in the task.
            essential = true
            portMappings = [
                {
                    containerPort = 80
                    hostPort      = 80
                    protocol      = "tcp"
                }
            ],
            logConfiguration = {
                logDriver = "awslogs"
                options = {
                    "awslogs-group" = "/ecs/${var.environment}-ecs-log-group"
                    "awslogs-region" = var.region
                    "awslogs-stream-prefix" = "frontend"
                }
            },
            environment = [
                {
                    name = "NODE_ENV"
                    value = "development"
                }
            ],
            linuxParameters = {
                # An init process is run inside the container.
                # The init process handles reaping zombie processes, which are child processes that have completed execution but still have an entry in the process table.
                # This can help prevent resource leaks and ensure that the container environment remains clean and efficient.
                initProcessEnabled = true
            }
        }
    ])
}

resource "aws_ecs_task_definition" "backend" {
    family                   = "${var.environment}-backend-ecs-task"
    // "awsvpc" mode provides each task with its own elastic network interface (ENI)
    // and a primary private IP address, allowing tasks to have full networking features
    network_mode             = "awsvpc"
    // Specifies that the task requires Fargate launch type
    // Fargate is a serverless compute engine for containers that works with ECS
    requires_compatibilities = ["FARGATE"]
    cpu                      = "256"
    memory                   = "512"
    execution_role_arn = var.ecs_task_execution_role
    # task_role_arn is used for task-level permissions, e.g., AmazonS3ReadOnlyAccess, AmazonSSMReadOnlyAccess. It allows the ECS tasks to interact with other AWS services.
    task_role_arn = var.ecs_task_role_arn

    container_definitions = jsonencode([
        {
            name = "backend"
            image = "${var.backend_repository_url}"
            # If this container stops or fails, the entire task is considered to have failed, and ECS will stop all other containers in the task.
            essential = true
            portMappings = [
                {
                    containerPort = 3000
                    hostPort      = 3000
                    protocol      = "tcp"
                }
            ],
            environment = [
                {
                    name = "DATABASE_URL"
                    value = "postgres://${var.db_username}:${var.db_password}@${var.database_url}/interview_prep_db"
                },
                {
                    name = "NODE_ENV"
                    value = "development"
                }
            ]
            logConfiguration = {
                logDriver = "awslogs"
                options = {
                    "awslogs-group" = "/ecs/${var.environment}-ecs-log-group"
                    "awslogs-region" = var.region
                    "awslogs-stream-prefix" = "backend"
                }
            },
            linuxParameters = {
                # An init process is run inside the container.
                # The init process handles reaping zombie processes, which are child processes that have completed execution but still have an entry in the process table.
                # This can help prevent resource leaks and ensure that the container environment remains clean and efficient.
                initProcessEnabled = true
            }
        }
    ])
}

resource "aws_ecs_service" "frontend" {
    name            = "${var.environment}-${var.project_name}-frontend-ecs-service"
    cluster         = aws_ecs_cluster.main.id
    task_definition = aws_ecs_task_definition.frontend.arn
    desired_count   = 1
    launch_type = "FARGATE"

    network_configuration {
        subnets          = var.private_subnet_ids
        security_groups  = [var.frontend_sg_id, var.alb_sg_id]
        assign_public_ip = false
    }

    load_balancer {
        target_group_arn = var.frontend_target_group_arn
        container_name   = "frontend"
        container_port   = 80
    }

    # You can use the ecs execute-command feature to run commands inside your containers.
    # This is useful for debugging, troubleshooting, and managing your containers without needing SSH access or exposing additional ports.
    enable_execute_command = true
}

resource "aws_ecs_service" "backend" {
    name            = "${var.environment}-${var.project_name}-backend-ecs-service"
    cluster         = aws_ecs_cluster.main.id
    task_definition = aws_ecs_task_definition.backend.arn
    desired_count   = 1
    launch_type = "FARGATE"

    network_configuration {
        subnets         = var.private_subnet_ids
        security_groups = [var.backend_sg_id, var.alb_sg_id]
        assign_public_ip = false
    }

    load_balancer {
        target_group_arn = var.backend_target_group_arn
        container_name   = "backend"
        container_port   = 3000
    }

    # You can use the ecs execute-command feature to run commands inside your containers.
    # This is useful for debugging, troubleshooting, and managing your containers without needing SSH access or exposing additional ports.
    enable_execute_command = true
}

resource "aws_cloudwatch_log_group" "ecs_log_group" {
    name = "/ecs/${var.environment}-ecs-log-group"
    retention_in_days = 7

    tags = {
        Name = "${var.environment}-ecs-log-group"
        Environment = var.environment
    }
}