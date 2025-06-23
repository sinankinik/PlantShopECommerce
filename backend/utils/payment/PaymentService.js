// backend/utils/payment/PaymentService.js

const StripeProvider = require('./providers/StripeProvider'); // Şimdilik sadece Stripe'ı varsayıyoruz
// const IyzicoProvider = require('./providers/IyzicoProvider'); // İyzico eklendiğinde import edilecek
const PaymentError = require('./PaymentError'); // Kendi özel hata sınıfımız

/**
 * Uygulamanın ödeme işlemlerini yöneten ana servis.
 * Aktif ödeme sağlayıcısını dinamik olarak seçer ve ilgili sağlayıcının metotlarını çağırır.
 */
class PaymentService {
    constructor() {
        this.activeProvider = null;
        this.initializeProvider();
    }

    /**
     * Aktif ödeme sağlayıcısını ortam değişkenlerine göre başlatır.
     * Bu metod, PaymentService objesi oluşturulduğunda otomatik çağrılır.
     */
    initializeProvider() {
        const providerName = process.env.ACTIVE_PAYMENT_PROVIDER; // .env dosyasından aktif sağlayıcıyı oku

        if (!providerName) {
            throw new Error('ACTIVE_PAYMENT_PROVIDER ortam değişkeni tanımlanmamış. Lütfen bir ödeme sağlayıcısı belirtin.');
        }

        let providerConfig;

        switch (providerName.toLowerCase()) {
            case 'stripe':
                // Stripe için gerekli config bilgileri (API anahtarları vb.)
                providerConfig = {
                    apiKey: process.env.STRIPE_SECRET_KEY,
                    publicKey: process.env.STRIPE_PUBLIC_KEY // İstemci tarafı için public key
                };
                if (!providerConfig.apiKey) {
                    throw new Error('Stripe API anahtarı (STRIPE_SECRET_KEY) .env dosyasında tanımlanmamış.');
                }
                this.activeProvider = new StripeProvider(providerConfig);
                break;
            // case 'iyzico':
            //     providerConfig = {
            //         apiKey: process.env.IYZICO_API_KEY,
            //         secretKey: process.env.IYZICO_SECRET_KEY
            //     };
            //     if (!providerConfig.apiKey || !providerConfig.secretKey) {
            //         throw new Error('Iyzico API anahtarları .env dosyasında tanımlanmamış.');
            //     }
            //     this.activeProvider = new IyzicoProvider(providerConfig);
            //     break;
            default:
                throw new Error(`Desteklenmeyen ödeme sağlayıcısı: ${providerName}. Lütfen ACTIVE_PAYMENT_PROVIDER değerini kontrol edin.`);
        }

        console.log(`Ödeme Servisi: '${providerName}' sağlayıcısı başarıyla başlatıldı.`);
    }

    /**
     * Yeni bir ödeme işlemi başlatır.
     * @param {object} paymentDetails - Ödeme detayları
     * @returns {Promise<object>} Ödeme işlem bilgileri
     */
    async createPayment(paymentDetails) {
        if (!this.activeProvider) {
            throw new PaymentError('Ödeme sağlayıcısı başlatılmamış.', 500);
        }
        try {
            return await this.activeProvider.createPayment(paymentDetails);
        } catch (error) {
            console.error('PaymentService - createPayment hatası:', error);
            // Sağlayıcıdan gelen hatayı PaymentError'a sararak fırlatıyoruz
            throw new PaymentError(`Ödeme oluşturulurken bir hata oluştu: ${error.message}`, error.statusCode || 500, true, error);
        }
    }

    /**
     * Bir ödeme işleminin durumunu sorgular.
     * @param {string} transactionId - İşlem ID'si
     * @returns {Promise<object>} Ödeme durumu bilgileri
     */
    async getPaymentStatus(transactionId) {
        if (!this.activeProvider) {
            throw new PaymentError('Ödeme sağlayıcısı başlatılmamış.', 500);
        }
        try {
            return await this.activeProvider.getPaymentStatus(transactionId);
        } catch (error) {
            console.error('PaymentService - getPaymentStatus hatası:', error);
            throw new PaymentError(`Ödeme durumu sorgulanırken bir hata oluştu: ${error.message}`, error.statusCode || 500, true, error);
        }
    }

    /**
     * Bir ödeme işlemini iade eder.
     * @param {string} transactionId - İade edilecek işlem ID'si
     * @param {number} amount - İade edilecek miktar
     * @returns {Promise<object>} İade işlem bilgileri
     */
    async refundPayment(transactionId, amount) {
        if (!this.activeProvider) {
            throw new PaymentError('Ödeme sağlayıcısı başlatılmamış.', 500);
        }
        try {
            return await this.activeProvider.refundPayment(transactionId, amount);
        } catch (error) {
            console.error('PaymentService - refundPayment hatası:', error);
            throw new PaymentError(`Ödeme iade edilirken bir hata oluştu: ${error.message}`, error.statusCode || 500, true, error);
        }
    }

    /**
     * Aktif ödeme sağlayıcısının istemci tarafı yapılandırmasını sağlar.
     * @returns {object} İstemci tarafı yapılandırma objesi
     */
    getClientConfig() {
        if (!this.activeProvider) {
            throw new PaymentError('Ödeme sağlayıcısı başlatılmamış.', 500);
        }
        return this.activeProvider.getClientConfig();
    }
}

// Singleton pattern: Uygulama boyunca tek bir PaymentService örneği olmasını sağlarız
module.exports = new PaymentService();