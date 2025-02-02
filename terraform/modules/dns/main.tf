resource "aws_route53_record" "frontend" {
  zone_id = var.zone_id
  name    = var.frontend_record_name
  type    = "A"

  alias {
    name                   = var.lb_dns_name
    zone_id                = var.lb_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "backend" {
  zone_id = var.zone_id
  name    = var.backend_record_name
  type    = "A"

  alias {
    name = var.custom_domain_name
    zone_id = var.custom_domain_zone_id
    evaluate_target_health = false
  }
}