// src/server.ts
import 'dotenv/config';
import app from './app';
import { connectDB } from './config/database';
import { config } from './config/environment';

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB().then(() => {
  // Start server after successful DB connection
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});
