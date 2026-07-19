'use strict';

const userRepo   = require('../../repositories/userRepo');
const apiKeyRepo = require('../../repositories/apiKeyRepo');

module.exports = {
  method:     'GET',
  path:       '/admin/apikey',
  middleware: ['secureAdmin'],

  async handler(req, res) {
    try {
      const { email } = req.query;
      if (!email || typeof email !== 'string' || !email.includes('@'))
        return res.status(400).json({ success: false, message: 'Valid email is required' });

      const user = await userRepo.findByEmailAdmin(email.trim().toLowerCase());
      if (!user)
        return res.status(404).json({ success: false, message: 'No account found with that email' });

      const key = await apiKeyRepo.findByUserId(user.id);
      res.json({
        success: true,
        data: key && {
          id:          key.id,
          key_name:    key.key_name,
          api_key:     key.api_key,
          total_limit: key.total_limit,
          used_count:  key.used_count
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
