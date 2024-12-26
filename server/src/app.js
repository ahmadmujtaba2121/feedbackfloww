const paypalRoutes = require('./routes/paypal');

// ... other middleware ...

// Routes
app.use('/api/paypal', paypalRoutes);

// ... rest of the code ... 