# Partially written by AI.

data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "user_images" {
  bucket = "tweeter-user-images-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_public_access_block" "user_images" {
  bucket = aws_s3_bucket.user_images.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_ownership_controls" "user_images" {
  bucket = aws_s3_bucket.user_images.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}
