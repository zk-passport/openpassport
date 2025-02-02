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

# Set a payload; here we're using an empty JSON object.
PAYLOAD='{}'
RESPONSE_FILE="response.json"

echo "Invoking Lambda function: ${FUNCTION_NAME} with payload: ${PAYLOAD}"
aws lambda invoke \
  --function-name "$FUNCTION_NAME" \
  --payload "$PAYLOAD" \
  --profile "$AWS_PROFILE" \
  --region "$AWS_REGION" \
  "${RESPONSE_FILE}" \
  --log-type Tail \
  --query 'LogResult' \
  --output text | base64 -d

echo -e "\nLambda Response:"
cat "${RESPONSE_FILE}" | jq '.'
