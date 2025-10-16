#!/bin/bash

# GitHub Actions Workflow Validation Script
# This script validates all workflow configurations

set -e

echo "🔍 Validating GitHub Actions Workflows"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for issues
issues=0

echo ""
echo "📋 Checking workflow files..."
echo ""

for workflow in .github/workflows/*.yml; do
    if [ -f "$workflow" ]; then
        echo "Checking: $(basename "$workflow")"

        # Check if file starts with 'name:'
        if ! grep -q "^name:" "$workflow"; then
            echo -e "  ${RED}❌ Missing workflow name${NC}"
            ((issues++))
        else
            echo -e "  ${GREEN}✅ Has workflow name${NC}"
        fi

        # Check if file has 'on:' triggers
        if ! grep -q "^on:" "$workflow"; then
            echo -e "  ${RED}❌ Missing workflow triggers${NC}"
            ((issues++))
        else
            echo -e "  ${GREEN}✅ Has workflow triggers${NC}"
        fi

        # Check if file has 'jobs:'
        if ! grep -q "^jobs:" "$workflow"; then
            echo -e "  ${RED}❌ Missing jobs section${NC}"
            ((issues++))
        else
            echo -e "  ${GREEN}✅ Has jobs section${NC}"
        fi

        # Check for permissions
        if grep -q "permissions:" "$workflow"; then
            echo -e "  ${GREEN}✅ Has permissions defined${NC}"
        else
            echo -e "  ${YELLOW}⚠️  No permissions defined (uses default)${NC}"
        fi

        # Check for deprecated actions
        if grep -q "@v1" "$workflow"; then
            echo -e "  ${YELLOW}⚠️  Uses v1 actions (consider updating)${NC}"
        else
            echo -e "  ${GREEN}✅ Uses current action versions${NC}"
        fi

        # Check for proper action references
        if grep -q "uses:" "$workflow"; then
            if grep -q "uses:.*@" "$workflow"; then
                echo -e "  ${GREEN}✅ Actions have version pins${NC}"
            else
                echo -e "  ${RED}❌ Actions without version pins${NC}"
                ((issues++))
            fi
        fi

        # Check for proper job structure
        if grep -q "^[a-zA-Z0-9_-]*:$" "$workflow"; then
            echo -e "  ${GREEN}✅ Proper job names${NC}"
        else
            echo -e "  ${RED}❌ Invalid job names${NC}"
            ((issues++))
        fi

        echo ""
    fi
done

echo "🔍 Checking for required files..."
echo ""

# Check for required files
required_files=(
    ".github/workflows/ci.yml"
    ".github/workflows/deploy.yml"
    ".github/workflows/scan.yml"
    ".env.example"
    "package.json"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✅ $file exists${NC}"
    else
        echo -e "  ${RED}❌ $file missing${NC}"
        ((issues++))
    fi
done

echo ""
echo "🔍 Checking package.json configuration..."
echo ""

# Check package.json for required scripts
required_scripts=(
    "build"
    "test"
    "lint"
    "dev"
    "start"
)

for script in "${required_scripts[@]}"; do
    if grep -q "\"$script\":" package.json; then
        echo -e "  ${GREEN}✅ npm run $script exists${NC}"
    else
        echo -e "  ${RED}❌ npm run $script missing${NC}"
        ((issues++))
    fi
done

echo ""
echo "🔍 Checking Next.js configuration..."
echo ""

if [ -f "next.config.js" ]; then
    # Check for static export configuration
    if grep -q "output: 'export'" next.config.js; then
        echo -e "  ${GREEN}✅ Static export configured${NC}"
    else
        echo -e "  ${RED}❌ Static export not configured${NC}"
        ((issues++))
    fi

    # Check for distDir configuration
    if grep -q "distDir: 'out'" next.config.js; then
        echo -e "  ${GREEN}✅ Output directory configured${NC}"
    else
        echo -e "  ${YELLOW}⚠️  Output directory not explicitly configured${NC}"
    fi
else
    echo -e "  ${RED}❌ next.config.js missing${NC}"
    ((issues++))
fi

echo ""
echo "🔍 Checking environment configuration..."
echo ""

if [ -f ".env.example" ]; then
    echo -e "  ${GREEN}✅ .env.example exists${NC}"

    # Check for important environment variables
    important_vars=(
        "NODE_ENV"
        "NEXT_PUBLIC_SITE_URL"
        "GITHUB_TOKEN"
    )

    for var in "${important_vars[@]}"; do
        if grep -q "^$var=" .env.example; then
            echo -e "  ${GREEN}✅ $var documented${NC}"
        else
            echo -e "  ${YELLOW}⚠️  $var not documented${NC}"
        fi
    done
else
    echo -e "  ${RED}❌ .env.example missing${NC}"
    ((issues++))
fi

echo ""
echo "======================================"
echo "📊 Validation Summary"
echo "======================================"

if [ $issues -eq 0 ]; then
    echo -e "${GREEN}✅ All validations passed!${NC}"
    echo ""
    echo "🚀 Your GitHub Actions workflows are ready to go!"
    echo ""
    echo "Next steps:"
    echo "1. Commit and push your changes"
    echo "2. Configure required secrets in GitHub repository settings"
    echo "3. Enable GitHub Pages in repository settings"
    echo "4. Test the workflows by triggering them manually"
    exit 0
else
    echo -e "${RED}❌ Found $issues issue(s) that need to be addressed${NC}"
    echo ""
    echo "Please fix the issues above before proceeding."
    exit 1
fi