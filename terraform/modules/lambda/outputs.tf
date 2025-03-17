output "lambda_function_arn" {
  description = "ARN of the lambda function"
  value       = aws_lambda_function.lambda.arn
}

output "invoke_arn" {
  description = "ARN to invoke the lambda function"
  value       = aws_lambda_function.lambda.invoke_arn
}
