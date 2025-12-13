#!/bin/bash

# Script para crear recursos de AWS en LocalStack
# Uso: ./scripts/setup-localstack-events.sh

echo "🚀 Setting up LocalStack resources for Event Bus..."

LOCALSTACK_ENDPOINT="http://localhost:4567"
AWS_REGION="us-east-1"

# Esperar a que LocalStack esté listo
echo "⏳ Waiting for LocalStack to be ready..."
until aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$AWS_REGION sqs list-queues 2>/dev/null; do
  echo "   LocalStack not ready yet, retrying in 2s..."
  sleep 2
done
echo "✅ LocalStack is ready!"

echo ""
echo "📋 Creating SQS Queue..."
aws --endpoint-url=$LOCALSTACK_ENDPOINT \
    --region=$AWS_REGION \
    sqs create-queue \
    --queue-name auth-events-queue

QUEUE_URL=$(aws --endpoint-url=$LOCALSTACK_ENDPOINT \
    --region=$AWS_REGION \
    sqs get-queue-url \
    --queue-name auth-events-queue \
    --query 'QueueUrl' \
    --output text)

echo "✅ SQS Queue created: $QUEUE_URL"

echo ""
echo "📢 Creating SNS Topic..."
TOPIC_ARN=$(aws --endpoint-url=$LOCALSTACK_ENDPOINT \
    --region=$AWS_REGION \
    sns create-topic \
    --name auth-events \
    --query 'TopicArn' \
    --output text)

echo "✅ SNS Topic created: $TOPIC_ARN"

echo ""
echo "🔗 Subscribing SQS Queue to SNS Topic..."
aws --endpoint-url=$LOCALSTACK_ENDPOINT \
    --region=$AWS_REGION \
    sns subscribe \
    --topic-arn $TOPIC_ARN \
    --protocol sqs \
    --notification-endpoint "arn:aws:sqs:us-east-1:000000000000:auth-events-queue"

echo "✅ Subscription created"

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📝 Add these to your .env file:"
echo "EVENT_BUS_TYPE=sqs  # or sns"
echo "SQS_QUEUE_URL=$QUEUE_URL"
echo "SNS_TOPIC_ARN=$TOPIC_ARN"
echo ""
echo "🧪 Test receiving messages:"
echo "aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$AWS_REGION sqs receive-message --queue-url $QUEUE_URL"
echo ""
