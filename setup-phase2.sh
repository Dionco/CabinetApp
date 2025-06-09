#!/bin/bash

# Phase 2: Rabobank API Integration Setup Script
echo "🚀 Setting up Phase 2: Rabobank Developer API Integration"
echo "========================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the house-finance-tracker directory${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Phase 2 Setup Checklist:${NC}"
echo "1. ✅ Backend API structure"
echo "2. ✅ Frontend components" 
echo "3. 🔄 Installing dependencies"
echo "4. 🔄 Setting up environment"
echo "5. ⏳ Rabobank Developer Portal setup (manual)"
echo ""

# Install backend dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd backend
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Backend package.json not found${NC}"
    exit 1
fi

npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install backend dependencies${NC}"
    exit 1
fi

# Create .env file from example
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file from template${NC}"
    echo -e "${YELLOW}⚠️  Please update .env with your Rabobank API credentials${NC}"
else
    echo -e "${YELLOW}⚠️  .env file already exists${NC}"
fi

# Create certificates directory
mkdir -p certificates
echo -e "${GREEN}✅ Created certificates directory${NC}"

cd ..

# Install additional frontend dependencies
echo -e "${YELLOW}📦 Installing additional frontend dependencies...${NC}"
npm install axios react-router-dom
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend dependencies updated${NC}"
else
    echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
    exit 1
fi

# Create startup scripts
echo -e "${YELLOW}📝 Creating startup scripts...${NC}"

# Backend startup script
cat > start-backend.sh << 'EOF'
#!/bin/bash
cd backend
echo "🚀 Starting House Finance API on port 3001..."
npm run dev
EOF

# Full stack startup script  
cat > start-fullstack.sh << 'EOF'
#!/bin/bash

# Start backend
echo "🚀 Starting backend server..."
cd backend && npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "🚀 Starting frontend server..."
cd .. && npm start &
FRONTEND_PID=$!

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Trap interrupt signal
trap cleanup INT

echo "✅ Both servers running!"
echo "📊 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:3001"
echo "Press Ctrl+C to stop both servers"

# Wait for either process to exit
wait $BACKEND_PID $FRONTEND_PID
EOF

chmod +x start-backend.sh start-fullstack.sh

echo -e "${GREEN}✅ Startup scripts created${NC}"

# Display next steps
echo ""
echo -e "${BLUE}🎯 Next Steps for Phase 2 Implementation:${NC}"
echo ""
echo -e "${YELLOW}1. Rabobank Developer Portal Setup:${NC}"
echo "   • Visit: https://developer.rabobank.nl"
echo "   • Create developer account"
echo "   • Register your application"
echo "   • Get Client ID and Client Secret"
echo "   • Configure redirect URI: http://localhost:3000/callback"
echo ""

echo -e "${YELLOW}2. Update Configuration:${NC}"
echo "   • Edit backend/.env with your Rabobank credentials:"
echo "     - RABOBANK_CLIENT_ID=your_client_id"
echo "     - RABOBANK_CLIENT_SECRET=your_client_secret"
echo "     - JWT_SECRET=your_secret_key"
echo ""

echo -e "${YELLOW}3. Certificate Setup (Production):${NC}"
echo "   • Generate client certificates for Rabobank API"
echo "   • Place certificates in backend/certificates/"
echo "   • Update certificate paths in .env"
echo ""

echo -e "${YELLOW}4. Test the Setup:${NC}"
echo "   • Run: ./start-fullstack.sh"
echo "   • Open: http://localhost:3000"
echo "   • Check: http://localhost:3001/health"
echo ""

echo -e "${YELLOW}5. Frontend Integration:${NC}"
echo "   • Add BankConnection component to your main App"
echo "   • Add RealTimeSync component to dashboard"
echo "   • Add NotificationBell to header"
echo ""

# Show file structure
echo -e "${BLUE}📁 New File Structure:${NC}"
echo "house-finance-tracker/"
echo "├── backend/"
echo "│   ├── server.js           # Express API server"
echo "│   ├── routes/"
echo "│   │   ├── auth.js         # OAuth2 authentication"
echo "│   │   ├── rabobank.js     # Rabobank API integration"
echo "│   │   └── webhooks.js     # Real-time webhooks"
echo "│   ├── package.json        # Backend dependencies"
echo "│   ├── .env.example        # Environment template"
echo "│   └── certificates/       # SSL certificates"
echo "├── src/components/"
echo "│   ├── BankConnection.js   # OAuth2 connection UI"
echo "│   ├── RealTimeSync.js     # Sync status component"
echo "│   └── NotificationBell.js # Real-time notifications"
echo "├── start-backend.sh        # Backend startup"
echo "├── start-fullstack.sh      # Full stack startup"
echo "└── PHASE2_API_INTEGRATION.md # Implementation guide"
echo ""

echo -e "${GREEN}🎉 Phase 2 setup complete!${NC}"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "• PHASE2_API_INTEGRATION.md - Complete implementation guide"
echo "• Backend API docs at: http://localhost:3001/health"
echo ""

echo -e "${YELLOW}💡 Quick Start:${NC}"
echo "1. Get Rabobank API credentials from developer.rabobank.nl"
echo "2. Update backend/.env with your credentials"
echo "3. Run: ./start-fullstack.sh"
echo "4. Test bank connection in the app"
echo ""

echo -e "${BLUE}🔧 Development Status:${NC}"
echo "✅ Phase 1: CSV Import (Complete)"
echo "🔄 Phase 2: API Integration (Ready for testing)"
echo "⏳ Phase 3: Advanced Features (Planned)"
echo ""

echo -e "${GREEN}Ready to revolutionize your house finance tracking! 🏠💰${NC}"
