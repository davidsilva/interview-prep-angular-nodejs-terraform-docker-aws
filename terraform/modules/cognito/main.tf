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
