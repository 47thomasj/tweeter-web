# Partially written by AI.

resource "aws_dynamodb_table" "users" {
  name           = "users"
  billing_mode   = "PROVISIONED"
  hash_key       = "alias"
  read_capacity  = 3
  write_capacity = 3

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
  read_capacity  = 3
  write_capacity = 3

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
    read_capacity  = 3
    write_capacity = 3

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
  read_capacity  = 3
  write_capacity = 3

  attribute {
    name = "user_alias"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }
}

resource "aws_dynamodb_table" "feed" {
  name           = "feed"
  billing_mode   = "PROVISIONED"
  hash_key       = "feed_user_alias"
  range_key      = "sort_key"
  read_capacity  = 3
  write_capacity = 3

  attribute {
    name = "feed_user_alias"
    type = "S"
  }

  attribute {
    name = "sort_key"
    type = "S"
  }
}

resource "aws_dynamodb_table" "auth" {
  name           = "auth"
  billing_mode   = "PROVISIONED"
  hash_key       = "alias"
  read_capacity  = 3
  write_capacity = 3

  attribute {
    name = "alias"
    type = "S"
  }
}

resource "aws_dynamodb_table" "sessions" {
  name           = "sessions"
  billing_mode   = "PROVISIONED"
  hash_key       = "token"
  read_capacity  = 3
  write_capacity = 3

  attribute {
    name = "token"
    type = "S"
  }

  ttl {
    attribute_name = "expires_at"
    enabled        = true
  }
}

data "aws_iam_policy_document" "lambda_dynamodb_access" {
  statement {
    actions = [
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem",
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
      aws_dynamodb_table.feed.arn,
      aws_dynamodb_table.auth.arn,
      aws_dynamodb_table.sessions.arn,
    ]
  }
}

resource "aws_iam_role_policy" "lambda_dynamodb_access" {
  name   = "tweeter-lambda-dynamodb-access"
  role   = aws_iam_role.lambda_execution.id
  policy = data.aws_iam_policy_document.lambda_dynamodb_access.json
}
