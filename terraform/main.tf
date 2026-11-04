# Partially written by AI.

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }

    archive = {
      source  = "hashicorp/archive"
      version = ">= 2.0"
    }
  }
}

provider "aws" {
  region = "us-east-2"
}

# Lambda execution role

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_execution" {
  name               = "tweeter-lambda-execution-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "lambda_logging" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Create the uploaded ZIP

data "archive_file" "get_followees" {
  type        = "zip"
  source_file = "${path.module}/../tweeter-server/dist/lambda/follow/getFolloweesLambda.js"
  output_path = "${path.module}/getFolloweesLambda.zip"
}

data "archive_file" "get_followers" {
  type        = "zip"
  source_file = "${path.module}/../tweeter-server/dist/lambda/follow/getFollowersLambda.js"
  output_path = "${path.module}/getFollowersLambda.zip"
}

data "archive_file" "register" {
  type        = "zip"
  source_file = "${path.module}/../tweeter-server/dist/lambda/auth/registerLambda.js"
  output_path = "${path.module}/registerLambda.zip"
}

data "archive_file" "logout" {
  type        = "zip"
  source_file = "${path.module}/../tweeter-server/dist/lambda/auth/logoutLambda.js"
  output_path = "${path.module}/logoutLambda.zip"
}

data "archive_file" "login" {
  type        = "zip"
  source_file = "${path.module}/../tweeter-server/dist/lambda/auth/loginLambda.js"
  output_path = "${path.module}/loginLambda.zip"
}

# Lambda function

resource "aws_lambda_function" "get_followees" {
  function_name = "tweeter-get-followees"
  role          = aws_iam_role.lambda_execution.arn

  runtime = "nodejs22.x"
  handler = "getFolloweesLambda.handler"

  filename         = data.archive_file.get_followees.output_path
  source_code_hash = data.archive_file.get_followees.output_base64sha256

  depends_on = [aws_iam_role_policy_attachment.lambda_logging]
}

resource "aws_lambda_function" "get_followers" {

  function_name = "tweeter-get-followers"
  role          = aws_iam_role.lambda_execution.arn

  runtime = "nodejs22.x"
  handler = "getFollowersLambda.handler"

  filename         = data.archive_file.get_followers.output_path
  source_code_hash = data.archive_file.get_followers.output_base64sha256

  depends_on = [aws_iam_role_policy_attachment.lambda_logging]
}

resource "aws_lambda_function" "register" {
  function_name = "tweeter-register"
  role          = aws_iam_role.lambda_execution.arn

  runtime = "nodejs22.x"
  handler = "registerLambda.handler"

  filename         = data.archive_file.register.output_path
  source_code_hash = data.archive_file.register.output_base64sha256

  depends_on = [aws_iam_role_policy_attachment.lambda_logging]
}

resource "aws_lambda_function" "logout" {
  function_name = "tweeter-logout"
  role          = aws_iam_role.lambda_execution.arn

  runtime = "nodejs22.x"
  handler = "logoutLambda.handler"

  filename         = data.archive_file.logout.output_path
  source_code_hash = data.archive_file.logout.output_base64sha256

  depends_on = [aws_iam_role_policy_attachment.lambda_logging]
}

resource "aws_lambda_function" "login" {
  function_name = "tweeter-login"
  role          = aws_iam_role.lambda_execution.arn

  runtime = "nodejs22.x"
  handler = "loginLambda.handler"

  filename         = data.archive_file.login.output_path
  source_code_hash = data.archive_file.login.output_base64sha256

  depends_on = [aws_iam_role_policy_attachment.lambda_logging]
}

# REST API Gateway

resource "aws_api_gateway_rest_api" "tweeter" {
  name = "tweeter-api"
}

resource "aws_api_gateway_resource" "followees" {
  rest_api_id = aws_api_gateway_rest_api.tweeter.id
  parent_id   = aws_api_gateway_rest_api.tweeter.root_resource_id
  path_part   = "followees"
}

resource "aws_api_gateway_method" "get_followees" {
  rest_api_id   = aws_api_gateway_rest_api.tweeter.id
  resource_id   = aws_api_gateway_resource.followees.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_resource" "followers" {
  rest_api_id = aws_api_gateway_rest_api.tweeter.id
  parent_id   = aws_api_gateway_rest_api.tweeter.root_resource_id
  path_part   = "followers"
}

resource "aws_api_gateway_method" "get_followers" {
  rest_api_id   = aws_api_gateway_rest_api.tweeter.id
  resource_id   = aws_api_gateway_resource.followers.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_resource" "register" {
  rest_api_id = aws_api_gateway_rest_api.tweeter.id
  parent_id   = aws_api_gateway_rest_api.tweeter.root_resource_id
  path_part   = "register"
}

resource "aws_api_gateway_method" "register" {
  rest_api_id   = aws_api_gateway_rest_api.tweeter.id
  resource_id   = aws_api_gateway_resource.register.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_resource" "logout" {

  rest_api_id = aws_api_gateway_rest_api.tweeter.id
  parent_id   = aws_api_gateway_rest_api.tweeter.root_resource_id
  path_part   = "logout"
}

resource "aws_api_gateway_method" "logout" {

  rest_api_id   = aws_api_gateway_rest_api.tweeter.id
  resource_id   = aws_api_gateway_resource.logout.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_resource" "login" {

  rest_api_id = aws_api_gateway_rest_api.tweeter.id
  parent_id   = aws_api_gateway_rest_api.tweeter.root_resource_id
  path_part   = "login"
}

resource "aws_api_gateway_method" "login" {

  rest_api_id   = aws_api_gateway_rest_api.tweeter.id
  resource_id   = aws_api_gateway_resource.login.id
  http_method   = "POST"
  authorization = "NONE"
}

# Non-proxy integration preserves the current Lambda request type.

resource "aws_api_gateway_integration" "get_followees" {
  rest_api_id = aws_api_gateway_rest_api.tweeter.id
  resource_id = aws_api_gateway_resource.followees.id
  http_method = aws_api_gateway_method.get_followees.http_method

  type                    = "AWS"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.get_followees.invoke_arn

  request_templates = {
    "application/json" = "$input.json('$')"
  }
}

resource "aws_api_gateway_method_response" "success" {
  rest_api_id = aws_api_gateway_rest_api.tweeter.id
  resource_id = aws_api_gateway_resource.followees.id
  http_method = aws_api_gateway_method.get_followees.http_method
  status_code = "200"
}

resource "aws_api_gateway_integration_response" "success" {
  rest_api_id = aws_api_gateway_rest_api.tweeter.id
  resource_id = aws_api_gateway_resource.followees.id
  http_method = aws_api_gateway_method.get_followees.http_method
  status_code = aws_api_gateway_method_response.success.status_code

  depends_on = [aws_api_gateway_integration.get_followees]
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowTweeterApiGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_followees.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.tweeter.execution_arn}/*/POST/followees"
}

resource "aws_api_gateway_deployment" "tweeter" {
  rest_api_id = aws_api_gateway_rest_api.tweeter.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.followees.id,
      aws_api_gateway_method.get_followees.id,
      aws_api_gateway_integration.get_followees.id,
      aws_api_gateway_integration_response.success.id
    ]))
  }

  depends_on = [aws_api_gateway_integration_response.success]
}

resource "aws_api_gateway_stage" "dev" {
  rest_api_id   = aws_api_gateway_rest_api.tweeter.id
  deployment_id = aws_api_gateway_deployment.tweeter.id
  stage_name    = "dev"
}

output "get_followees_url" {
  value = "${aws_api_gateway_stage.dev.invoke_url}/followees"
}
