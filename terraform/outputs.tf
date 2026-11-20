# Partially written by AI.

output "endpoint_urls" {
  value = {
    for key, definition in local.lambda_definitions :
    key => "${aws_api_gateway_stage.dev.invoke_url}/${definition.route}"
  }
}

output "user_image_bucket_name" {
  value = aws_s3_bucket.user_images.bucket
}

output "user_image_base_url" {
  value = "https://${aws_s3_bucket.user_images.bucket}.s3.us-east-2.amazonaws.com/image/"
}
