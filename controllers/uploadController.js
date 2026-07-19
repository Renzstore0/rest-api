'use strict';

const { uploadFile: persistFromTmp, uploadImage: persistFromBuffer } = require('../services/imageUploadService');
const { success, error } = require('../utils/response');

function upload(req, res) {
  try {
    if (!req.uploadedTmp) return res.status(400).json(error('No file received'));
    res.json(success(persistFromTmp(req.uploadedTmp)));
  } catch (err) {
    res.status(400).json(error(err.message));
  }
}

const multipartUpload = (field) => (req, res) => {
  try {
    if (!req.file) return res.status(400).json(error(`No file received (expected multipart field "${field}")`));
    res.json(success(persistFromBuffer(req.file.buffer)));
  } catch (err) {
    res.status(400).json(error(err.message));
  }
};

module.exports = { upload, uploadImage: multipartUpload('image'), uploadFile: multipartUpload('file') };
