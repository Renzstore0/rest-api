'use strict';

const paymentRepo = require('../../repositories/paymentRepo');

module.exports = {
  method:     'GET',
  path:       '/admin/payment',
  middleware: ['secureAdmin'],

  async handler(req, res) {
    try {
      const orders = await paymentRepo.findRecent(100);
      res.json({
        success: true,
        data: orders.map((o) => ({
          orderCode:   o.order_code,
          email:       o.email,
          name:        o.name,
          role:        o.role,
          days:        o.days,
          totalAmount: o.total_amount,
          status:      o.status,
          createdAt:   o.created_at,
          paidAt:      o.paid_at
        }))
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
