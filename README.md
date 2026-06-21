# TIDE - Privacy-First Chronic Wellness Tracker

**Your health data should belong to you. Not a server.**

TIDE is a local-first, account-free, AI-powered symptom and wellness tracker built specifically for chronic conditions like Endometriosis, PCOS, Fibromyalgia, and Autoimmune disorders.

## Features

### Core Functionality
- **Daily Symptom Check-In**: Custom condition-specific symptom packs with severity ratings (1-5)
- **Trigger Logging**: Track diet, sleep, stress, exercise, medications, and environmental factors
- **On-Device AI Insights**: Pattern recognition that never leaves your phone
- **Medication Tracker**: HRT, birth control, supplements with adherence tracking
- **Cycle Integration**: Symptom overlay with menstrual cycle for hormonal conditions
- **Export Reports**: Generate PDF/JSON reports to share with healthcare providers

### Privacy First
- ✅ No account required
- ✅ All data stored locally on device (SQLite)
- ✅ No cloud sync unless you choose encrypted backup
- ✅ On-device AI analysis
- ✅ HIPAA/GDPR compliant by design

### Supported Conditions
- Endometriosis
- PCOS (Polycystic Ovary Syndrome)
- Fibromyalgia
- Autoimmune Disorders

## Tech Stack

- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Database**: SQLite (expo-sqlite)
- **Navigation**: React Navigation
- **Date Handling**: date-fns
- **UI**: Custom components with modern cyan theme

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (or physical device with Expo Go)

### Installation

```bash
# Clone the repository
git clone https://github.com/namish373737-dotcom/Tide.git
cd Tide

# Install dependencies
npm install

# Start the development server
npm start
```

### Running the App

After starting the dev server:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on physical device

## Project Structure

```
tide/
├── App.tsx                 # Main app with tab navigation
├── app.json                # Expo configuration
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── src/
│   ├── types/
│   │   └── index.ts        # TypeScript interfaces & constants
│   ├── context/
│   │   └── AppContext.tsx  # Global state management
│   ├── utils/
│   │   └── database.ts     # SQLite setup & initialization
│   ├── components/
│   │   ├── SymptomSelector.tsx
│   │   ├── TriggerSelector.tsx
│   │   ├── DailyCheckIn.tsx
│   │   └── InsightsList.tsx
│   └── screens/
│       ├── HomeScreen.tsx      # Dashboard & today's check-in
│       ├── HistoryScreen.tsx   # Calendar view & past logs
│       ├── InsightsScreen.tsx  # AI patterns & correlations
│       └── SettingsScreen.tsx  # Condition selection & privacy
└── assets/                 # App icons and images
```

## Monetization (Future)

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | Up to 5 symptoms, basic charts, 7-day history |
| Pro Monthly | $4.99/mo | Unlimited symptoms, AI insights, PDF export, unlimited history |
| Pro Annual | $29.99/yr | Same as monthly, 50% discount |

## Roadmap

- [ ] Apple HealthKit / Google Health Connect integration
- [ ] PDF report generation with charts
- [ ] Encrypted iCloud/Google Drive backup
- [ ] Custom medication reminders
- [ ] Data visualization improvements
- [ ] Additional condition packs
- [ ] Multi-language support

## Medical Disclaimer

⚠️ **This app does not provide medical advice, diagnosis, or treatment.**

The information provided by TIDE is for educational and tracking purposes only. Always seek the advice of a qualified healthcare provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay seeking it because of something you have read in this app.

## License

MIT License - See LICENSE file for details

## Support

For issues, feature requests, or questions, please open an issue on GitHub.

---

Made with ❤️ for the chronic illness community. Your data belongs to you.
