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
    unfollow = {
      function_name = "tweeter-unfollow"
      source_file   = "user/UnfollowLambdaLambda.js"
      handler       = "UnfollowLambdaLambda.handler"
      route         = "unfollow"
    }
    get_user = {
      function_name = "tweeter-get-user"
      source_file   = "user/GetUserLambdaLambda.js"
      handler       = "GetUserLambdaLambda.handler"
      route         = "user"
    }
    get_is_follower_status = {
      function_name = "tweeter-get-is-follower-status"
      source_file   = "user/GetIsFollowerStatusLambda.js"
      handler       = "GetIsFollowerStatusLambda.handler"
      route         = "is-follower-status"
    }
    get_follower_count = {
      function_name = "tweeter-get-follower-count"
      source_file   = "user/getFollowerCountLambda.js"
      handler       = "getFollowerCountLambda.handler"
      route         = "follower-count"
    }
    get_followee_count = {
      function_name = "tweeter-get-followee-count"
      source_file   = "user/GetFolloweeCountLambda.js"
      handler       = "GetFolloweeCountLambda.handler"
      route         = "followee-count"
    }
    follow = {
      function_name = "tweeter-follow"
      source_file   = "user/FollowLambda.js"
      handler       = "FollowLambda.handler"
      route         = "follow"
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
