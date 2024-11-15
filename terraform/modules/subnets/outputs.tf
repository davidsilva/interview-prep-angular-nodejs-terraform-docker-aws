output "subnet_a_id" {
  description = "The ID of subnet A"
  value       = aws_subnet.subnet_a.id
}

output "subnet_b_id" {
  description = "The ID of subnet B"
  value       = aws_subnet.subnet_b.id
}

output "db_subnet_a_id" {
  description = "The ID of DB subnet A"
  value       = aws_subnet.db_subnet_a.id
}

output "db_subnet_b_id" {
  description = "The ID of DB subnet B"
  value       = aws_subnet.db_subnet_b.id
}

output "internet_gateway_id" {
  description = "The ID of the Internet Gateway"
  value       = aws_internet_gateway.igw.id
}

output "nat_gateway_id" {
  description = "The ID of the NAT Gateway"
  value       = aws_nat_gateway.nat_gw.id
}

output "nat_eip_id" {
  description = "The ID of the NAT Gateway Elastic IP"
  value       = aws_eip.nat_eip.id
}