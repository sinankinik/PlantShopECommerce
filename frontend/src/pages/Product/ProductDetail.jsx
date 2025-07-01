// src/pages/ProductDetail.jsx

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchProductById, clearSelectedProduct, clearProductError } from '../../features/product/productSlice';
import { addToCart } from '../../features/cart/cartSlice';
import { getReviewsByProductId, addReview, resetReviewsState } from '../../features/review/reviewsSlice';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const ProductDetail = () => {
    const { productId } = useParams();
    const dispatch = useDispatch();

    const { selectedProduct: product, loading, error } = useSelector((state) => state.products);
    const { loading: cartLoading, error: cartError } = useSelector((state) => state.cart);
    const { reviews, averageRating, status: reviewsStatus, error: reviewsError } = useSelector((state) => state.reviews);
    const { user } = useSelector((state) => state.auth);

    const [quantity, setQuantity] = useState(1);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [showReviewForm, setShowReviewForm] = useState(false);

    useEffect(() => {
        if (productId) {
            dispatch(fetchProductById(productId));
            dispatch(getReviewsByProductId(productId));
        }
        return () => {
            dispatch(clearSelectedProduct());
            dispatch(clearProductError());
            dispatch(resetReviewsState());
        };
    }, [productId, dispatch]);

    const handleAddToCart = () => {
        if (product && quantity > 0) {
            dispatch(addToCart({ productId: product.id, quantity }));
            alert(`${quantity} adet ${product.name} sepete eklendi!`);
        } else if (quantity <= 0) {
            alert('Lütfen geçerli bir miktar girin.');
        }
    };

    const handleAddReview = async (e) => {
        e.preventDefault();

        if (!user) {
            alert('Yorum yapabilmek için lütfen giriş yapın.');
            return;
        }
        if (reviewRating === 0 || reviewComment.trim() === '') {
            alert('Lütfen derecelendirme yapın ve bir yorum yazın.');
            return;
        }

        const resultAction = await dispatch(addReview({ productId, rating: reviewRating, comment: reviewComment }));

        if (addReview.fulfilled.match(resultAction)) {
            alert('Yorumunuz başarıyla eklendi!');
            setReviewRating(0);
            setReviewComment('');
            setShowReviewForm(false);
            dispatch(getReviewsByProductId(productId));
        } else {
            alert(`Yorum eklenirken hata oluştu: ${resultAction.payload || 'Bilinmeyen hata.'}`);
        }
    };

    if (loading) {
        return <div className="text-center py-8 text-gray-700">Ürün detayı yükleniyor...</div>;
    }

    if (error) {
        return <div className="text-center py-8 text-red-500">Ürün detayı yüklenirken hata oluştu: {error}</div>;
    }

    if (!product) {
        return <div className="text-center py-8 text-gray-600">Ürün bulunamadı.</div>;
    }

    return (
        <div className="container mx-auto p-4 my-8">
            <div className="flex flex-col md:flex-row bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="md:w-1/2">
                    <img
                        // GÜNCELLENMİŞ KISIM BURADA
                        src={product.image_url ? `http://localhost:5000/${product.image_url.replace(/\\/g, '/')}` : 'https://via.placeholder.com/500x500/cccccc/ffffff?text=Ürün+Görseli'}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="md:w-1/2 p-6">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">{product.name}</h1>
                    <p className="text-gray-600 text-lg mb-4">{product.description}</p>
                    <div className="flex items-baseline mb-4">
                        <p className="text-3xl font-bold text-green-700 mr-2">{product.price} TL</p>
                    </div>

                    <div className="mb-6">
                        <p className="text-gray-700 font-semibold">Stok Durumu: {product.stock_quantity > 0 ? `Stokta Var (${product.stock_quantity})` : 'Stokta Yok'}</p>
                        {product.category && (
                            <p className="text-gray-700 font-semibold">Kategori: {product.category.name}</p>
                        )}
                    </div>

                    <div className="flex items-center mb-4">
                        <label htmlFor="quantity" className="mr-2 text-gray-700">Miktar:</label>
                        <Input
                            id="quantity"
                            type="number"
                            min="1"
                            max={product.stock_quantity}
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock_quantity, parseInt(e.target.value) || 1)))}
                            className="w-20 p-2 border border-gray-300 rounded-md"
                        />
                    </div>

                    {cartError && <p className="text-red-500 text-sm mb-2">{cartError}</p>}
                    <Button
                        onClick={handleAddToCart}
                        className="w-full md:w-auto py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition duration-300"
                        disabled={product.stock_quantity === 0 || cartLoading || quantity > product.stock_quantity || quantity <= 0}
                    >
                        {cartLoading ? 'Ekleniyor...' : 'Sepete Ekle'}
                    </Button>
                </div>
            </div>

            ---

            {/* Yorumlar (Reviews) bölümü */}
            <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Ürün Yorumları</h2>

                {/* Ortalama Derecelendirme */}
                {reviews.length > 0 && (
                    <div className="mb-6">
                        <p className="text-xl font-semibold text-gray-700">
                            Ortalama Derecelendirme: <span className="text-yellow-500">{averageRating.toFixed(1)} / 5</span>
                        </p>
                    </div>
                )}

                {/* Yorum Bırak Butonu ve Formu */}
                {user ? (
                    <>
                        <Button
                            onClick={() => setShowReviewForm(!showReviewForm)}
                            className="mb-4 py-2 px-4 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 transition duration-300"
                        >
                            {showReviewForm ? 'Yorum Formunu Gizle' : 'Yorum Yap'}
                        </Button>

                        {showReviewForm && (
                            <form onSubmit={handleAddReview} className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
                                <h3 className="text-xl font-bold mb-4 text-gray-800">Yeni Yorum Bırak</h3>
                                <div className="mb-4">
                                    <label htmlFor="rating" className="block text-gray-700 font-bold mb-2">Derecelendirme:</label>
                                    <select
                                        id="rating"
                                        className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={reviewRating}
                                        onChange={(e) => setReviewRating(parseInt(e.target.value))}
                                        required
                                    >
                                        <option value="0">Seçin...</option>
                                        <option value="1">1 - Kötü</option>
                                        <option value="2">2 - Orta</option>
                                        <option value="3">3 - İyi</option>
                                        <option value="4">4 - Çok İyi</option>
                                        <option value="5">5 - Mükemmel</option>
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="comment" className="block text-gray-700 font-bold mb-2">Yorumunuz:</label>
                                    <textarea
                                        id="comment"
                                        className="shadow-sm appearance-none border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows="4"
                                        placeholder="Ürün hakkındaki düşüncelerinizi yazın..."
                                        value={reviewComment}
                                        onChange={(e) => setReviewComment(e.target.value)}
                                        required
                                    ></textarea>
                                </div>
                                <Button
                                    type="submit"
                                    className="py-2 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition duration-300"
                                    disabled={reviewsStatus === 'loading'}
                                >
                                    {reviewsStatus === 'loading' ? 'Yorum Gönderiliyor...' : 'Yorumu Gönder'}
                                </Button>
                                {reviewsStatus === 'failed' && <p className="text-red-500 text-sm mt-2">{reviewsError}</p>}
                            </form>
                        )}
                    </>
                ) : (
                    <p className="text-gray-600 mb-6">Yorum yapabilmek için lütfen <a href="/login" className="text-blue-600 hover:underline">giriş yapın</a>.</p>
                )}

                {/* Yorum Listeleme */}
                {reviewsStatus === 'loading' && <div className="text-center py-4 text-gray-700">Yorumlar yükleniyor...</div>}
                {reviewsStatus === 'failed' && <div className="text-center py-4 text-red-500">Yorumlar yüklenirken hata oluştu: {reviewsError}</div>}

                {reviews.length > 0 ? (
                    <div className="space-y-6">
                        {reviews.map((review) => (
                            <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                                <div className="flex items-center mb-2">
                                    <p className="font-semibold text-gray-800">{review.user?.name || 'Anonim Kullanıcı'}</p>
                                    <div className="ml-4 flex text-yellow-500">
                                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                    </div>
                                </div>
                                <p className="text-gray-700 mb-2">{review.comment}</p>
                                <p className="text-sm text-gray-500">
                                    {new Date(review.createdAt).toLocaleDateString('tr-TR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    reviewsStatus === 'succeeded' && <div className="text-center py-4 text-gray-600">Bu ürün için henüz yorum bulunmamaktadır.</div>
                )}
            </div>
        </div>
    );
};

export default ProductDetail;