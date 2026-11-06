# Partially written by AI.

# Preserve existing resources when upgrading from the original individual blocks.

moved {
  from = aws_lambda_function.get_followees
  to   = aws_lambda_function.lambda["get_followees"]
}

moved {
  from = aws_lambda_function.get_followers
  to   = aws_lambda_function.lambda["get_followers"]
}

moved {
  from = aws_lambda_function.register
  to   = aws_lambda_function.lambda["register"]
}

moved {
  from = aws_lambda_function.logout
  to   = aws_lambda_function.lambda["logout"]
}

moved {
  from = aws_lambda_function.login
  to   = aws_lambda_function.lambda["login"]
}

moved {
  from = aws_api_gateway_resource.followees
  to   = aws_api_gateway_resource.lambda["get_followees"]
}

moved {
  from = aws_api_gateway_resource.followers
  to   = aws_api_gateway_resource.lambda["get_followers"]
}

moved {
  from = aws_api_gateway_resource.register
  to   = aws_api_gateway_resource.lambda["register"]
}

moved {
  from = aws_api_gateway_resource.logout
  to   = aws_api_gateway_resource.lambda["logout"]
}

moved {
  from = aws_api_gateway_resource.login
  to   = aws_api_gateway_resource.lambda["login"]
}

moved {
  from = aws_api_gateway_method.get_followees
  to   = aws_api_gateway_method.lambda["get_followees"]
}

moved {
  from = aws_api_gateway_method.get_followers
  to   = aws_api_gateway_method.lambda["get_followers"]
}

moved {
  from = aws_api_gateway_method.register
  to   = aws_api_gateway_method.lambda["register"]
}

moved {
  from = aws_api_gateway_method.logout
  to   = aws_api_gateway_method.lambda["logout"]
}

moved {
  from = aws_api_gateway_method.login
  to   = aws_api_gateway_method.lambda["login"]
}

moved {
  from = aws_api_gateway_integration.get_followees
  to   = aws_api_gateway_integration.lambda["get_followees"]
}

moved {
  from = aws_api_gateway_method_response.success
  to   = aws_api_gateway_method_response.lambda["get_followees"]
}

moved {
  from = aws_api_gateway_integration_response.success
  to   = aws_api_gateway_integration_response.lambda["get_followees"]
}

moved {
  from = aws_lambda_permission.api_gateway
  to   = aws_lambda_permission.api_gateway["get_followees"]
}
