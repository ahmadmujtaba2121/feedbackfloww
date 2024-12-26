
// src/config/environment.ts
export const config = {
    port: process.env.PORT || 5000,
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/feedbackflow'
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'your-default-secret',
      expiresIn: '7d'
    }
  };
  