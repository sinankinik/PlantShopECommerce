const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Stripe Webhook Endpoint'i
// Bu rotaya gelen istekler için özel raw body parser, 
// server.js (veya ana uygulama dosyanızda) "/api/webhooks/stripe" rotası üzerinde doğrudan tanımlandığı için,
// burada tekrar özel bir middleware eklememize gerek yoktur.
// Yani, bu router tanımı, ana uygulama dosyasındaki route'a yönlendirilecek.
router.post('/stripe', webhookController.handleStripeWebhook);

module.exports = router;