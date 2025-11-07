# Hype-Connect

A Next.js platform for event organizers to receive live hype messages from attendees during events. Get paid for bringing energy to the crowd!

## Features

- 🎉 **Live Event Hype** - Attendees can send real-time hype messages during events
- 💰 **Monetization** - Event organizers earn from hype messages via Paystack integration
- 🔐 **Secure Authentication** - Firebase Authentication for user management
- 📱 **Responsive Design** - Built with Tailwind CSS for mobile-first experience
- 🎨 **Modern UI** - Shadcn/ui components with custom theming
- 🔥 **Real-time Updates** - Firestore for live data synchronization

## Tech Stack

- **Framework**: Next.js 15.5 with App Router & Turbopack
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Authentication**: Firebase Auth
- **Database**: Cloud Firestore
- **Payments**: Paystack
- **Deployment**: Firebase Hosting

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase account
- Paystack account

### Installation

1. Clone the repository:

```bash
git clone https://github.com/Sohmteee/Hype-Connect.git
cd Hype-Connect
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

4. Fill in your credentials in `.env.local`:
   - Firebase configuration (from Firebase Console)
   - Paystack API keys (from Paystack Dashboard)
   - Firebase Admin SDK credentials (from Firebase Console > Project Settings > Service Accounts)

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
```

### Deployment

Deploy to Firebase Hosting:

```bash
firebase deploy
```

## Environment Variables

See `.env.example` for all required environment variables:

- `NEXT_PUBLIC_FIREBASE_*` - Firebase client configuration
- `FIREBASE_ADMIN_*` - Firebase Admin SDK credentials
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` - Paystack public key
- `PAYSTACK_SECRET_KEY` - Paystack secret key
- `NEXT_PUBLIC_APP_URL` - Your app URL

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── auth/              # Authentication pages (login, register)
│   ├── dashboard/         # User dashboard
│   ├── event/             # Event pages
│   └── api/               # API routes (webhooks)
├── components/            # React components
│   ├── ui/               # Shadcn/ui components
│   └── layout/           # Layout components
├── firebase/              # Firebase configuration & hooks
├── lib/                   # Utilities and types
└── services/              # Business logic & external services

```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details.

## Contact

For questions or support, reach out via GitHub issues.
