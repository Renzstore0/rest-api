'use strict';

const userRepo = require('../../repositories/userRepo');

module.exports = {
  method:     'GET',
  path:       '/admin/role',
  middleware: ['secureAdmin'],

  async handler(req, res) {
    try {
      const { email } = req.query;
      if (!email || typeof email !== 'string' || !email.includes('@'))
        return res.status(400).json({ success: false, message: 'Valid email is required' });

      const user = await userRepo.findByEmailAdmin(email.trim().toLowerCase());
      if (!user)
        return res.status(404).json({ success: false, message: 'No account found with that email' });

      res.json({
        success: true,
        data: {
          id:             user.id,
          name:           user.name,
          email:          user.email,
          role:           user.role,
          role_expires_at: user.role_expires_at || null,
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
