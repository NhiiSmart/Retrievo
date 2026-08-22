const express = require('express');
const { getPresignedUrl } = require('../utils/s3');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/presigned', authenticateToken, async (req, res) => {
  try {
    const { filename, filetype } = req.query;
    if (!filename || !filetype) {
      return res.status(400).json({ error: 'Filename and filetype are required' });
    }

    const data = await getPresignedUrl(filename, filetype);
    res.json(data);
  } catch (error) {
    console.error(error);
    if (error.code === 'S3_NOT_CONFIGURED') {
      return res.status(503).json({ error: 'File uploads are not configured' });
    }
    res.status(500).json({ error: 'Failed to create presigned URL' });
  }
});

module.exports = router;
