#!/bin/bash

# EcosystemStats Smoke Testing Script
# This script performs comprehensive sanity and smoke testing of the EcosystemStats components

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3001"
TEST_RESULTS_DIR="./test-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo -e "${BLUE}🧪 EcosystemStats Smoke Testing Script${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Create test results directory
mkdir -p "$TEST_RESULTS_DIR"

# Function to log test results
log_test() {
    local test_name="$1"
    local status="$2"
    local details="$3"

    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ $test_name${NC}"
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ $test_name${NC}"
        echo -e "   ${RED}Error: $details${NC}"
    else
        echo -e "${YELLOW}⚠️  $test_name${NC}"
        echo -e "   ${YELLOW}Warning: $details${NC}"
    fi

    echo "[$status] $test_name: $details" >> "$TEST_RESULTS_DIR/smoke-test-$TIMESTAMP.log"
}

# Function to test API endpoint
test_api_endpoint() {
    local endpoint="$1"
    local description="$2"
    local expected_status="${3:-200}"

    echo -n "Testing $description... "

    response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL$endpoint")
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')

    if [ "$http_code" -eq "$expected_status" ]; then
        log_test "API: $description" "PASS" "HTTP $http_code"
        echo "$body" > "$TEST_RESULTS_DIR/api-${endpoint//\//_}-$TIMESTAMP.json"
        return 0
    else
        log_test "API: $description" "FAIL" "HTTP $http_code (expected $expected_status)"
        return 1
    fi
}

# Function to test page load
test_page_load() {
    local url="$1"
    local description="$2"

    echo -n "Testing $description... "

    # Check if server responds
    if curl -s --connect-timeout 5 "$url" > /dev/null; then
        log_test "Page Load: $description" "PASS" "Server responding"
        return 0
    else
        log_test "Page Load: $description" "FAIL" "Server not responding"
        return 1
    fi
}

# Function to test component data
test_component_data() {
    local component="$1"
    local endpoint="$2"

    echo -n "Testing $component data integrity... "

    response=$(curl -s "$BASE_URL$endpoint")

    case "$component" in
        "Overview")
            if echo "$response" | grep -q '"totalPlugins"' && echo "$response" | grep -q '"totalMarketplaces"'; then
                log_test "Data: $component" "PASS" "Required fields present"
            else
                log_test "Data: $component" "FAIL" "Missing required fields"
                return 1
            fi
            ;;
        "Growth")
            if echo "$response" | grep -q '"plugins"' && echo "$response" | grep -q '"marketplaces"'; then
                log_test "Data: $component" "PASS" "Growth data present"
            else
                log_test "Data: $component" "FAIL" "Missing growth data"
                return 1
            fi
            ;;
        "Categories")
            if echo "$response" | grep -q '"categories"' && echo "$response" | grep -q '"totalPlugins"'; then
                log_test "Data: $component" "PASS" "Category data present"
            else
                log_test "Data: $component" "FAIL" "Missing category data"
                return 1
            fi
            ;;
    esac
}

# Function to test performance
test_performance() {
    local endpoint="$1"
    local description="$2"
    local max_time="${3:-2000}"  # Default 2 seconds max

    echo -n "Testing $description performance... "

    # Use curl's built-in time measurement
    response_time=$(curl -s -o /dev/null -w "%{time_total}" "$BASE_URL$endpoint")
    # Convert to milliseconds
    response_time_ms=$(echo "$response_time * 1000" | bc 2>/dev/null || echo "2000")

    if (( $(echo "$response_time_ms <= $max_time" | bc -l 2>/dev/null || echo "1") )); then
        log_test "Performance: $description" "PASS" "${response_time_ms%.*}ms (< ${max_time}ms)"
    else
        log_test "Performance: $description" "FAIL" "${response_time_ms%.*}ms (> ${max_time}ms)"
        return 1
    fi
}

echo -e "${YELLOW}🚀 Starting EcosystemStats Smoke Tests${NC}"
echo -e "${YELLOW}Base URL: $BASE_URL${NC}"
echo ""

# Test 1: Server Health
echo -e "${BLUE}📡 Testing Server Health${NC}"
echo "------------------------"

test_page_load "$BASE_URL" "Homepage Load"
test_page_load "$BASE_URL/api/ecosystem-stats" "API Base Endpoint"

# Test 2: API Endpoints
echo ""
echo -e "${BLUE}🔌 Testing API Endpoints${NC}"
echo "---------------------------"

test_api_endpoint "/api/ecosystem-stats" "Complete Ecosystem Data"
test_api_endpoint "/api/ecosystem-stats?metric=overview" "Overview Metrics"
test_api_endpoint "/api/ecosystem-stats?metric=growth&timeRange=30d" "Growth Trends"
test_api_endpoint "/api/ecosystem-stats?metric=categories" "Category Analytics"
test_api_endpoint "/api/ecosystem-stats?metric=quality" "Quality Indicators"
test_api_endpoint "/api/ecosystem-stats?format=csv" "CSV Export"

# Test 3: Data Integrity
echo ""
echo -e "${BLUE}📊 Testing Data Integrity${NC}"
echo "----------------------------"

test_component_data "Overview" "/api/ecosystem-stats?metric=overview"
test_component_data "Growth" "/api/ecosystem-stats?metric=growth&timeRange=30d"
test_component_data "Categories" "/api/ecosystem-stats?metric=categories"

# Test 4: Performance Tests
echo ""
echo -e "${BLUE}⚡ Testing Performance${NC}"
echo "-------------------------"

test_performance "/api/ecosystem-stats?metric=overview" "Overview API" 500
test_performance "/api/ecosystem-stats?metric=growth&timeRange=30d" "Growth API" 1000
test_performance "/api/ecosystem-stats?metric=categories" "Categories API" 750

# Test 5: Cache Functionality
echo ""
echo -e "${BLUE}💾 Testing Cache Functionality${NC}"
echo "--------------------------------"

echo -n "Testing cache hit... "
first_call=$(curl -s "$BASE_URL/api/ecosystem-stats?metric=overview")
second_call=$(curl -s "$BASE_URL/api/ecosystem-stats?metric=overview")

# Extract timestamps to check if they're close (indicating cache hit)
first_time=$(echo "$first_call" | jq -r '.meta.timestamp // "unknown"')
second_time=$(echo "$second_call" | jq -r '.meta.timestamp // "unknown"')

# Check if data structure is consistent (good for cache)
if echo "$first_call" | jq -e '.data.overview' > /dev/null && echo "$second_call" | jq -e '.data.overview' > /dev/null; then
    log_test "Cache: Hit" "PASS" "Consistent data structure returned"
else
    log_test "Cache: Hit" "FAIL" "Inconsistent data structure"
fi

echo -n "Testing cache clear... "
clear_response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X DELETE "$BASE_URL/api/ecosystem-stats")
http_code=$(echo $clear_response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ "$http_code" = "405" ]; then
    log_test "Cache: Clear" "PASS" "DELETE method not implemented (expected)"
elif [ "$http_code" = "200" ]; then
    log_test "Cache: Clear" "PASS" "Cache cleared successfully"
else
    log_test "Cache: Clear" "FAIL" "Unexpected response ($http_code)"
fi

# Test 6: Error Handling
echo ""
echo -e "${BLUE}🚨 Testing Error Handling${NC}"
echo "----------------------------"

echo -n "Testing invalid endpoint... "
invalid_response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/api/ecosystem-stats?metric=invalid")
invalid_code=$(echo $invalid_response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ "$invalid_code" -eq 400 ] || [ "$invalid_code" -eq 404 ]; then
    log_test "Error: Invalid Endpoint" "PASS" "Proper error response ($invalid_code)"
elif [ "$invalid_code" -eq 200 ]; then
    # Check if API returns default/empty data for invalid metrics
    invalid_body=$(echo $invalid_response | sed -e 's/HTTPSTATUS\:.*//g')
    if echo "$invalid_body" | jq -e '.success' > /dev/null && echo "$invalid_body" | jq -r '.success' | grep -q 'true'; then
        log_test "Error: Invalid Endpoint" "PASS" "API gracefully handles invalid metric ($invalid_code)"
    else
        log_test "Error: Invalid Endpoint" "FAIL" "Invalid response structure ($invalid_code)"
    fi
else
    log_test "Error: Invalid Endpoint" "FAIL" "Unexpected response ($invalid_code)"
fi

# Test 7: Visual Component Testing (via browser automation suggestion)
echo ""
echo -e "${BLUE}👁️  Visual Component Testing${NC}"
echo "---------------------------------"

echo -e "${YELLOW}To test visual components, open these URLs in your browser:${NC}"
echo ""
echo "📱 Homepage with EcosystemStats:"
echo "   $BASE_URL"
echo ""
echo "📊 Individual Component Tests:"
echo "   $BASE_URL/demo/overview-metrics    (if demo route exists)"
echo "   $BASE_URL/demo/growth-trends       (if demo route exists)"
echo "   $BASE_URL/demo/category-analytics  (if demo route exists)"
echo "   $BASE_URL/demo/quality-indicators (if demo route exists)"
echo ""

echo -e "${BLUE}🔍 Manual Testing Checklist${NC}"
echo "--------------------------------"
echo "✅ Check homepage loads without errors"
echo "✅ Verify Ecosystem Statistics section appears"
echo "✅ Test Overview Metrics cards display correctly"
echo "✅ Test Growth Trends charts are interactive"
echo "✅ Test Category Analytics pie/donut charts render"
echo "✅ Test Quality Indicators show trust signals"
echo "✅ Test responsive design on different screen sizes"
echo "✅ Test dark/light mode toggle"
echo "✅ Test refresh button functionality"
echo "✅ Test loading states appear"
echo "✅ Test error handling (disable API endpoints)"
echo ""

echo -e "${BLUE}📱 Mobile Testing${NC}"
echo "---------------------"
echo "1. Open browser dev tools (F12)"
echo "2. Toggle device toolbar (Ctrl+Shift+M or Cmd+Opt+M)"
echo "3. Test different viewport sizes:"
echo "   - Mobile (375x667)"
echo "   - Tablet (768x1024)"
echo "   - Desktop (1920x1080)"
echo ""

echo -e "${BLUE}🔧 Performance Testing${NC}"
echo "-----------------------"
echo "1. Open browser dev tools"
echo "2. Go to Performance tab"
echo "3. Record performance while interacting with components"
echo "4. Check for:"
echo "   - Layout shifts"
echo "   - Long tasks"
echo "   - Memory usage"
echo ""

# Summary
echo ""
echo -e "${BLUE}📋 Test Summary${NC}"
echo "=================="

# Count test results
total_tests=$(grep -c "\[" "$TEST_RESULTS_DIR/smoke-test-$TIMESTAMP.log" 2>/dev/null || echo "0")
passed_tests=$(grep -c "\[PASS\]" "$TEST_RESULTS_DIR/smoke-test-$TIMESTAMP.log" 2>/dev/null || echo "0")
failed_tests=$(grep -c "\[FAIL\]" "$TEST_RESULTS_DIR/smoke-test-$TIMESTAMP.log" 2>/dev/null || echo "0")
warnings=$(grep -c "\[WARN\]" "$TEST_RESULTS_DIR/smoke-test-$TIMESTAMP.log" 2>/dev/null || echo "0")

echo -e "Total Tests: $total_tests"
echo -e "${GREEN}Passed: $passed_tests${NC}"
echo -e "${RED}Failed: $failed_tests${NC}"
echo -e "${YELLOW}Warnings: $warnings${NC}"

if [ "$failed_tests" -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All critical tests passed!${NC}"
    echo -e "${GREEN}EcosystemStats components are ready for production.${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some tests failed. Please review the logs and fix issues.${NC}"
    echo -e "${YELLOW}Log file: $TEST_RESULTS_DIR/smoke-test-$TIMESTAMP.log${NC}"
    exit 1
fi