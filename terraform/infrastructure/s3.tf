# Generate a short random string for global uniqueness
resource "random_id" "suffix" {
  byte_length = 10
}

# Build the final lowercase, globally unique bucket name
locals {
  bucket_name = lower("${var.bucket_name}-${random_id.suffix.hex}")
}

resource "aws_s3_bucket" "media" {
  bucket = local.bucket_name
  force_destroy = true 

  tags = merge(var.tags, {
    Name = local.bucket_name
  })
}

# Keep bucket private; CF will read via OAC
resource "aws_s3_bucket_public_access_block" "media" {
  bucket                  = aws_s3_bucket.media.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "media" {
  bucket = aws_s3_bucket.media.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

output "s3_bucket_final_name" {
  value       = local.bucket_name
  description = "Final globally unique S3 bucket name."
}
