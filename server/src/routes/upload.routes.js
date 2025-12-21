const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');

/**
 * @route   POST /api/upload
 * @desc    Upload a file to Cloudinary
 * @access  Private (Authenticated users)
 */
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // req.file.path contains the URL of the uploaded file on Cloudinary
    res.json({
      message: 'File uploaded successfully',
      url: req.file.path,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error during upload' });
  }
});

module.exports = router;
