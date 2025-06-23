// backend/utils/payment/providers/StripeProvider.js

const Stripe = require('stripe'); // Stripe kütüphanesini import et
const BaseProvider = require('./BaseProvider'); // Temel sağlayıcı sınıfını import et
const PaymentError = require('../PaymentError'); // Özel hata sınıfını import et

/**
 * Stripe ödeme sağlayıcısı adaptörü.
 * BaseProvider'dan miras alır ve Stripe API'sini kullanarak ödeme işlemlerini gerçekleştirir.
 */
class StripeProvider extends BaseProvider {
    constructor(config) {
        super(config); // BaseProvider constructor'ını çağır
        // Stripe secret key'ini config objesinden al ve Stripe objesini başlat
        if (!config.apiKey) {
            throw new Error('StripeProvider için API anahtarı (apiKey) eksik.');
        }
        this.stripe = new Stripe(config.apiKey);
        this.publicKey = config.publicKey; // İstemci tarafı için public key
    }

    /**
     * Yeni bir Stripe Payment Intent oluşturarak ödeme işlemini başlatır.
     * @param {object} paymentDetails - Ödeme detayları
     * @param {number} paymentDetails.amount - Ödeme miktarı (kuruluşun en küçük biriminde, örn. kuruş)
     * @param {string} paymentDetails.currency - Para birimi (örn. 'usd', 'try')
     * @param {string} paymentDetails.orderId - İlişkili sipariş ID'si
     * @param {string} [paymentDetails.description] - Ödeme açıklaması
     * @param {string} [paymentDetails.customerEmail] - Müşteri e-postası
     * @returns {Promise<object>} Stripe Payment Intent bilgileri
     */
    async createPayment(paymentDetails) {
        try {
            // Amount'ı Stripe'ın beklediği formata dönüştür (örn. TL için kuruş, USD için cent)
            // Varsayım: paymentDetails.amount zaten en küçük birimde geliyor (örn. 100 TL için 10000)
            const amountInSmallestUnit = paymentDetails.amount; // Eğer API'niz 100 TL gönderiyorsa, Stripe'a 10000 kuruş göndermeniz gerekir.

            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: amountInSmallestUnit,
                currency: paymentDetails.currency,
                description: paymentDetails.description || `Sipariş #${paymentDetails.orderId} için ödeme`,
                metadata: { order_id: paymentDetails.orderId, user_id: paymentDetails.userId }, // Ek bilgiler
                // capture_method: 'manual', // Eğer ödemeyi daha sonra onaylamak isterseniz
                // confirm: true, // Eğer ödemeyi hemen onaylamak isterseniz
            });

            // İstemciye geri dönecek önemli bilgileri seçiyoruz
            return {
                clientSecret: paymentIntent.client_secret, // İstemci tarafı ödeme için gerekli
                paymentIntentId: paymentIntent.id,
                status: paymentIntent.status,
                currency: paymentIntent.currency,
                amount: paymentIntent.amount // Döndürülen miktar, kuruş cinsinden
            };
        } catch (error) {
            console.error('Stripe createPayment hatası:', error);
            throw new PaymentError(
                error.message || 'Stripe ödeme başlatılırken bir hata oluştu.',
                error.statusCode || 500,
                true,
                error
            );
        }
    }

    /**
     * Bir Stripe Payment Intent'in durumunu sorgular.
     * @param {string} paymentIntentId - Sorgulanacak Payment Intent ID'si
     * @returns {Promise<object>} Ödeme durumu bilgileri
     */
    async getPaymentStatus(paymentIntentId) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

            return {
                paymentIntentId: paymentIntent.id,
                status: paymentIntent.status, // "requires_payment_method", "requires_confirmation", "requires_action", "processing", "succeeded", "canceled"
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                // Diğer ilgili bilgileri ekleyebilirsiniz
            };
        } catch (error) {
            console.error('Stripe getPaymentStatus hatası:', error);
            // Eğer paymentIntent bulunamazsa 404 gibi bir hata dönebilir
            const statusCode = error.rawType === 'invalid_request_error' && error.statusCode === 404 ? 404 : 500;
            throw new new PaymentError(
                error.message || 'Stripe ödeme durumu sorgulanırken bir hata oluştu.',
                statusCode,
                true,
                error
            );
        }
    }

    /**
     * Bir Stripe Payment Intent'i iade eder (tam veya kısmi).
     * @param {string} paymentIntentId - İade edilecek Payment Intent ID'si
     * @param {number} [amount] - İade edilecek miktar (kuruluşun en küçük biriminde, opsiyonel, tam iade için boş bırakılabilir)
     * @returns {Promise<object>} İade işlem bilgileri
     */
    async refundPayment(paymentIntentId, amount = null) {
        try {
            const refundOptions = {
                payment_intent: paymentIntentId,
            };
            if (amount !== null) {
                refundOptions.amount = amount;
            }

            const refund = await this.stripe.refunds.create(refundOptions);

            return {
                refundId: refund.id,
                paymentIntentId: refund.payment_intent,
                status: refund.status, // "pending", "succeeded", "failed", "canceled"
                amount: refund.amount, // İade edilen miktar
                currency: refund.currency,
            };
        } catch (error) {
            console.error('Stripe refundPayment hatası:', error);
            throw new PaymentError(
                error.message || 'Stripe ödeme iade edilirken bir hata oluştu.',
                error.statusCode || 500,
                true,
                error
            );
        }
    }

    /**
     * Stripe Public Key gibi istemci tarafında ihtiyaç duyulacak ayarları sağlar.
     * @returns {object} İstemci tarafı yapılandırma bilgileri
     */
    getClientConfig() {
        if (!this.publicKey) {
            throw new Error('Stripe public key (STRIPE_PUBLIC_KEY) tanımlanmamış. İstemci tarafı yapılandırması alınamadı.');
        }
        return {
            provider: 'stripe',
            publicKey: this.publicKey
        };
    }
}

module.exports = StripeProvider;