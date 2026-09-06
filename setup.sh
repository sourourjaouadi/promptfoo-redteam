#!/bin/bash

set -e

echo "🚀 Promptfoo Red Teaming: Automated Setup"
echo "=========================================="
echo ""

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
else
    echo "❌ Unsupported OS. Please set up manually."
    exit 1
fi

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check/Install Node.js
echo -e "${YELLOW}[1/7]${NC} Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    if [[ $OS == "macos" ]]; then
        brew install node
    else
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✓${NC} Node.js $NODE_VERSION"

# Step 2: Check/Install Python
echo -e "${YELLOW}[2/7]${NC} Checking Python..."
if ! command -v python3.11 &> /dev/null && ! command -v python3 &> /dev/null; then
    echo "Installing Python..."
    if [[ $OS == "macos" ]]; then
        brew install python@3.11
    else
        sudo apt-get install -y python3.11 python3.11-venv
    fi
fi
PYTHON_VERSION=$(python3 --version 2>&1)
echo -e "${GREEN}✓${NC} $PYTHON_VERSION"

# Step 3: Check/Install Git
echo -e "${YELLOW}[3/7]${NC} Checking Git..."
if ! command -v git &> /dev/null; then
    echo "Installing Git..."
    if [[ $OS == "macos" ]]; then
        brew install git
    else
        sudo apt-get install -y git
    fi
fi
GIT_VERSION=$(git --version)
echo -e "${GREEN}✓${NC} $GIT_VERSION"

# Step 4: Install Promptfoo
echo -e "${YELLOW}[4/7]${NC} Installing Promptfoo..."
npm install -g promptfoo
PROMPTFOO_VERSION=$(promptfoo --version)
echo -e "${GREEN}✓${NC} Promptfoo $PROMPTFOO_VERSION"

# Step 5: Check/Install Ollama
echo -e "${YELLOW}[5/7]${NC} Checking Ollama..."
if ! command -v ollama &> /dev/null; then
    echo "Installing Ollama..."
    if [[ $OS == "macos" ]]; then
        brew install ollama
    else
        curl https://ollama.ai/install.sh | sh
    fi
fi
echo -e "${GREEN}✓${NC} Ollama ready"

# Step 6: Create project structure
echo -e "${YELLOW}[6/7]${NC} Setting up project structure..."

mkdir -p config tests results scripts docs/reports

# Create package.json if not exists
if [ ! -f "package.json" ]; then
    cat > package.json << 'EOF'
{
  "name": "promptfoo-redteam",
  "version": "1.0.0",
  "description": "Red teaming framework for LLM security testing",
  "main": "index.js",
  "scripts": {
    "test:all": "promptfoo eval",
    "test:injection": "promptfoo eval --config config/injection.yaml",
    "test:jailbreak": "promptfoo eval --config config/jailbreak.yaml",
    "test:dataleak": "promptfoo eval --config config/dataleak.yaml",
    "results:view": "promptfoo view",
    "results:export": "node scripts/export-results.js"
  },
  "keywords": ["security", "red-teaming", "llm", "promptfoo"],
  "author": "",
  "license": "MIT",
  "devDependencies": {
    "dotenv": "^16.0.0",
    "json2csv": "^5.0.7",
    "axios": "^1.4.0",
    "csv-parser": "^3.0.0"
  }
}
EOF
fi

npm install

echo -e "${GREEN}✓${NC} Project structure ready"

# Step 7: Initialize Git
echo -e "${YELLOW}[7/7]${NC} Initializing Git repository..."
if [ ! -d ".git" ]; then
    git init
    git config user.name "Red Team Researcher"
    git config user.email "researcher@example.com"
fi
echo -e "${GREEN}✓${NC} Git initialized"

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Pull Llama model: ${YELLOW}ollama pull llama2${NC}"
echo "2. Start Ollama: ${YELLOW}ollama serve${NC} (in another terminal)"
echo "3. Review config files in ${YELLOW}config/${NC}"
echo "4. Run tests: ${YELLOW}npm run test:all${NC}"
echo ""
echo "Documentation: See ${YELLOW}PROMPTFOO_COMPLETE_GUIDE.md${NC}"
echo ""
