const { ObjectId } = require('mongodb');
const { downloadFromGridFS, getFileInfo } = require('../utils/gridfsStorage');

/**
 * @desc    Serve image from GridFS
 * @route   GET /api/images/:id
 * @access  Public
 */
const getImage = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image ID'
      });
    }

    // Get file info for content-type and length
    const fileInfo = await getFileInfo(id);

    if (!fileInfo) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Set response headers
    res.set('Content-Type', fileInfo.contentType || 'image/jpeg');
    res.set('Content-Length', fileInfo.length);
    res.set('Cache-Control', 'public, max-age=31536000'); // 1 year cache
    res.set('ETag', `"${fileInfo._id.toString()}"`);

    // Stream the file to response
    const downloadStream = downloadFromGridFS(id);

    downloadStream.on('error', (error) => {
      console.error('GridFS download error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error downloading image'
        });
      }
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error('Image controller error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = { getImage };
