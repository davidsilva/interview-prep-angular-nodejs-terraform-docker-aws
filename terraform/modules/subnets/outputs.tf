output "public_subnet_a_id" {
  description = "The ID of public subnet A"
  value       = aws_subnet.public_subnet_a.id
}

output "public_subnet_b_id" {
  description = "The ID of public subnet B"
  value       = aws_subnet.public_subnet_b.id
}

output "private_subnet_a_id" {
  description = "The ID of private subnet A"
  value       = aws_subnet.private_subnet_a.id
}

output "private_subnet_b_id" {
  description = "The ID of private subnet B"
  value       = aws_subnet.private_subnet_b.id
}
