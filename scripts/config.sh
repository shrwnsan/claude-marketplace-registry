#!/bin/bash

# Configuration for Claude Marketplace Aggregator
# This script provides centralized configuration for maintenance and deployment scripts

# Repository Configuration
# Set these values to match your actual repository
GITHUB_ORG=${GITHUB_ORG:-"claude-marketplace"}
REPO_NAME=${REPO_NAME:-"claude-marketplace-aggregator"}
BASE_URL=${BASE_URL:-"https://${GITHUB_ORG}.github.io/${REPO_NAME}"}

# Development Configuration
NODE_ENV=${NODE_ENV:-"development"}
NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH:-"/${REPO_NAME}"}

# API Endpoints (static JSON files)
HEALTH_ENDPOINT="${BASE_URL}${NEXT_PUBLIC_BASE_PATH}/data/health.json"
STATUS_ENDPOINT="${BASE_URL}${NEXT_PUBLIC_BASE_PATH}/data/status.json"
METRICS_ENDPOINT="${BASE_URL}${NEXT_PUBLIC_BASE_PATH}/data/metrics.json"
ANALYTICS_ENDPOINT="${BASE_URL}${NEXT_PUBLIC_BASE_PATH}/data/analytics.json"

# Print configuration for debugging
echo "Configuration:"
echo "  GitHub Organization: ${GITHUB_ORG}"
echo "  Repository Name: ${REPO_NAME}"
echo "  Base URL: ${BASE_URL}"
echo "  Base Path: ${NEXT_PUBLIC_BASE_PATH}"
echo "  Environment: ${NODE_ENV}"
echo ""
echo "Endpoints:"
echo "  Health: ${HEALTH_ENDPOINT}"
echo "  Status: ${STATUS_ENDPOINT}"
echo "  Metrics: ${METRICS_ENDPOINT}"
echo "  Analytics: ${ANALYTICS_ENDPOINT}"
echo ""

# Export variables for use in other scripts
export GITHUB_ORG
export REPO_NAME
export BASE_URL
export NEXT_PUBLIC_BASE_PATH
export HEALTH_ENDPOINT
export STATUS_ENDPOINT
export METRICS_ENDPOINT
export ANALYTICS_ENDPOINT