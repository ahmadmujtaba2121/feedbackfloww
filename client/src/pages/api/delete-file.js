const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dysa2jeyb',
  api_key: '351424651987487',
  api_secret: process.env.REACT_APP_CLOUDINARY_API_SECRET,
  secure: true,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { publicId } = req.body;

  if (!publicId) {
    return res.status(400).json({ message: 'Public ID is required' });
  }

  try {
    // Delete the file from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      return res.status(200).json({ message: 'File deleted successfully' });
    } else {
      return res.status(400).json({ message: 'Failed to delete file from Cloudinary' });
    }
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    return res.status(500).json({ message: 'Server error occurred while deleting file' });
  }
}
