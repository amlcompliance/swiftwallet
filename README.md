# SwiftWallet

This workspace now contains a database-backed wallet platform built with Next.js, Prisma, SQLite, and NextAuth.

Features:
- real authentication with credentials login
- persistent merchant accounts and transactions
- file uploads for profile images
- money movement tracked in the database
- dashboard, profile, and transaction history screens
- SwiftPay collection, QRPH, payment-link, disbursement, and callback handling

Run locally:
- npm install
- npx prisma db push
- paste your SwiftPay keys into .env.local
- npm run dev

Open http://localhost:3000

SwiftPay setup:
- set SWIFTPAY_ACCESS_KEY and SWIFTPAY_SECRET_KEY
- set SWIFTPAY_MODE=sandbox for test mode or production for live mode
- set NEXT_PUBLIC_APP_URL to your app URL, for example http://localhost:3000