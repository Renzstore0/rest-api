'use strict';

const apiKeyRepo = require('../../repositories/apiKeyRepo');

module.exports = {
  method:     'POST',
  path:       '/apikey/rename',
  middleware: ['requireSession'],

  async handler(req, res) {
    try {
      const { name } = req.body;
      if (!name || !name.trim())
        return res.status(400).json({ success: false, message: 'Name is required.' });
      const savedName = await apiKeyRepo.renameKey(req.session.user.id, name);
      res.json({ success: true, data: { key_name: savedName } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
