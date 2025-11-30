# Script to push changes to Vercel PostgreSQL (Windows PowerShell)

Write-Host "🚀 Pushing database schema to Vercel..." -ForegroundColor Green

if (-not (Test-Path ".env.local")) {
    Write-Host "❌ .env.local not found!" -ForegroundColor Red
    Write-Host "Please create .env.local with POSTGRES_PRISMA_URL and POSTGRES_URL_NON_POOLING" -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install

Write-Host "🔄 Pushing schema to database..." -ForegroundColor Cyan
npm run db:push

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Schema pushed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to push schema" -ForegroundColor Red
    exit 1
}

Write-Host "🌱 Seeding database with initial data..." -ForegroundColor Cyan
npm run db:seed

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database seeded successfully!" -ForegroundColor Green
    Write-Host "🎉 Your Vercel PostgreSQL is ready to use!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Seeding completed with errors (optional step)" -ForegroundColor Yellow
}
