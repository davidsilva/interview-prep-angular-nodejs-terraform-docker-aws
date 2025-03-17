resource "aws_lambda_function" "lambda" {
    function_name = var.function_name
    handler = var.handler
    runtime = var.runtime
    timeout = var.timeout
    memory_size = var.memory_size
    role = var.lambda_exec_role_arn
    filename = var.lambda_package
    source_code_hash = filebase64sha256(var.lambda_package)

    vpc_config {
        subnet_ids = var.lambda_subnet_ids
        security_group_ids = [var.lambda_sg_id]
    }

    environment {
        # variables = {
        #     DB_HOST_PARAM = var.db_host_param
        #     DB_PORT_PARAM = var.db_port_param
        #     DB_NAME_PARAM = var.db_name_param
        #     DB_USER_PARAM = var.db_user_param
        #     DB_PASS_PARAM = var.db_pass_param
        # }
        variables = var.environment_variables
    }
}