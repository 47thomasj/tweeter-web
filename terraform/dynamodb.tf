# Partially written by AI.

resource "aws_dynamodb_table" "users" {
  name           = "users"
  billing_mode   = "PROVISIONED"
  hash_key       = "alias"
  read_capacity  = 5
  write_capacity = 5

  attribute {
    name = "alias"
    type = "S"
  }
}

resource "aws_dynamodb_table" "follows" {
  name           = "follows"
  billing_mode   = "PROVISIONED"
  hash_key       = "follower_handle"
  range_key      = "followee_handle"
  read_capacity  = 5
  write_capacity = 5

  attribute {
    name = "follower_handle"
    type = "S"
  }

  attribute {
    name = "followee_handle"
    type = "S"
  }

  global_secondary_index {
    name           = "follows_index"
    read_capacity  = 5
    write_capacity = 5

    key_schema {
      attribute_name = "followee_handle"
      key_type       = "HASH"
    }

    key_schema {
      attribute_name = "follower_handle"
      key_type       = "RANGE"
    }

    projection_type = "ALL"
  }
}

resource "aws_dynamodb_table" "statuses" {
  name           = "statuses"
  billing_mode   = "PROVISIONED"
  hash_key       = "user_alias"
  range_key      = "timestamp"
  read_capacity  = 5
  write_capacity = 5

  attribute {
    name = "user_alias"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }
}

data "aws_iam_policy_document" "lambda_dynamodb_access" {
  statement {
    actions = [
      "dynamodb:BatchGetItem",
      "dynamodb:DeleteItem",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:Query",
    ]

    resources = [
      aws_dynamodb_table.users.arn,
      aws_dynamodb_table.follows.arn,
      "${aws_dynamodb_table.follows.arn}/index/*",
      aws_dynamodb_table.statuses.arn,
    ]
  }
}

resource "aws_iam_role_policy" "lambda_dynamodb_access" {
  name   = "tweeter-lambda-dynamodb-access"
  role   = aws_iam_role.lambda_execution.id
  policy = data.aws_iam_policy_document.lambda_dynamodb_access.json
}
