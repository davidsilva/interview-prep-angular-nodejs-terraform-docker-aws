output "custom_domain_name" {
  description = "The custom domain name"
  value       = aws_api_gateway_domain_name.custom_domain.cloudfront_domain_name
}

output "custom_domain_zone_id" {
  description = "The custom domain zone ID"
  value       = aws_api_gateway_domain_name.custom_domain.cloudfront_zone_id
}