# Partially written by AI.

output "endpoint_urls" {
  value = {
    for key, definition in local.lambda_definitions :
    key => "${aws_api_gateway_stage.dev.invoke_url}/${definition.route}"
  }
}
