#!/bin/bash

# 🆓 FREE API Setup Script for BusMitra User App
# This script helps you set up your environment file with free API keys

echo "🚌 BusMitra User App - FREE API Setup"
echo "======================================"
echo ""

# Check if .env already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled. Your existing .env file is preserved."
        exit 1
    fi
fi

# Copy the example file
echo "📋 Creating .env file from template..."
cp env.example .env

echo "✅ .env file created successfully!"
echo ""
echo "🔧 Next Steps:"
echo "1. Edit the .env file and add your free API keys"
echo "2. Get free API keys from (NO CREDIT CARD REQUIRED):"
echo "   - TomTom: https://developer.tomtom.com/ (2500 requests/day)"
echo "   - Foursquare: https://developer.foursquare.com/ (1000 requests/day)"
echo ""
echo "❌ These APIs require credit card - NOT included:"
echo "   - Google Places API"
echo "   - HERE Maps API"
echo "   - MapBox API"
echo ""
echo "3. Restart the development server:"
echo "   npm run dev"
echo ""
echo "💡 The app works immediately without any API keys using Enhanced OpenStreetMap!"
echo "   Adding API keys will provide even better accuracy and coverage."
echo ""
echo "📚 For detailed setup instructions, see:"
echo "   - NO_CREDIT_CARD_APIS.md (Recommended)"
echo "   - FREE_SOLUTIONS_GUIDE.md"
echo "   - API_KEYS_SETUP.md"
