resource "aws_iam_role" "ecs_task_execution_role" {
    name = "${var.environment}-ecs-task-execution-role"
    assume_role_policy = jsonencode({
        Version = "2012-10-17",
        Statement = [
        {
            Effect = "Allow",
            Principal = {
            Service = "ecs-tasks.amazonaws.com"
            },
            Action = "sts:AssumeRole"
        }
        ]
    })
    tags = {
        Name        = "interview-prep-ecs-task-execution-role"
        Environment = var.environment
    }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
    role       = aws_iam_role.ecs_task_execution_role.name
    policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy_attachment" "ecr_pull_policy" {
    role       = aws_iam_role.ecs_task_execution_role.name
    policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_role" "ecs_task_role" {
    name = "${var.environment}-ecs-task-role"
    assume_role_policy = jsonencode({
        Version = "2012-10-17",
        Statement = [
            {
                Effect = "Allow",
                Principal = {
                    Service = "ecs-tasks.amazonaws.com"
                },
                Action = "sts:AssumeRole"
            }
        ]
    })
    tags = {
        Name        = "interview-prep-ecs-task-role"
        Environment = var.environment
    }
}

resource "aws_iam_role_policy_attachment" "ecs_task_role_policy" {
    role       = aws_iam_role.ecs_task_role.name
    policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy_attachment" "ecs_task_role_ssm_policy" {
    role       = aws_iam_role.ecs_task_role.name
    policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role" "lambda_exec" {
    name = "${var.environment}-interview-prep-lambda-exec"
    assume_role_policy = jsonencode({
        Version = "2012-10-17",
        Statement = [
            {
                Effect = "Allow",
                Principal = {
                    Service = "lambda.amazonaws.com"
                },
                Action = "sts:AssumeRole"
            }
        ]
    })
    tags = {
        Name        = "interview-prep-lambda-exec"
        Environment = var.environment
    }
}

resource "aws_iam_policy" "lambda_exec_policy" {
    name = "${var.environment}-interview-prep-lambda-exec-policy"
    description = "Policy for Lambda execution role"
    policy = jsonencode({
        Version = "2012-10-17",
        Statement = [
            {
                Effect = "Allow",
                Action = [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                Resource = "arn:aws:logs:*:*:*"
            },
            {
                Effect = "Allow",
                Action = [
                    "ec2:CreateNetworkInterface",
                    "ec2:DescribeNetworkInterfaces",
                    "ec2:DeleteNetworkInterface"
                ],
                Resource = "*"
            },
            {
                Effect = "Allow",
                Action = [
                    "ssm:Describe*",
                    "ssm:GetParameter",
                    "ssm:GetParameters",
                    "ssm:GetParametersByPath",
                    "ssm:GetParameterHistory",
                    "ssm:List*"
                ],
                Resource = [
                    "arn:aws:ssm:${var.region}:${var.account_id}:parameter/interview-prep/${var.environment}/*"
                ]
            },
            {
                Effect = "Allow",
                Action = [
                    "kms:Decrypt"
                ],
                Resource = "arn:aws:kms:${var.region}:${var.account_id}:key/169ce983-7b59-4ff6-9c74-533af48cf478"
            },
            # {
            #     "Effect": "Allow",
            #     "Action": [
            #         "rds-db:connect"
            #     ],
            #     "Resource": "arn:aws:rds:us-east-1:909500381447:db:development-interview-prep-db"
            # }
        ]
    })
}

resource "aws_iam_role_policy_attachment" "lambda_exec_policy_attachment" {
    role       = aws_iam_role.lambda_exec.name
    policy_arn = aws_iam_policy.lambda_exec_policy.arn
}

resource "aws_iam_role" "vpc_flow_log_role" {
    name = "vpc-flow-log-role"

    assume_role_policy = jsonencode({
        Version = "2012-10-17",
        Statement = [
            {
                Effect = "Allow",
                Principal = {
                    Service = "vpc-flow-logs.amazonaws.com"
                },
                Action = "sts:AssumeRole"
            }
        ]
    })

    tags = {
        Name        = "interview-prep-vpc-flow-log-role"
        Environment = var.environment
    }
}

resource "aws_iam_policy" "vpc_flow_log_policy" {
    name = "vpc-flow-log-policy" 
    description = "Policy for VPC Flow Logs"

    policy = jsonencode(({
        Version = "2012-10-17",
        Statement = [
            {
                Effect = "Allow",
                Action = [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                Resource = "*"
            },
        ]
    }))

    tags = {
        Name        = "interview-prep-vpc-flow-log-policy"
        Environment = var.environment
    }
}

resource "aws_iam_role_policy_attachment" "vpc_flow_log_role_policy" {
    role       = aws_iam_role.vpc_flow_log_role.name
    policy_arn = aws_iam_policy.vpc_flow_log_policy.arn
}

resource "aws_iam_role" "github_actions_role" {
    name = "${var.environment}-github-actions-role"
    assume_role_policy = jsonencode({
        Version = "2012-10-17",
        Statement = [
            {
                Effect = "Allow",
                Principal = {
                    Federated = "arn:aws:iam::${var.account_id}:oidc-provider/token.actions.githubusercontent.com"
                },
                Action = "sts:AssumeRoleWithWebIdentity",
                Condition = {
                    StringEquals = {
                        "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
                    },
                    StringLike = {
                        "token.actions.githubusercontent.com:sub" = "repo:davidsilva/interview-prep-angular-nodejs-terraform-docker-aws:*"
                    }
                }
            }
        ]
    })
    tags = {
        Name        = "interview-prep-github-actions-role"
        Environment = var.environment
    }
}
# Should rename this to something more descriptive.
resource "aws_iam_policy" "github_actions_policy" {
    name = "${var.environment}-github-actions-policy"
    description = "Policy for GitHub Actions"
    policy = jsonencode({
        Version = "2012-10-17",
        Statement = [
            {
                Effect = "Allow",
                Action = [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "lambda:UpdateFunctionCode",
                    "lambda:InvokeFunction",
                    "lambda:GetFunctionConfiguration"
                ],
                Resource = [
                    "arn:aws:logs:*:*:*",
                    "arn:aws:lambda:${var.region}:${var.account_id}:function:${var.environment}-interview-prep-migrate"
                ]
            }
        ]
    })
}

resource "aws_iam_role_policy_attachment" "github_actions_policy_attachment" {
    role       = aws_iam_role.github_actions_role.name
    policy_arn = aws_iam_policy.github_actions_policy.arn
}

resource "aws_iam_role_policy_attachment" "ecr_full_access_attachment" {
    role       = aws_iam_role.github_actions_role.name
    policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess"
}

resource "aws_iam_role_policy_attachment" "ecs_full_access_attachment" {
    role       = aws_iam_role.github_actions_role.name
    policy_arn = "arn:aws:iam::aws:policy/AmazonECS_FullAccess"
}
