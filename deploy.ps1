#!/usr/bin/env powershell
# Hype-Connect Firebase Deployment Script
# This script automates the Firebase deployment process

Write-Host "🚀 Hype-Connect Firebase Deployment" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Firebase CLI
Write-Host "Step 1: Checking Firebase CLI..." -ForegroundColor Yellow
try {
  firebase --version | Out-Null
  Write-Host "✅ Firebase CLI is installed" -ForegroundColor Green
}
catch {
  Write-Host "❌ Firebase CLI not found. Install it:" -ForegroundColor Red
  Write-Host "npm install -g firebase-tools" -ForegroundColor White
  exit 1
}

# Step 2: Check authentication
Write-Host ""
Write-Host "Step 2: Checking Firebase authentication..." -ForegroundColor Yellow
try {
  firebase projects:list | Out-Null
  Write-Host "✅ Firebase CLI authenticated" -ForegroundColor Green
}
catch {
  Write-Host "⚠️  Not authenticated. Running: firebase login" -ForegroundColor Yellow
  firebase login
}

# Step 3: Set project
Write-Host ""
Write-Host "Step 3: Setting active project..." -ForegroundColor Yellow
firebase use hype-connect-40b04
Write-Host "✅ Project set to hype-connect-40b04" -ForegroundColor Green

# Step 4: Install dependencies
Write-Host ""
Write-Host "Step 4: Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
  Write-Host "✅ Dependencies installed" -ForegroundColor Green
}
else {
  Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
  exit 1
}

# Step 5: Build the app
Write-Host ""
Write-Host "Step 5: Building Next.js app..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -eq 0) {
  Write-Host "✅ Build successful" -ForegroundColor Green
}
else {
  Write-Host "❌ Build failed" -ForegroundColor Red
  exit 1
}

# Step 6: Deploy
Write-Host ""
Write-Host "Step 6: Deploying to Firebase..." -ForegroundColor Yellow
firebase deploy --debug

if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "🎉 Deployment successful!" -ForegroundColor Green
  Write-Host ""
  Write-Host "Your app is now live! 🚀" -ForegroundColor Cyan
  Write-Host "Visit: https://console.firebase.google.com" -ForegroundColor White
  Write-Host ""
}
else {
  Write-Host ""
  Write-Host "❌ Deployment failed" -ForegroundColor Red
  Write-Host "Check the logs above for details" -ForegroundColor Yellow
  exit 1
}
