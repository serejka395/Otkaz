#!/bin/bash

# Script to push changes to Vercel PostgreSQL

echo "🚀 Pushing database schema to Vercel..."

if [ ! -f ".env.local" ]; then
    echo "❌ .env.local not found!"
    echo "Please create .env.local with POSTGRES_PRISMA_URL and POSTGRES_URL_NON_POOLING"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔄 Pushing schema to database..."
npm run db:push

if [ $? -eq 0 ]; then
    echo "✅ Schema pushed successfully!"
else
    echo "❌ Failed to push schema"
    exit 1
fi

echo "🌱 Seeding database with initial data..."
npm run db:seed

if [ $? -eq 0 ]; then
    echo "✅ Database seeded successfully!"
    echo "🎉 Your Vercel PostgreSQL is ready to use!"
else
    echo "⚠️ Seeding completed with errors (optional step)"
fi
