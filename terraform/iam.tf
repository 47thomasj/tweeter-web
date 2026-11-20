# Partially written by AI.

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

data "aws_iam_policy_document" "lambda_s3_image_access" {
  statement {
    actions = [
      "s3:PutObject",
      "s3:PutObjectAcl",
    ]

    resources = ["${aws_s3_bucket.user_images.arn}/image/*"]
  }
}

resource "aws_iam_role_policy" "lambda_s3_image_access" {
  name   = "tweeter-lambda-s3-image-access"
  role   = aws_iam_role.lambda_execution.id
  policy = data.aws_iam_policy_document.lambda_s3_image_access.json
}
