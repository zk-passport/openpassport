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

if [ -z "$FUNCTION_NAME" ]; then
  echo "FUNCTION_NAME is not set in the .env file."
  exit 1
fi

# The CloudWatch log group for Lambda functions follows the format: /aws/lambda/<FUNCTION_NAME>
LOG_GROUP="/aws/lambda/${FUNCTION_NAME}"

echo "Monitoring logs for Lambda function: ${FUNCTION_NAME} (Log Group: ${LOG_GROUP})"
aws logs tail "${LOG_GROUP}" --follow --profile "$AWS_PROFILE" --region "$AWS_REGION"
