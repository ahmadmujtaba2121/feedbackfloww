# FeedbackFlow - Modern Design Collaboration Platform

![FeedbackFlow Banner](public/banner.png)

## 🚀 Overview

FeedbackFlow is a powerful design collaboration platform that enables teams to streamline their feedback process, manage projects efficiently, and collaborate in real-time. Built with React, Firebase, and modern web technologies, it offers a comprehensive suite of features for design teams.

## ✨ Features

### 🎨 Design Collaboration
- **Interactive Canvas**: Real-time drawing and annotation tools
- **Review System**: Structured feedback and review process
- **Version Control**: Track changes and maintain design history
- **Real-time Collaboration**: Multiple users can work simultaneously

### 📊 Project Management
- **Kanban Board**: Drag-and-drop task management
- **Calendar View**: Schedule and timeline management
- **Time Tracking**: Monitor project hours and productivity
- **Team Management**: Role-based access control

### 💬 Communication
- **Real-time Chat**: Project-specific chat rooms
- **Comment System**: Contextual feedback on designs
- **@mentions**: Tag team members in comments
- **Notifications**: Real-time updates and alerts

### 💰 Billing & Invoicing
- **Time-based Billing**: Automatic time tracking
- **Invoice Generation**: Professional invoice creation
- **Payment Integration**: Secure payment processing
- **Subscription Management**: Flexible pricing plans

### 🤖 AI Integration
- **AI Assistant**: Smart project insights
- **Automated Analysis**: Design pattern recognition
- **Smart Suggestions**: AI-powered recommendations

## 🛠 Technical Stack

- **Frontend**: React 18, Vite
- **Styling**: TailwindCSS, Framer Motion
- **State Management**: React Context
- **Backend**: Firebase
- **Real-time**: Firebase Realtime Database
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Deployment**: Vercel

## 📦 Installation

1. **Clone the repository**
\`\`\`bash
git clone https://github.com/ahmadmujtaba2921/feedbackflow.git
cd feedbackflow/client
\`\`\`

2. **Install dependencies**
\`\`\`bash
npm install
\`\`\`

3. **Environment Setup**
- Copy \`.env.example\` to \`.env\`
\`\`\`bash
cp .env.example .env
\`\`\`
- Update the Firebase configuration in \`.env\`:
\`\`\`env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_FIREBASE_DATABASE_URL=your_database_url
\`\`\`

4. **Start Development Server**
\`\`\`bash
npm run dev
\`\`\`

5. **Build for Production**
\`\`\`bash
npm run build
\`\`\`

## 🔧 Configuration

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication (Email/Password & Google)
3. Create a Firestore Database
4. Enable Storage
5. Add your web app and copy configuration
6. Update environment variables

### Pricing Integration

1. **Subscription Plans Setup**
- Navigate to \`src/pages/PricingPage.jsx\`
- Update pricing tiers in the \`pricingPlans\` array
- Customize features in \`planFeatures\` object

2. **Payment Integration**
- Set up your payment processor (Stripe recommended)
- Update \`handleSubscription\` function in \`src/services/subscriptionService.js\`
- Configure webhook endpoints

## 📁 Project Structure

\`\`\`
client/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Page components
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom hooks
│   ├── services/       # API services
│   ├── utils/          # Helper functions
│   ├── assets/         # Static assets
│   └── styles/         # Global styles
├── public/             # Public assets
└── config/             # Configuration files
\`\`\`

## 🔐 Security

- **Authentication**: Firebase Auth handles user authentication
- **Authorization**: Role-based access control
- **Data Security**: Firestore security rules
- **File Security**: Storage security rules
- **API Security**: Firebase App Check

## 🚀 Deployment

### Vercel Deployment

1. Install Vercel CLI:
\`\`\`bash
npm i -g vercel
\`\`\`

2. Deploy:
\`\`\`bash
vercel
\`\`\`

3. Configure environment variables in Vercel dashboard

### Manual Deployment

1. Build the project:
\`\`\`bash
npm run build
\`\`\`

2. Deploy the \`dist\` folder to your hosting provider

## 📱 Key Components

### Canvas Component
- Location: \`src/components/Canvas/Canvas.jsx\`
- Features: Drawing tools, annotations, real-time updates
- Usage: Main design collaboration interface

### Project Management
- Location: \`src/components/ProjectView.jsx\`
- Features: Project overview, file management, team coordination
- Usage: Central project management interface

### Time Tracking
- Location: \`src/components/TimeTracking/\`
- Features: Time logging, reporting, invoice generation
- Usage: Track project hours and generate invoices

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@feedbackflow.com or join our Slack channel.

## 🔄 Updates and Maintenance

- Regular updates via npm
- Security patches
- Feature additions
- Bug fixes

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://reactjs.org/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

---

Built with ❤️ by [Ahmad Mujtaba]
