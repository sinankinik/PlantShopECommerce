// frontend/src/pages/Admin/EmailMarketingPage.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  sendMarketingEmail,
  clearNotificationError,
  clearNotificationMessage,
} from '../../features/notification/notificationSlice';
// userSlice'tan fetchAllUsers yerine fetchUsers'ı import ediyoruz
import { fetchUsers } from '../../features/user/userSlice'; 
import LoadingSpinner from '../../components/common/LoadingSpinner'; // Varsayılan bir spinner bileşeni

const EmailMarketingPage = () => {
  const dispatch = useDispatch();
  // userSlice'tan gelen 'items' (kullanıcı listesi) ve 'loading' (kullanıcı yükleme durumu) alıyoruz
  const { items: users, loading: usersLoading } = useSelector((state) => state.users); 
  const { loading, error, message, sentCount, failedCount } = useSelector((state) => state.notification); // E-posta gönderme durumu

  const [subject, setSubject] = useState('');
  const [messageHtml, setMessageHtml] = useState('');
  const [messageText, setMessageText] = useState(''); // Düz metin içeriği
  const [targetUsersType, setTargetUsersType] = useState('all'); // 'all', 'selected_users'
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // Hata ve mesaj bildirimlerini yönet
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearNotificationError());
    }
    if (message) {
      toast.success(message);
      dispatch(clearNotificationMessage());
    }
  }, [error, message, dispatch]);

  // Hedef kullanıcı tipi 'selected_users' olduğunda tüm kullanıcıları çek
  useEffect(() => {
    // Sadece kullanıcı listesi boşsa ve yüklenmiyorsa çekme işlemi başlatılır
    if (targetUsersType === 'selected_users' && users.length === 0 && !usersLoading) {
      // fetchUsers thunk'ını çağırıyoruz ve tüm kullanıcıları getirmek için limit belirliyoruz
      dispatch(fetchUsers({ limit: 9999 })); 
    }
  }, [targetUsersType, users.length, usersLoading, dispatch]);

  const handleUserSelection = (e) => {
    const userId = parseInt(e.target.value);
    if (e.target.checked) {
      setSelectedUserIds((prev) => [...prev, userId]);
    } else {
      setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let targetUsersToSend;
    if (targetUsersType === 'all') {
      targetUsersToSend = 'all';
    } else if (targetUsersType === 'selected_users') {
      if (selectedUserIds.length === 0) {
        toast.error('Lütfen en az bir kullanıcı seçin.');
        return;
      }
      targetUsersToSend = selectedUserIds;
    } else {
      toast.error('Geçersiz alıcı tipi.');
      return;
    }

    // Backend'e gönderilecek payload
    const payload = {
      subject,
      messageHtml,
      messageText,
      targetUsers: targetUsersToSend,
    };

    dispatch(sendMarketingEmail(payload));
  };

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-md min-h-[80vh]">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Pazarlama E-postası Gönder</h1>
      <p className="text-gray-600 mb-8">
        Kullanıcılarınıza özel pazarlama e-postaları gönderin. Mesajınıza `{'{username}'}` ekleyerek kişiselleştirebilirsiniz.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="subject" className="block text-gray-700 text-sm font-bold mb-2">
            E-posta Konusu:
          </label>
          <input
            type="text"
            id="subject"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="messageHtml" className="block text-gray-700 text-sm font-bold mb-2">
            HTML Mesaj İçeriği:
          </label>
          <textarea
            id="messageHtml"
            rows="10"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={messageHtml}
            onChange={(e) => setMessageHtml(e.target.value)}
            placeholder="HTML içeriğinizi buraya yazın. Kullanıcı adını kişiselleştirmek için {username} kullanabilirsiniz."
            required
          ></textarea>
        </div>

        <div>
          <label htmlFor="messageText" className="block text-gray-700 text-sm font-bold mb-2">
            Düz Metin Mesaj İçeriği (HTML desteklemeyen istemciler için):
          </label>
          <textarea
            id="messageText"
            rows="5"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Düz metin içeriğinizi buraya yazın. Kullanıcı adını kişiselleştirmek için {username} kullanabilirsiniz."
            required
          ></textarea>
        </div>

        <div>
          <label htmlFor="targetUsersType" className="block text-gray-700 text-sm font-bold mb-2">
            Hedef Kullanıcılar:
          </label>
          <select
            id="targetUsersType"
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={targetUsersType}
            onChange={(e) => {
              setTargetUsersType(e.target.value);
              setSelectedUserIds([]); // Hedef tipi değişince seçilenleri sıfırla
            }}
          >
            <option value="all">Tüm Kullanıcılar</option>
            {/* Backend'inizde 'newsletter_subscribers' için ayrı bir veritabanı tablosu varsa aktif edilebilir */}
            {/* <option value="newsletter_subscribers">Haber Bülteni Aboneleri</option> */}
            <option value="selected_users">Belirli Kullanıcılar</option>
          </select>
        </div>

        {targetUsersType === 'selected_users' && (
          <div className="border p-4 rounded-md bg-gray-50 max-h-60 overflow-y-auto">
            <p className="text-gray-700 font-bold mb-2">Kullanıcıları Seçin:</p>
            {usersLoading ? (
              <div className="flex justify-center items-center"><LoadingSpinner /> <span className="ml-2">Kullanıcılar yükleniyor...</span></div>
            ) : users.length > 0 ? (
              users.map((user) => (
                <div key={user.id} className="flex items-center mb-1">
                  <input
                    type="checkbox"
                    id={`user-${user.id}`}
                    value={user.id}
                    checked={selectedUserIds.includes(user.id)}
                    onChange={handleUserSelection}
                    className="mr-2"
                  />
                  <label htmlFor={`user-${user.id}`} className="text-gray-800">
                    {user.username} ({user.email})
                  </label>
                </div>
              ))
            ) : (
              <p className="text-gray-600">Hiç kullanıcı bulunamadı.</p>
            )}
          </div>
        )}

        <button
          type="submit"
          className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={loading}
        >
          {loading ? <LoadingSpinner size="sm" /> : 'E-posta Gönder'}
        </button>
      </form>
    </div>
  );
};

export default EmailMarketingPage;
