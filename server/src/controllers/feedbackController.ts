import { Request, Response } from 'express';
import { Feedback } from '../models/Feedback';
import nodemailer from 'nodemailer';

// Configure nodemailer with Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'andywhyie123@gmail.com',
    pass: 'qikn dwss bdnf znry' // Gmail App Password
  },
  tls: {
    rejectUnauthorized: false // Allow self-signed certificates
  }
});

const ADMIN_EMAIL = 'andywhyie123@gmail.com';

// Test the email connection
transporter.verify((error, success) => {
  if (error) {
    console.error('Email configuration error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

export const submitFeedback = async (req: Request, res: Response) => {
  try {
    const { userId, userEmail, rating, message, category } = req.body;

    // Validate required fields
    if (!userId || !userEmail || !rating || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Create feedback entry
    const feedback = new Feedback({
      userId,
      userEmail,
      rating,
      message,
      category: category || 'general'
    });

    // Save feedback to database
    try {
      await feedback.save();
    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Failed to save feedback to database'
      });
    }

    // Prepare email content
    const adminMailOptions = {
      from: ADMIN_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New Feedback: ${category} - Rating: ${rating}`,
      html: `
        <h2>New Feedback Received</h2>
        <p><strong>From:</strong> ${userEmail}</p>
        <p><strong>Category:</strong> ${category}</p>
        <p><strong>Rating:</strong> ${rating} stars</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    };

    const userMailOptions = {
      from: ADMIN_EMAIL,
      to: userEmail,
      subject: 'Thank you for your feedback - FeedbackFlow',
      html: `
        <h2>Thank You for Your Feedback!</h2>
        <p>Dear user,</p>
        <p>We have received your feedback and appreciate you taking the time to help us improve FeedbackFlow.</p>
        <p><strong>Your Feedback Details:</strong></p>
        <ul>
          <li>Category: ${category}</li>
          <li>Rating: ${rating} stars</li>
          <li>Message: ${message}</li>
        </ul>
        <p>We will carefully review your feedback and use it to enhance our service.</p>
        <p>Best regards,<br>The FeedbackFlow Team</p>
      `
    };

    // Send emails
    try {
      await Promise.all([
        transporter.sendMail(adminMailOptions),
        transporter.sendMail(userMailOptions)
      ]);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't return error here, still send success response since feedback was saved
    }

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback
    });
  } catch (error) {
    console.error('General error in submitFeedback:', error);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: error.message
    });
  }
};

export const getFeedback = async (req: Request, res: Response) => {
  try {
    const feedback = await Feedback.find()
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Error getting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get feedback',
      error: error.message
    });
  }
}; 