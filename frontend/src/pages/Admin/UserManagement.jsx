// src/pages/Admin/UserManagement.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchUsers, updateUser, deleteUser, clearUserError } from '../../features/user/userSlice';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/modal/Modal'; // Modal bileşeniniz olduğunu varsayıyorum
import { FaEdit, FaTrashAlt, FaSearch, FaUserPlus } from 'react-icons/fa'; // İkonlar için

const UserManagement = () => {
    const dispatch = useDispatch();
    const { items: users, loading, error, pagination } = useSelector((state) => state.users);

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentUserToEdit, setCurrentUserToEdit] = useState(null);
    const [editFormData, setEditFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        address: '',
        role: '',
        is_active: true,
    });

    // Kullanıcıları yükle
    useEffect(() => {
        const params = {
            page: currentPage,
            limit: 10, // Sayfa başına 10 kullanıcı gösterelim
        };
        if (searchTerm) {
            params.search = searchTerm;
        }
        dispatch(fetchUsers(params));

        // Hata durumunda konsola yazdır ve temizle
        if (error) {
            console.error("Kullanıcıları yüklerken hata oluştu:", error);
            // alert(`Hata: ${error}`); // Kullanıcıya göstermek isterseniz
            dispatch(clearUserError());
        }
    }, [dispatch, currentPage, searchTerm, error]); // error'u bağımlılık olarak ekledim ki hata durumunda useEffect yeniden çalışmasın

    // Arama terimi değiştiğinde sayfayı sıfırla ve yeniden ara
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Arama yapıldığında sayfayı 1'e sıfırla
    };

    // Sayfa değiştirme
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Kullanıcı düzenleme modalını aç
    const handleEditClick = (user) => {
        setCurrentUserToEdit(user);
        setEditFormData({
            username: user.username,
            email: user.email,
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            phone_number: user.phone_number || '',
            address: user.address || '',
            role: user.role,
            is_active: user.is_active,
        });
        setShowEditModal(true);
    };

    // Düzenleme formundaki input değişikliklerini yönet
    const handleEditFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    // Kullanıcı güncelleme işlemini gönder
    const handleUpdateUser = async () => {
        if (!currentUserToEdit) return;

        // Sadece değişen alanları göndermek için bir kontrol ekleyelim
        const updatedFields = {};
        for (const key in editFormData) {
            if (editFormData[key] !== currentUserToEdit[key]) {
                updatedFields[key] = editFormData[key];
            }
        }

        // is_active değeri boolean olarak gönderilmeli
        if (updatedFields.hasOwnProperty('is_active')) {
            updatedFields.is_active = Boolean(updatedFields.is_active);
        }

        if (Object.keys(updatedFields).length > 0) {
            const resultAction = await dispatch(updateUser({ userId: currentUserToEdit.id, userData: updatedFields }));
            if (updateUser.fulfilled.match(resultAction)) {
                setShowEditModal(false);
                setCurrentUserToEdit(null);
                // Başarılı güncelleme sonrası listeyi yeniden çekmek yerine, Redux slice'ı otomatik olarak güncellenen kullanıcıyı listeye entegre edecektir.
                // Eğer backend sadece güncellenen alanları değil, tüm user objesini dönüyorsa, slice'daki 'findIndex' mantığı bunu halleder.
                // Eğer frontend'de tam güncel listeye ihtiyacınız varsa, dispatch(fetchUsers(params)); çağırabilirsiniz.
                // Ancak şu anki slice mantığıyla buna gerek kalmamalı.
            } else {
                alert(`Kullanıcı güncelleme hatası: ${resultAction.payload || 'Bilinmeyen Hata'}`);
            }
        } else {
            alert('Güncellenecek bir değişiklik yok.');
            setShowEditModal(false);
        }
    };

    // Kullanıcı silme (pasifize etme) işlemi
    const handleDeleteUser = async (userId, username) => {
        if (window.confirm(`${username} adlı kullanıcıyı silmek istediğinizden emin misiniz? (Bu işlem kullanıcıyı pasifize eder)`)) {
            const resultAction = await dispatch(deleteUser(userId));
            if (deleteUser.fulfilled.match(resultAction)) {
                // Başarılı silme (pasifize etme) sonrası liste otomatik güncellenmeli
                alert(`${username} adlı kullanıcı başarıyla pasifize edildi.`);
            } else {
                alert(`Kullanıcı silme hatası: ${resultAction.payload || 'Bilinmeyen Hata'}`);
            }
        }
    };

    if (loading && users.length === 0) {
        return <LoadingSpinner />;
    }

    if (error && users.length === 0) { // Sadece initial load hatasında tüm sayfayı kapla
        return <div className="text-center py-8 text-red-500">Hata: {error}</div>;
    }

    return (
        <div className="container mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Kullanıcı Yönetimi</h1>

            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div className="relative w-full md:w-1/3">
                    <Input
                        id="searchUsers"
                        type="text"
                        placeholder="Kullanıcı adı veya e-posta ile ara..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="pl-10"
                    />
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                {/* Yeni kullanıcı ekleme butonu (isteğe bağlı olarak) */}
                <Link to="/admin/users/new"> {/* Yeni kullanıcı ekleme sayfası veya modalı */}
                    <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
                        <FaUserPlus /> Yeni Kullanıcı Ekle
                    </Button>
                </Link>
            </div>

            {users.length === 0 && !loading && !error ? (
                <p className="text-center text-gray-600 py-8">Gösterilecek kullanıcı bulunamadı.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">ID</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Kullanıcı Adı</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">E-posta</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Rol</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Aktif</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Doğrulanmış</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="py-3 px-4 text-sm text-gray-700">{user.id}</td>
                                    <td className="py-3 px-4 text-sm text-gray-700">{user.username}</td>
                                    <td className="py-3 px-4 text-sm text-gray-700">{user.email}</td>
                                    <td className="py-3 px-4 text-sm text-gray-700 capitalize">{user.role}</td>
                                    <td className="py-3 px-4 text-sm text-gray-700">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {user.is_active ? 'Evet' : 'Hayır'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-700">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {user.is_verified ? 'Evet' : 'Hayır'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-700 flex space-x-2">
                                        <Button
                                            onClick={() => handleEditClick(user)}
                                            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full"
                                            title="Düzenle"
                                        >
                                            <FaEdit />
                                        </Button>
                                        <Button
                                            onClick={() => handleDeleteUser(user.id, user.username)}
                                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
                                            title="Sil"
                                            disabled={user.role === 'admin'} // Admin kullanıcısını silmeyi engelle
                                        >
                                            <FaTrashAlt />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Sayfalama Kontrolleri */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center mt-6 space-x-2">
                    <Button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="bg-gray-300 text-gray-800 hover:bg-gray-400"
                    >
                        Önceki
                    </Button>
                    {[...Array(pagination.totalPages)].map((_, index) => (
                        <Button
                            key={index + 1}
                            onClick={() => handlePageChange(index + 1)}
                            className={currentPage === index + 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'}
                        >
                            {index + 1}
                        </Button>
                    ))}
                    <Button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pagination.totalPages}
                        className="bg-gray-300 text-gray-800 hover:bg-gray-400"
                    >
                        Sonraki
                    </Button>
                </div>
            )}

            {/* Kullanıcı Düzenleme Modalı */}
            <Modal show={showEditModal} onClose={() => setShowEditModal(false)} title="Kullanıcıyı Düzenle">
                {currentUserToEdit && (
                    <form onSubmit={(e) => { e.preventDefault(); handleUpdateUser(); }} className="space-y-4">
                        <Input
                            label="Kullanıcı Adı"
                            id="username"
                            name="username"
                            value={editFormData.username}
                            onChange={handleEditFormChange}
                            type="text"
                            disabled // Kullanıcı adının direkt değiştirilmesini engelledik, gerekirse açılabilir
                        />
                        <Input
                            label="E-posta"
                            id="email"
                            name="email"
                            value={editFormData.email}
                            onChange={handleEditFormChange}
                            type="email"
                            disabled // E-posta adresinin direkt değiştirilmesini engelledik
                        />
                        <Input
                            label="İsim"
                            id="first_name"
                            name="first_name"
                            value={editFormData.first_name}
                            onChange={handleEditFormChange}
                            type="text"
                        />
                        <Input
                            label="Soyisim"
                            id="last_name"
                            name="last_name"
                            value={editFormData.last_name}
                            onChange={handleEditFormChange}
                            type="text"
                        />
                        <Input
                            label="Telefon Numarası"
                            id="phone_number"
                            name="phone_number"
                            value={editFormData.phone_number}
                            onChange={handleEditFormChange}
                            type="text"
                        />
                        <Input
                            label="Adres"
                            id="address"
                            name="address"
                            value={editFormData.address}
                            onChange={handleEditFormChange}
                            type="text"
                        />

                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                                Rol
                            </label>
                            <select
                                id="role"
                                name="role"
                                value={editFormData.role}
                                onChange={handleEditFormChange}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            >
                                <option value="user">Kullanıcı</option>
                                <option value="admin">Admin</option>
                                <option value="seller">Satıcı</option>
                            </select>
                        </div>

                        <div className="flex items-center">
                            <input
                                id="is_active"
                                name="is_active"
                                type="checkbox"
                                checked={editFormData.is_active}
                                onChange={handleEditFormChange}
                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                                Aktif
                            </label>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <Button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800"
                            >
                                İptal
                            </Button>
                            <Button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={loading}
                            >
                                {loading ? 'Kaydediliyor...' : 'Kaydet'}
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default UserManagement;