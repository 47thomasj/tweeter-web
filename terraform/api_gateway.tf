# Partially written by AI.

# REST API Gateway

locals {
  lambda_error_method_responses = {
    for response in setproduct(keys(local.lambda_definitions), ["400", "500"]) :
    "${response[0]}-${response[1]}" => {
      lambda_key  = response[0]
      status_code = response[1]
    }
  }

  lambda_method_response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }

  lambda_integration_response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }

  lambda_response_template = <<-VTL
    #set($response = $input.path('$'))
    #if($response.success == false)
      #set($context.responseOverride.status = 400)
    #end
    $input.json('$')
  VTL

  lambda_server_error_template = jsonencode({
    success = false
    message = "Server error"
  })
}

resource "aws_api_gateway_rest_api" "tweeter" {
  name = "tweeter-api"
}

resource "aws_api_gateway_resource" "lambda" {
  for_each = local.lambda_definitions

  rest_api_id = aws_api_gateway_rest_api.tweeter.id
  parent_id   = aws_api_gateway_rest_api.tweeter.root_resource_id
  path_part   = each.value.route
}

resource "aws_api_gateway_method" "lambda" {
  for_each = local.lambda_definitions

  rest_api_id   = aws_api_gateway_rest_api.tweeter.id
  resource_id   = aws_api_gateway_resource.lambda[each.key].id
  http_method   = "POST"
  authorization = "NONE"
}

# Non-proxy integration preserves the current Lambda request types.

resource "aws_api_gateway_integration" "lambda" {
  for_each = local.lambda_definitions

  rest_api_id = aws_api_gateway_rest_api.tweeter.id
  resource_id = aws_api_gateway_resource.lambda[each.key].id
  http_method = aws_api_gateway_method.lambda[each.key].http_method

  type                    = "AWS"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.lambda[each.key].invoke_arn

  request_templates = {
    "application/json" = "$input.json('$')"
  }
}

resource "aws_api_gateway_method_response" "lambda" {
  for_each = local.lambda_definitions

  rest_api_id = aws_api_gateway_rest_api.tweeter.id
  resource_id = aws_api_gateway_resource.lambda[each.key].id
  http_method = aws_api_gateway_method.lambda[each.key].http_method
  status_code = "200"

  response_parameters = local.lambda_method_response_parameters
}

resource "aws_api_gateway_method_response" "lambda_error" {
  for_each = local.lambda_error_method_responses

  rest_api_id = aws_api_gateway_rest_api.tweeter.id
  resource_id = aws_api_gateway_resource.lambda[each.value.lambda_key].id
  http_method = aws_api_gateway_method.lambda[each.value.lambda_key].http_method
  status_code = each.value.status_code

  response_parameters = local.lambda_method_response_parameters
}

resource "aws_api_gateway_integration_response" "lambda" {
  for_each = local.lambda_definitions

  rest_api_id = aws_api_gateway_rest_api.tweeter.id
  resource_id = aws_api_gateway_resource.lambda[each.key].id
  http_method = aws_api_gateway_method.lambda[each.key].http_method
  status_code = aws_api_gateway_method_response.lambda[each.key].status_code

  response_parameters = local.lambda_integration_response_parameters

  response_templates = {
    "application/json" = local.lambda_response_template
  }

  depends_on = [aws_api_gateway_integration.lambda]
}

resource "aws_api_gateway_integration_response" "lambda_error" {
  for_each = local.lambda_definitions

  rest_api_id       = aws_api_gateway_rest_api.tweeter.id
  resource_id       = aws_api_gateway_resource.lambda[each.key].id
  http_method       = aws_api_gateway_method.lambda[each.key].http_method
  status_code       = aws_api_gateway_method_response.lambda_error["${each.key}-500"].status_code
  selection_pattern = "(?s).+"

  response_parameters = local.lambda_integration_response_parameters

  response_templates = {
    "application/json" = local.lambda_server_error_template
  }

  depends_on = [aws_api_gateway_integration.lambda]
}

resource "aws_api_gateway_gateway_response" "default_5xx" {
  rest_api_id   = aws_api_gateway_rest_api.tweeter.id
  response_type = "DEFAULT_5XX"
  status_code   = "500"

  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin" = "'*'"
  }

  response_templates = {
    "application/json" = local.lambda_server_error_template
  }
}

# Browser clients send an OPTIONS preflight before JSON POST requests.

resource "aws_api_gateway_method" "cors" {
  for_each = local.lambda_definitions

  rest_api_id   = aws_api_gateway_rest_api.tweeter.id
  resource_id   = aws_api_gateway_resource.lambda[each.key].id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "cors" {
  for_each = local.lambda_definitions

  rest_api_id = aws_api_gateway_rest_api.tweeter.id
  resource_id = aws_api_gateway_resource.lambda[each.key].id
  http_method = aws_api_gateway_method.cors[each.key].http_method

  type = "MOCK"

  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

resource "aws_api_gateway_method_response" "cors" {
  for_each = local.lambda_definitions

  rest_api_id = aws_api_gateway_rest_api.tweeter.id
  resource_id = aws_api_gateway_resource.lambda[each.key].id
  http_method = aws_api_gateway_method.cors[each.key].http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "cors" {
  for_each = local.lambda_definitions

  rest_api_id = aws_api_gateway_rest_api.tweeter.id
  resource_id = aws_api_gateway_resource.lambda[each.key].id
  http_method = aws_api_gateway_method.cors[each.key].http_method
  status_code = aws_api_gateway_method_response.cors[each.key].status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.cors]
}

resource "aws_lambda_permission" "api_gateway" {
  for_each = local.lambda_definitions

  statement_id  = "AllowTweeterApiGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.tweeter.execution_arn}/*/POST/${each.value.route}"
}

resource "aws_api_gateway_deployment" "tweeter" {
  rest_api_id = aws_api_gateway_rest_api.tweeter.id

  lifecycle {
    create_before_destroy = true
  }

  triggers = {
    redeployment = sha1(jsonencode({
      resources = [
        for key in sort(keys(local.lambda_definitions)) :
        aws_api_gateway_resource.lambda[key].id
      ]
      methods = [
        for key in sort(keys(local.lambda_definitions)) :
        aws_api_gateway_method.lambda[key].id
      ]
      method_responses = [
        for key in sort(keys(local.lambda_definitions)) :
        aws_api_gateway_method_response.lambda[key].id
      ]
      error_method_responses = [
        for key in sort(keys(local.lambda_error_method_responses)) :
        aws_api_gateway_method_response.lambda_error[key].id
      ]
      integrations = [
        for key in sort(keys(local.lambda_definitions)) :
        aws_api_gateway_integration.lambda[key].id
      ]
      integration_responses = [
        for key in sort(keys(local.lambda_definitions)) :
        aws_api_gateway_integration_response.lambda[key].id
      ]
      error_integration_responses = [
        for key in sort(keys(local.lambda_definitions)) :
        aws_api_gateway_integration_response.lambda_error[key].id
      ]
      gateway_responses = [
        aws_api_gateway_gateway_response.default_5xx.id
      ]
      response_templates = {
        lambda       = local.lambda_response_template
        server_error = local.lambda_server_error_template
      }
      cors_methods = [
        for key in sort(keys(local.lambda_definitions)) :
        aws_api_gateway_method.cors[key].id
      ]
      cors_integrations = [
        for key in sort(keys(local.lambda_definitions)) :
        aws_api_gateway_integration.cors[key].id
      ]
      cors_method_responses = [
        for key in sort(keys(local.lambda_definitions)) :
        aws_api_gateway_method_response.cors[key].id
      ]
      cors_integration_responses = [
        for key in sort(keys(local.lambda_definitions)) :
        aws_api_gateway_integration_response.cors[key].id
      ]
    }))
  }

  depends_on = [
    aws_api_gateway_integration_response.lambda,
    aws_api_gateway_integration_response.lambda_error,
    aws_api_gateway_integration_response.cors,
    aws_api_gateway_gateway_response.default_5xx,
  ]
}

resource "aws_api_gateway_stage" "dev" {
  rest_api_id   = aws_api_gateway_rest_api.tweeter.id
  deployment_id = aws_api_gateway_deployment.tweeter.id
  stage_name    = "dev"
}
