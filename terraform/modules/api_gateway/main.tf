resource "aws_api_gateway_rest_api" "api" {
  name        = "${var.environment}-interview-prep-api"
  description = "API Gateway for Interview Prep ${var.environment} environment"
}

resource "aws_api_gateway_usage_plan" "api_usage_plan" {
  name = "${var.environment}-interview-prep-api-usage-plan"
  description = "Usage plan for Interview Prep ${var.environment} environment"

  api_stages {
    api_id = aws_api_gateway_rest_api.api.id
    stage = aws_api_gateway_stage.api_stage.stage_name
  }

  product_code = "interview-prep"

  quota_settings {
    limit = 10000 # Maximum number of requests allowed
    offset = 2 # Number of requests to subtract from the limit at the start of each period
    period = "MONTH" # The time period in which the limit applies (DAY, WEEK, MONTH)
  }

  throttle_settings {
    burst_limit = 100 # Maximum number of requests allowed in a short period of time (a few seconds)
    rate_limit = 50 # Steady-state rate of requests per second
  }
}

resource "aws_api_gateway_resource" "health" {
    rest_api_id = aws_api_gateway_rest_api.api.id
    parent_id   = aws_api_gateway_rest_api.api.root_resource_id
    path_part   = "health"
}

resource "aws_api_gateway_method" "health_get" {
    rest_api_id = aws_api_gateway_rest_api.api.id
    resource_id = aws_api_gateway_resource.health.id
    http_method = "GET"
    authorization = "NONE"
    api_key_required = false
}

resource "aws_api_gateway_integration" "health_integration" {
    rest_api_id = aws_api_gateway_rest_api.api.id
    resource_id = aws_api_gateway_resource.health.id
    http_method = aws_api_gateway_method.health_get.http_method
    type = "HTTP_PROXY"
    integration_http_method = "GET"
    uri = "http://${var.lb_dns_name}:3000/health"
}

resource "aws_api_gateway_integration_response" "health_integration_response" {
    rest_api_id = aws_api_gateway_rest_api.api.id
    resource_id = aws_api_gateway_resource.health.id
    http_method = aws_api_gateway_method.health_get.http_method
    status_code = "200"
}

resource "aws_api_gateway_method_response" "health_response" {
    rest_api_id = aws_api_gateway_rest_api.api.id
    resource_id = aws_api_gateway_resource.health.id
    http_method = aws_api_gateway_method.health_get.http_method
    status_code = "200"
}

resource "aws_api_gateway_resource" "v0" {
    rest_api_id = aws_api_gateway_rest_api.api.id
    parent_id   = aws_api_gateway_rest_api.api.root_resource_id
    path_part   = "v0"
}

resource "aws_api_gateway_resource" "proxy" {
    rest_api_id = aws_api_gateway_rest_api.api.id
    parent_id   = aws_api_gateway_resource.v0.id
    path_part   = "{proxy+}"

    depends_on = [ aws_api_gateway_rest_api.api ] # Ensure the API is created before creating the resource.
}

resource "aws_api_gateway_method" "proxy_options" {
    rest_api_id = aws_api_gateway_rest_api.api.id
    resource_id = aws_api_gateway_resource.proxy.id
    http_method = "OPTIONS"
    authorization = "NONE"
    api_key_required = false
}

resource "aws_api_gateway_method_response" "proxy_options_response" {
    rest_api_id = aws_api_gateway_rest_api.api.id
    resource_id = aws_api_gateway_resource.proxy.id
    http_method = aws_api_gateway_method.proxy_options.http_method
    status_code = "200"
    response_parameters = {
      "method.response.header.Access-Control-Allow-Origin" = true
      "method.response.header.Access-Control-Allow-Headers" = true
      "method.response.header.Access-Control-Allow-Methods" = true
    }
}

resource "aws_api_gateway_integration" "proxy_options_integration" {
    rest_api_id = aws_api_gateway_rest_api.api.id
    resource_id = aws_api_gateway_resource.proxy.id
    http_method = aws_api_gateway_method.proxy_options.http_method
    type = "MOCK"
    request_templates = {
      "application/json" = "{\"statusCode\": 200}"
    }
}

resource "aws_api_gateway_integration_response" "proxy_options_integration_response" {
    rest_api_id = aws_api_gateway_rest_api.api.id
    resource_id = aws_api_gateway_resource.proxy.id
    http_method = aws_api_gateway_method.proxy_options.http_method
    status_code = "200"
    response_parameters = {
      "method.response.header.Access-Control-Allow-Origin" = "'${var.cors_origin}'"
      "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'"
      "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,PUT,PATCH,POST,DELETE'"
    }
}

resource "aws_api_gateway_method" "proxy_method" {
    rest_api_id = aws_api_gateway_rest_api.api.id
    resource_id = aws_api_gateway_resource.proxy.id
    http_method = "ANY" # Handle every type of HTTP request
    authorization = "NONE" # No authorization required (yet)
    api_key_required = false
    request_parameters = {
      "method.request.path.proxy" = true,
    }
}

# resource "aws_api_gateway_method_response" "proxy_response" {
#     rest_api_id = aws_api_gateway_rest_api.api.id
#     resource_id = aws_api_gateway_resource.proxy.id
#     http_method = aws_api_gateway_method.proxy_method.http_method
#     status_code = "200"
#     response_parameters = {
#       "method.response.header.Access-Control-Allow-Origin" = true
#       "method.response.header.Access-Control-Allow-Headers" = true
#       "method.response.header.Access-Control-Allow-Methods" = true
#     }
# }

resource "aws_api_gateway_integration" "proxy_integration" {
    rest_api_id = aws_api_gateway_rest_api.api.id
    resource_id = aws_api_gateway_resource.proxy.id
    http_method = aws_api_gateway_method.proxy_method.http_method
    type = "HTTP_PROXY" # Might change to HTTP_PROXY
    integration_http_method = "ANY"
    # Load balancer knows that port 3000 is the backend application
    uri = "http://${var.lb_dns_name}:3000/{proxy}"
    request_parameters = {
      "integration.request.path.proxy" = "method.request.path.proxy"
    }
    timeout_milliseconds = 29000
}

# resource "aws_api_gateway_integration_response" "proxy_integration_response" {
#     rest_api_id = aws_api_gateway_rest_api.api.id
#     resource_id = aws_api_gateway_resource.proxy.id
#     http_method = aws_api_gateway_method.proxy_method.http_method
#     status_code = "200"
#     response_parameters = {
#       "method.response.header.Access-Control-Allow-Origin" = "'${var.cors_origin}'"
#       "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'"
#       "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,PUT,PATCH,POST,DELETE'"
#     }
# }

# custom_domain_name and custom_domain_zone_id are output and used in the dns module.
resource "aws_api_gateway_domain_name" "custom_domain" {
  domain_name = "api.dev.interviewprep.onyxdevtutorials.com"

  endpoint_configuration {
    types = ["EDGE"] # The endpoint type (EDGE, REGIONAL, or PRIVATE)
  }

  certificate_arn = var.certificate_arn # The ARN of the SSL certificate to use for the custom domain.
}

resource "aws_api_gateway_method_settings" "api_method_settings" {
    rest_api_id = aws_api_gateway_rest_api.api.id
    stage_name = aws_api_gateway_stage.api_stage.stage_name
    method_path = "*/*" # The path and method for which these settings apply. The format is HTTP_METHOD/RESOURCE_PATH. You can use */* to apply the settings to all methods and resources.
    settings {
        metrics_enabled = true # Enable CloudWatch metrics for the method.
        logging_level = "INFO" # E.g., INFO, ERROR
        data_trace_enabled = true # Can generate a large volume of log data, especially for APIs with high traffic or large payloads.
    }
}

resource "aws_api_gateway_deployment" "api_deployment" {
    rest_api_id = aws_api_gateway_rest_api.api.id

    # This effectively triggers a redeployment whenever I do `terraform apply`, even if there are no actual changes to the configuration. I need to experiment with this setting.
    triggers = {
      redeployment = "${timestamp()}"
    }

    # Minimize downtime by creating the new deployment before destroying the old one. And... because I don't think AWS would let me destroy the API given that it's in use by the load balancer.
    lifecycle {
        create_before_destroy = true
    }

  depends_on = [
    aws_api_gateway_method.health_get,
    aws_api_gateway_integration.health_integration,
    aws_api_gateway_method.proxy_options,
    aws_api_gateway_integration.proxy_options_integration,
    aws_api_gateway_method.proxy_method,
    aws_api_gateway_integration.proxy_integration
  ]

}

# An API Gateway stage is a logical reference to a lifecycle state of your API (for example, dev, test, prod). Stages are used to manage and deploy different versions of your API, allowing you to test changes in a development environment before promoting them to production.
resource "aws_api_gateway_stage" "api_stage" {
    deployment_id = aws_api_gateway_deployment.api_deployment.id
    rest_api_id = aws_api_gateway_rest_api.api.id
    stage_name = "dev"

    access_log_settings {
      destination_arn = aws_cloudwatch_log_group.api_gateway_log_group.arn
      format = "$context.requestId $context.identity.sourceIp $context.identity.userAgent $context.requestTime $context.httpMethod $context.resourcePath $context.status $context.protocol $context.responseLength $context.integrationErrorMessage"
    }
}

# Used to map the custom domain to the API Gateway stage.
resource "aws_api_gateway_base_path_mapping" "custom_domain_mapping" {
  api_id = aws_api_gateway_rest_api.api.id
  stage_name = aws_api_gateway_stage.api_stage.stage_name
  domain_name = aws_api_gateway_domain_name.custom_domain.domain_name
}

resource "aws_cloudwatch_log_group" "api_gateway_log_group" {
    name = "/aws/api-gateway/interview-prep/${aws_api_gateway_rest_api.api.id}"
    retention_in_days = 7
}

# IAM stuff should probably be in IAM module.

# It could be to have a root-level configuration to enable logging for the various modules.

resource "aws_iam_role" "api_gateway_cloudwatch_role" {
    name = "${var.environment}-interview-prep-api-gateway-cloudwatch-role"
    assume_role_policy = jsonencode({
        Version = "2012-10-17",
        Statement = [
            {
                Effect = "Allow",
                Principal = {
                    Service = "apigateway.amazonaws.com"
                },
                Action = "sts:AssumeRole"
            }
        ]
    })
}

resource "aws_iam_policy" "api_gateway_cloudwatch_policy" {
    name = "${var.environment}-interview-prep-api-gateway-cloudwatch-policy"
    description = "Policy for API Gateway to write logs to CloudWatch"
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
                Resource = "*"
            }
        ]
    })
}

resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch_policy_attachment" {
    policy_arn = aws_iam_policy.api_gateway_cloudwatch_policy.arn
    role = aws_iam_role.api_gateway_cloudwatch_role.name
}
