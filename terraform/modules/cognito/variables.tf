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

# A "client" in Cognito is an application that can authenticate users. This variable is a map of objects where the key is the client name and the value is an object with the client's callback URLs and logout URLs.
variable "clients" {
  description = "The list of clients for the user pool"
  type        = map(object({
    client_name = string
    callback_urls = list(string)
    logout_urls = list(string)
  }))
}