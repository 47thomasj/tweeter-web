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
  source_file = "${path.module}/../tweeter-server/dist/getFolloweesLambda.js"
  output_path = "${path.module}/getFolloweesLambda.zip"
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
