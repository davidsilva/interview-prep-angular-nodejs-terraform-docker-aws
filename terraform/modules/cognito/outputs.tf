output "user_pool_id" {
  description = "The ID of the user pool"
  value       = aws_cognito_user_pool.user_pool.id
}

output "user_pool_arn" {
  description = "The ARN of the user pool"
  value       = aws_cognito_user_pool.user_pool.arn
}

output "user_pool_client_ids" {
  description = "A map of client IDs for the Cognito User Pool Clients"
  value = { for k, v in aws_cognito_user_pool_client.user_pool_client : k => v.id }
}

output "cognito_user_pool_id" {
  description = "The ID of the Cognito user pool"
  value       = aws_cognito_user_pool.user_pool.id
}

output "cognito_client_id" {
  description = "The ID of the Cognito user pool client"
  value       = aws_cognito_user_pool_client.user_pool_client["web_app"].id
}