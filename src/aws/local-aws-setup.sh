#!/bin/sh

# Setup steps for working with LocalStack instead of AWS.
# Assumes aws cli is installed and LocalStack is running.

# Setup AWS environment variables
echo "Setting AWS environment variables for LocalStack"

echo "AWS_ACCESS_KEY_ID=test"
export AWS_ACCESS_KEY_ID=test

echo "AWS_SECRET_ACCESS_KEY=test"
export AWS_SECRET_ACCESS_KEY=test

echo "AWS_SESSION_TOKEN=test"
export AWS_SESSION_TOKEN=test

export AWS_DEFAULT_REGION=us-east-1
echo "AWS_DEFAULT_REGION=us-east-1"

# Wait for LocalStack to be ready, by inspecting the response from healthcheck
echo 'Waiting for LocalStack S3...'
until (curl --silent http://localhost:4566/_localstack/health | grep "\"s3\": \"\(running\|available\)\"" > /dev/null); do
    sleep 5
done
echo 'LocalStack S3 Ready'

aws --endpoint-url=http://localhost:4566 s3api head-bucket --bucket starlog || \
aws --endpoint-url=http://localhost:4566 s3api create-bucket --bucket starlog
echo "LocalStack S3 bucket 'starlog' ready"

# Set CORS for React
aws --endpoint-url=http://localhost:4566 s3api put-bucket-cors \
  --bucket starlog \
  --cors-configuration '{
      "CORSRules": [
          {
              "AllowedOrigins": ["http://localhost:5173"],
              "AllowedMethods": ["GET"],
              "AllowedHeaders": ["*"]
          }
      ]
  }'

# Create our S3 bucket with LocalStack
echo "CORS configured for React app at http://localhost:5173"


