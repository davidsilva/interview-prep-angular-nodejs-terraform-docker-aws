variable "environment" {
  description = "The environment in which the resources are being created"
  type        = string
}

variable "region" {
  description = "The AWS region in which the resources are being created"
  type        = string
}

variable "project_name" {
  description = "The name of the project"
  type        = string
}

variable "account_id" {
  description = "The AWS account ID"
  type = string
}

# A "client" in Cognito is an application that can authenticate users. This variable is a map of objects where the key is the client name and the value is an object with the client's callback URLs and logout URLs.
variable "clients" {
  description = "The list of clients for the user pool"
  type        = map(object({
    client_name = string
    callback_urls = list(string)
    logout_urls = list(string)
    generate_secret = bool
  }))
}

variable "api_gateway_rest_api_id" {
  description = "The ID of the API Gateway REST API"
  type        = string
}