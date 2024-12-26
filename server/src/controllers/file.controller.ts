import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: 'dysa2jeyb',
  api_key: '351424651987487',
  api_secret: 'rqZlcPCwSCH6wDiQ8eiGgvLNrPY' // Your actual API secret
});

export const deleteFile = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({ message: 'Public ID is required' });
    }

    console.log('Received URL for deletion:', publicId);

    // Extract the public ID from the Cloudinary URL
    // Example URL: https://res.cloudinary.com/dysa2jeyb/image/upload/v1234567890/folder/filename.jpg
    const matches = publicId.match(/\/v\d+\/(.+)\.[^.]+$/);
    if (!matches) {
      return res.status(400).json({ message: 'Invalid Cloudinary URL format' });
    }

    const extractedPublicId = matches[1];
    console.log('Extracted public ID:', extractedPublicId);

    // Use the Cloudinary SDK to delete the file
    const result = await cloudinary.uploader.destroy(extractedPublicId);

    console.log('Cloudinary deletion response:', result);

    if (result.result === 'ok') {
      return res.status(200).json({ message: 'File deleted successfully' });
    } else {
      return res.status(400).json({ message: 'Failed to delete file from Cloudinary' });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: errorMessage,
      details: JSON.stringify(error)
    });
  }
};
