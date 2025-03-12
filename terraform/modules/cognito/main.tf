resource "aws_cognito_user_pool" "user_pool" {
  name = "${var.environment}-${var.project_name}-user-pool"

  password_policy {
    minimum_length = 8
    require_lowercase = true
    require_numbers = true
    require_symbols = true
    require_uppercase = true
    temporary_password_validity_days = 7
  }

  auto_verified_attributes = ["email"]

  # We can enable MFA later.
  mfa_configuration = "OFF"

  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  schema {
    name = "email"
    attribute_data_type = "String"
    # If the email address is used for account recovery or as a primary identifier, changing it might have security implications. Ensure that proper verification and security measures are in place.
    mutable = true
    required = true
  }

  # Maybe add some Lambda triggers here later.
  # E.g., create a user profile upon sign-up confirmation.

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_cognito_user_pool_client" "user_pool_client" {
  for_each = var.clients

  name = each.value.client_name
  user_pool_id = aws_cognito_user_pool.user_pool.id
  # Typically, web applications do not use a client secret because they run in a browser environment where the client secret cannot be securely stored. For server-side applications, such as backend services or APIs, the client secret can be securely stored and used to authenticate the client.
  generate_secret = false
  callback_urls = each.value.callback_urls
  logout_urls = each.value.logout_urls
}

resource "aws_cognito_identity_pool" "identity_pool" {
  identity_pool_name = "${var.environment}-${var.project_name}-identity-pool"
  allow_unauthenticated_identities = true

  cognito_identity_providers {
    client_id = aws_cognito_user_pool_client.user_pool_client["web_app"].id
    provider_name = "cognito-idp.${var.region}.amazonaws.com/${aws_cognito_user_pool.user_pool.id}"
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_iam_role" "unauthenticated_role" {
  name = "${var.environment}-${var.project_name}-unauthenticated-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        },
        Action = "sts:AssumeRoleWithWebIdentity",
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.identity_pool.id
          },
          "ForAnyValue:StringLike" = {
            "cognito-identity.amazonaws.com:amr" = "unauthenticated"
          }
        }
      }
    ]
  })

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_iam_policy" "unauthenticated_policy" {
  name = "${var.environment}-${var.project_name}-unauthenticated-policy"
  description = "Policy for unauthenticated users"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "execute-api:Invoke"
        ],
        Resource = [
          "arn:aws:execute-api:${var.region}:${var.account_id}:${var.api_gateway_rest_api_id}/*/GET/products",
          "arn:aws:execute-api:${var.region}:${var.account_id}:${var.api_gateway_rest_api_id}/*/GET/users"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "unauthenticated_role_policy_attachment" {
  role       = aws_iam_role.unauthenticated_role.name
  policy_arn = aws_iam_policy.unauthenticated_policy.arn
}

resource "aws_iam_role" "authenticated_role" {
  name = "${var.environment}-${var.project_name}-authenticated-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        },
        Action = "sts:AssumeRoleWithWebIdentity",
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.identity_pool.id
          },
          "ForAnyValue:StringLike" = {
            "cognito-identity.amazonaws.com:amr" = "authenticated"
          }
        }
      }
    ]
  })

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_iam_policy" "authenticated_policy" {
  name = "${var.environment}-${var.project_name}-authenticated-policy"
  description = "Policy for authenticated users"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "execute-api:Invoke"
        ],
        Resource = [
          "arn:aws:execute-api:${var.region}:${var.account_id}:${var.api_gateway_rest_api_id}/*/*",
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "authenticated_role_policy_attachment" {
  role       = aws_iam_role.authenticated_role.name
  policy_arn = aws_iam_policy.authenticated_policy.arn
}

resource "aws_cognito_identity_pool_roles_attachment" "identity_pool_roles_attachment" {
  identity_pool_id = aws_cognito_identity_pool.identity_pool.id
  roles = {
    unauthenticated = aws_iam_role.unauthenticated_role.arn
    authenticated = aws_iam_role.authenticated_role.arn
  }
}