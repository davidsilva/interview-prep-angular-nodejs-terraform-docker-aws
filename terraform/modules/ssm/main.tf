# I set the actual values manually in the AWS console. In the following blocks I need to provide *some* value but I don't want it to overwrite the existing values, so I use `lifecycle { ignore_changes = [value] }`. This is a common pattern when working with SSM parameters in Terraform.
resource "aws_ssm_parameter" "db_host" {
    name = "/interview-prep/${var.environment}/DB_HOST"
    type = "String"
    value = "placeholder"

    lifecycle {
        ignore_changes = [value]
    }
}

resource "aws_ssm_parameter" "db_port" {
    name = "/interview-prep/${var.environment}/DB_PORT"
    type = "String"
    value = "placeholder"

    lifecycle {
        ignore_changes = [value]
    }
}

resource "aws_ssm_parameter" "db_name" {
    name = "/interview-prep/${var.environment}/DB_NAME"
    type = "String"
    value = "placeholder"

    lifecycle {
        ignore_changes = [value]
    }
}

resource "aws_ssm_parameter" "db_user" {
    name = "/interview-prep/${var.environment}/DB_USERNAME"
    type = "String"
    value = "placeholder"

    lifecycle {
        ignore_changes = [value]
    }
}

resource "aws_ssm_parameter" "db_pass" {
    name = "/interview-prep/${var.environment}/DB_PASSWORD"
    type = "SecureString"
    value = "placeholder"

    lifecycle {
        ignore_changes = [value]
    }
}