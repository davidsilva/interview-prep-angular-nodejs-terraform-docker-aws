resource "aws_route53_zone" "onyxdevtutorials_com" {
  name = "onyxdevtutorials.com"
}

provider "aws" {
    region = var.region
    profile = var.profile
}

module "vpc" {
    source = "../../modules/vpc"
    vpc_cidr = var.vpc_cidr
    public_subnet_a_id = module.subnets.public_subnet_a_id
    public_subnet_b_id = module.subnets.public_subnet_b_id
    private_subnet_a_id = module.subnets.private_subnet_a_id
    private_subnet_b_id = module.subnets.private_subnet_b_id
    environment = var.environment
}

module "subnets" {
    source = "../../modules/subnets"
    vpc_id = module.vpc.vpc_id
    public_subnet_a_cidr = var.public_subnet_a_cidr
    public_subnet_b_cidr = var.public_subnet_b_cidr
    private_subnet_a_cidr = var.private_subnet_a_cidr
    private_subnet_b_cidr = var.private_subnet_b_cidr
    availability_zone_a = var.availability_zone_a
    availability_zone_b = var.availability_zone_b
    environment = var.environment
}

module "security_groups" {
    source = "../../modules/security_groups"
    vpc_id = module.vpc.vpc_id
    environment = var.environment
    vpn_ip = var.vpn_ip
}

module "rds" {
  source      = "../../modules/rds"
  vpc_id      = module.vpc.vpc_id
  private_subnet_ids = [module.subnets.private_subnet_a_id, module.subnets.private_subnet_b_id]
  db_username = var.db_username
  db_password = var.db_password
  db_sg_id    = module.security_groups.db_sg_id
  environment = var.environment
}

module "ecs" {
  source                    = "../../modules/ecs"
  project_name              = var.project_name
  environment               = var.environment
  region                    = var.region
  frontend_image = "interview-prep-frontend"
  frontend_repository_url = module.ecr.frontend_repository_url
  backend_image = "interview-prep-backend"
  backend_repository_url = module.ecr.backend_repository_url
  database_url = module.rds.db_instance_endpoint
  private_subnet_ids = [module.subnets.private_subnet_a_id, module.subnets.private_subnet_b_id]
  frontend_sg_id            = module.security_groups.frontend_sg_id
  backend_sg_id             = module.security_groups.backend_sg_id
  alb_sg_id                 = module.security_groups.alb_sg_id
  ecs_task_execution_role   = module.iam.ecs_task_execution_role_arn
  ecs_task_role_arn = module.iam.ecs_task_role_arn
  db_username = var.db_username
  db_password = var.db_password
  frontend_target_group_arn = module.load_balancer.frontend_target_group_arn
  backend_target_group_arn = module.load_balancer.backend_target_group_arn
}

module "iam" {
  source      = "../../modules/iam"
  environment = var.environment
  account_id = var.account_id
  region     = var.region
  github_repository = "davidsilva/interview-prep-angular-nodejs-terraform-docker-aws"
}

module "ecr" {
  source      = "../../modules/ecr"
  environment = var.environment
}

module "bastion" {
  source = "../../modules/bastion"
  vpc_id = module.vpc.vpc_id
  public_subnet_id = module.subnets.public_subnet_a_id
  bastion_sg_id = module.security_groups.bastion_sg_id
  ami = var.bastion_ami
  instance_type = var.bastion_instance_type
  key_name = var.key_name
  environment = var.environment
}

module "ssm_parameters" {
  source = "../../modules/ssm"
  environment = var.environment
  db_host = module.rds.db_instance_endpoint
  db_port = module.rds.db_instance_port
  db_name = module.rds.db_instance_name
  db_user = var.db_username
  db_pass = var.db_password
}

module "lambda_migrate" {
  source = "../../modules/lambda"
  environment = var.environment
  function_name = "${var.environment}-interview-prep-migrate"
  handler = "index.handler"
  runtime = "nodejs20.x"
  timeout = 300
  memory_size = 128
  lambda_package = var.lambda_package_migrate
  lambda_subnet_ids = [module.subnets.private_subnet_a_id, module.subnets.private_subnet_b_id]
  lambda_sg_id = module.security_groups.lambda_sg_id
  db_host_param = module.ssm_parameters.db_host_param
  db_port_param = module.ssm_parameters.db_port_param
  db_name_param = module.ssm_parameters.db_name_param
  db_user_param = module.ssm_parameters.db_user_param
  db_pass_param = module.ssm_parameters.db_pass_param
  lambda_exec_role_arn = module.iam.lambda_exec_role_arn
}

resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  name = "/aws/vpc/flow-log"
  retention_in_days = 7

  tags = {
    Name = "interview-prep-vpc-flow-log"
    environment = var.environment
  }
}

resource "aws_flow_log" "vpc_flow_log" {
  vpc_id = module.vpc.vpc_id
  log_destination = aws_cloudwatch_log_group.vpc_flow_log.arn
  traffic_type = "ALL"
  log_destination_type = "cloud-watch-logs"
  iam_role_arn = module.iam.vpc_flow_log_role_arn

  tags = {
    Name = "interview-prep-vpc-flow-log"
    environment = var.environment
  }
}

module "load_balancer" {
  source = "../../modules/load_balancer"
  environment = var.environment
  security_groups = [module.security_groups.alb_sg_id]
  public_subnet_ids = [module.subnets.public_subnet_a_id, module.subnets.public_subnet_b_id]
  vpc_id = module.vpc.vpc_id
  frontend_health_check_path = "/health"
  backend_health_check_path = "/health"
}

module "dns" {
  source = "../../modules/dns"
  zone_id = aws_route53_zone.onyxdevtutorials_com.zone_id
  frontend_record_name = "dev.interviewprep.onyxdevtutorials.com"
  backend_record_name = "api.dev.interviewprep.onyxdevtutorials.com"
  lb_dns_name = module.load_balancer.lb_dns_name
  lb_zone_id = module.load_balancer.lb_zone_id
  custom_domain_name = module.api_gateway.custom_domain_name
  custom_domain_zone_id = module.api_gateway.custom_domain_zone_id
}

module "api_gateway" {
  source = "../../modules/api_gateway"
  environment = var.environment
  cloudwatch_role_arn = module.iam.api_gateway_cloudwatch_role_arn
  lb_dns_name = module.load_balancer.lb_dns_name
  region = var.region
  certificate_arn = var.certificate_arn
  cors_origin = "http://dev.interviewprep.onyxdevtutorials.com"
}
