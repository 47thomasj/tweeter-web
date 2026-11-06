# Partially written by AI.

locals {
  lambda_definitions = {
    get_followees = {
      function_name = "tweeter-get-followees"
      source_file   = "follow/getFolloweesLambda.js"
      handler       = "getFolloweesLambda.handler"
      route         = "followees"
    }
    get_followers = {
      function_name = "tweeter-get-followers"
      source_file   = "follow/getFollowersLambda.js"
      handler       = "getFollowersLambda.handler"
      route         = "followers"
    }
    register = {
      function_name = "tweeter-register"
      source_file   = "auth/registerLambda.js"
      handler       = "registerLambda.handler"
      route         = "register"
    }
    logout = {
      function_name = "tweeter-logout"
      source_file   = "auth/logoutLambda.js"
      handler       = "logoutLambda.handler"
      route         = "logout"
    }
    login = {
      function_name = "tweeter-login"
      source_file   = "auth/loginLambda.js"
      handler       = "loginLambda.handler"
      route         = "login"
    }
    load_more_feed_items = {
      function_name = "tweeter-load-more-feed-items"
      source_file   = "status/LoadMoreFeedItemsLambda.js"
      handler       = "LoadMoreFeedItemsLambda.handler"
      route         = "feed-items"
    }
    load_more_story_items = {
      function_name = "tweeter-load-more-story-items"
      source_file   = "status/LoadMoreStoryItemsLambda.js"
      handler       = "LoadMoreStoryItemsLambda.handler"
      route         = "story-items"
    }
    post_status = {
      function_name = "tweeter-post-status"
      source_file   = "status/PostStatusLambda.js"
      handler       = "PostStatusLambda.handler"
      route         = "post-status"
    }
  }
}

# Each build output is bundled with its dependencies before being zipped.

data "archive_file" "lambda" {
  for_each = local.lambda_definitions

  type        = "zip"
  source_file = "${path.module}/../tweeter-server/dist/lambda/${each.value.source_file}"
  output_path = "${path.module}/${trimsuffix(basename(each.value.source_file), ".js")}.zip"
}

resource "aws_lambda_function" "lambda" {
  for_each = local.lambda_definitions

  function_name = each.value.function_name
  role          = aws_iam_role.lambda_execution.arn
  runtime       = "nodejs22.x"
  handler       = each.value.handler

  filename         = data.archive_file.lambda[each.key].output_path
  source_code_hash = data.archive_file.lambda[each.key].output_base64sha256

  depends_on = [aws_iam_role_policy_attachment.lambda_logging]
}
