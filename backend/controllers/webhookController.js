const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Stripe secret key'inizi .env dosyasından alın
const orderController = require('./orderController'); // orderController'ı import edin

exports.handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature']; // Stripe imza başlığı
    let event;

    // Webhook secret'ınızı .env dosyasından alın
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET; 

    try {
        // Stripe olayını doğrulayın ve constructEvent ile bir event objesi oluşturun
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        // İmza doğrulaması başarısız olursa 400 Bad Request döndürün
        console.error(`⚠️ Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Olay türüne göre farklı işlemler yapın
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntentSucceeded = event.data.object;
            console.log(`PaymentIntent ${paymentIntentSucceeded.id} succeeded!`);
            // Sipariş durumunu güncelleme işini orderController'a devret
            await orderController.updateOrderStatusByPaymentIntent(paymentIntentSucceeded.id, 'completed');
            break;
        case 'payment_intent.payment_failed':
            const paymentIntentFailed = event.data.object;
            console.log(`PaymentIntent ${paymentIntentFailed.id} failed.`);
            // Sipariş durumunu güncelleme işini orderController'a devret
            await orderController.updateOrderStatusByPaymentIntent(paymentIntentFailed.id, 'failed');
            break;
        case 'charge.refunded':
            const chargeRefunded = event.data.object;
            console.log(`Charge ${chargeRefunded.id} was refunded.`);
            // Sipariş durumunu güncelleme işini orderController'a devret
            await orderController.updateOrderStatusByPaymentIntent(chargeRefunded.payment_intent, 'refunded');
            break;
        // Diğer olay türlerini de burada ele alabilirsiniz
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    // Stripe'a başarılı yanıt döndürün
    res.status(200).send('Webhook Received');
};

// Not: updateOrderStatus yardımcı fonksiyonu bu dosyadan kaldırıldı,
// çünkü artık iş orderController.js'ye devrediliyor.