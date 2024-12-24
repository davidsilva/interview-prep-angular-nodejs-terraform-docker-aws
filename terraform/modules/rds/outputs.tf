output "db_instance_id" {
  description = "The ID of the RDS instance"
  value = aws_db_instance.postgres.id
}

output "db_instance_endpoint" {
  description = "The endpoint of the RDS instance"
  value = aws_db_instance.postgres.endpoint
}

output "db_instance_port" {
  description = "The port of the RDS instance"
  value = aws_db_instance.postgres.port
}

output "db_instance_name" {
  description = "The name of the RDS instance"
  value = aws_db_instance.postgres.identifier
}