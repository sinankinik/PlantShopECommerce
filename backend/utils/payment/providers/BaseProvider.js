// backend/utils/payment/providers/BaseProvider.js

/**
 * Tüm ödeme sağlayıcısı adaptörleri için temel arayüzü (Base Class) tanımlar.
 * Her özel ödeme sağlayıcısı (örn. StripeProvider), bu sınıftan miras almalı
 * ve tanımlanan tüm metotları kendi implementasyonlarıyla sağlamalıdır.
 */
class BaseProvider {
    constructor(config) {
        if (new.target === BaseProvider) {
            throw new TypeError("BaseProvider doğrudan instantiate edilemez. Lütfen ondan türetilmiş bir sınıf kullanın.");
        }
        this.config = config; // Sağlayıcıya özel ayarlar (API anahtarları vb.)
    }

    /**
     * Yeni bir ödeme işlemi başlatır.
     * @param {object} paymentDetails - Ödeme detayları (amount, currency, orderId, userId, customerInfo vb.)
     * @returns {Promise<object>} Ödeme işlem bilgileri (transactionId, redirectUrl vb.)
     */
    async createPayment(paymentDetails) {
        throw new Error('createPayment metodu türetilmiş sınıflar tarafından implemente edilmelidir.');
    }

    /**
     * Bir ödeme işleminin durumunu sorgular.
     * @param {string} transactionId - Sorgulanacak işlem ID'si
     * @returns {Promise<object>} Ödeme durumu bilgileri (status, amount, currency vb.)
     */
    async getPaymentStatus(transactionId) {
        throw new Error('getPaymentStatus metodu türetilmiş sınıflar tarafından implemente edilmelidir.');
    }

    /**
     * Bir ödeme işlemini iade eder.
     * @param {string} transactionId - İade edilecek işlem ID'si
     * @param {number} amount - İade edilecek miktar (opsiyonel, tam iade için boş bırakılabilir)
     * @returns {Promise<object>} İade işlem bilgileri (refundId, status vb.)
     */
    async refundPayment(transactionId, amount) {
        throw new Error('refundPayment metodu türetilmiş sınıflar tarafından implemente edilmelidir.');
    }

    /**
     * Ödeme için gerekli olabilecek ek ayarları veya istemci tarafı anahtarları sağlar.
     * @returns {object} Sağlayıcıya özel yapılandırma bilgileri
     */
    getClientConfig() {
        throw new Error('getClientConfig metodu türetilmiş sınıflar tarafından implemente edilmelidir.');
    }

    // Gelecekte eklenebilecek diğer metotlar (örneğin: cancelPayment, capturePayment vb.)
}

module.exports = BaseProvider;