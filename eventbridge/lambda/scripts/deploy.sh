#!/bin/bash
set -e

# Ensure we're in the lambda root directory
cd "$(dirname "$0")/.."

# Source environment variables from .env
if [ -f .env ]; then
  source .env
else
  echo ".env file not found! Please copy .env.example to .env and configure it."
  exit 1
fi

echo "Deploying Lambda function: $FUNCTION_NAME"

# Create build directory if it doesn't exist
mkdir -p build

# Create a deployable ZIP file
cd src
npm install --production
zip -r ../build/lambda.zip ./* ./node_modules
cd ..

# Check if the function exists
echo "Checking if the Lambda function exists..."
FUNCTION_EXISTS=$(aws lambda get-function --function-name "$FUNCTION_NAME" --profile "$AWS_PROFILE" --region "$AWS_REGION" 2>&1 || true)

if echo "$FUNCTION_EXISTS" | grep -q "ResourceNotFoundException"; then
  echo "Lambda function does not exist. Creating new function."
  aws lambda create-function \
    --function-name "$FUNCTION_NAME" \
    --timeout "$TIMEOUT" \
    --zip-file fileb://build/lambda.zip \
    --handler "$HANDLER" \
    --runtime "$RUNTIME" \
    --role "$ROLE_ARN" \
    --profile "$AWS_PROFILE" \
    --region "$AWS_REGION"
else
  echo "Lambda function exists. Updating code and configuration."
  # First update the function code
  aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file fileb://build/lambda.zip \
    --profile "$AWS_PROFILE" \
    --region "$AWS_REGION"

  echo "Waiting for code update to complete..."
  sleep 10  # Wait 10 seconds for the code update to complete

  echo "Updating function configuration..."
  # Then update the function configuration
  aws lambda update-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --timeout "$TIMEOUT" \
    --handler "$HANDLER" \
    --runtime "$RUNTIME" \
    --role "$ROLE_ARN" \
    --profile "$AWS_PROFILE" \
    --region "$AWS_REGION"
fi

echo "Deployment completed successfully."
