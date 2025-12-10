import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { businessService, appointmentService, favoritesService, reviewService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import './BusinessDetail.css';

const BusinessDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentStartTime, setAppointmentStartTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [notes, setNotes] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [favorite, setFavorite] = useState(false);

  const fetchBusiness = useCallback(async () => {
    try {
      const response = await businessService.getById(id);
      setBusiness(response.data);
    } catch (error) {
      console.error('Error fetching business:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBusiness();
    // Load favorite state if customer and authenticated
    if (isAuthenticated && user?.role === 'customer') {
      favoritesService.listIds()
        .then(r => setFavorite(r.data.includes(parseInt(id))))
        .catch(() => {});
    }
  }, [fetchBusiness, id, isAuthenticated, user?.role]);

  const fetchAvailableSlots = useCallback(async () => {
    try {
      const response = await businessService.getAvailability(id, { service_id: selectedService, date: appointmentDate });
      setAvailableSlots(response.data.slots || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
      setAvailableSlots([]);
    }
  }, [id, selectedService, appointmentDate]);

  useEffect(() => {
    if (appointmentDate && business && selectedService) {
      fetchAvailableSlots();
    }
  }, [appointmentDate, selectedService, business, fetchAvailableSlots]);

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setBookingError('');

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!selectedService || !appointmentDate || !appointmentStartTime) {
      setBookingError('Lütfen tüm alanları doldurun');
      return;
    }

    try {
      await appointmentService.create({
        business_id: parseInt(id),
        service_id: selectedService,
        appointment_date: appointmentDate,
        start_time: appointmentStartTime,
        notes
      });

      setBookingSuccess(true);
      setTimeout(() => {
        navigate('/appointments');
      }, 2000);
    } catch (error) {
      setBookingError(error.response?.data?.error || 'Randevu oluşturulamadı');
    }
  };

  if (loading) return <div className="loading">Yükleniyor...</div>;
  if (!business) return <div className="error">İşletme bulunamadı</div>;

  const toggleFavorite = async () => {
    if (!isAuthenticated || user?.role !== 'customer') return;
    try {
      if (favorite) {
        await favoritesService.remove(parseInt(id));
        setFavorite(false);
      } else {
        await favoritesService.add(parseInt(id));
        setFavorite(true);
      }
    } catch (e) {
      console.error('Favori değiştirilemedi', e);
    }
  };

  return (
    <div className="business-detail-container">
      <div className="business-header">
        <div className="business-header-image">
          {business.image_url ? (
            <img src={business.image_url} alt={business.name} />
          ) : (
            <div className="placeholder-header">{business.name.charAt(0)}</div>
          )}
        </div>
        <div className="business-header-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ margin: 0 }}>{business.name}</h1>
            {isAuthenticated && user?.role === 'customer' && (
              <button 
                className={`favorite-heart-detail${favorite ? ' favorited' : ''}`}
                onClick={toggleFavorite}
                aria-label={favorite ? 'Favoriden çıkar' : 'Favorilere ekle'}
              >
                {favorite ? '❤' : '♡'}
              </button>
            )}
          </div>
          <p className="business-type">{business.type}</p>
          <p className="business-description">{business.description}</p>
          <div className="business-meta">
            <p><strong>📍</strong> {business.city ? `${business.city}` : ''}{business.district ? ` / ${business.district}` : ''} - {business.address}</p>
            <p><strong>📞</strong> {business.phone}</p>
            <p><strong>🕐</strong> {business.opening_time} - {business.closing_time}</p>
          </div>
          <div className="business-rating" style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span className="stars">{'⭐'.repeat(Math.round(business.average_rating))}</span>
              <span className="rating-value">{business.average_rating > 0 ? business.average_rating.toFixed(1) : 'Henüz değerlendirme yok'}</span>
              <span className="review-count">({business.review_count} yorum)</span>
            </div>
            {business.review_count > 0 && (
              <button type="button" className="btn-see-reviews" onClick={()=>{
                const el = document.getElementById('reviews');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}>Tüm yorumları gör ↓</button>
            )}
          </div>
        </div>
      </div>

      <div className="business-content">
        <div className="services-section">
          <h2>Hizmetler</h2>
          {business.services && business.services.length > 0 ? (
            <div className="services-list">
              {business.services.map(service => (
                <div key={service.id} className="service-item">
                  <div className="service-info">
                    <h3>{service.name}</h3>
                    <p>{service.description}</p>
                    <div className="service-details">
                      <span className="service-price">{service.price} TL</span>
                      <span className="service-duration">{service.duration} dakika</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>Henüz hizmet eklenmemiş</p>
          )}
        </div>

        <div className="booking-section">
          <h2>Randevu Al</h2>
          {user?.role === 'business_owner' ? (
            <p>İşletme sahibi hesapları müşteri akışından randevu oluşturamaz.</p>
          ) : (
            bookingSuccess ? (
              <div className="success-message">
                Randevunuz başarıyla oluşturuldu! Yönlendiriliyorsunuz...
              </div>
            ) : (
              <form onSubmit={handleBookAppointment} className="booking-form">
                {bookingError && <div className="error-message">{bookingError}</div>}
                
                <div className="form-group">
                  <label>Hizmet Seçin</label>
                  <select 
                    value={selectedService || ''} 
                    onChange={(e) => setSelectedService(parseInt(e.target.value))}
                    required
                  >
                    <option value="">Hizmet seçin</option>
                    {business.services?.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name} - {service.price} TL ({service.duration} dk)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Tarih</label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                {appointmentDate && selectedService && (
                  <div className="form-group">
                    <label>Saat</label>
                    <select 
                      value={appointmentStartTime} 
                      onChange={(e) => setAppointmentStartTime(e.target.value)}
                      required
                    >
                      <option value="">Saat seçin</option>
                      {availableSlots.map(slot => (
                        <option key={slot.time || slot} value={slot.time || slot}>
                          {slot.time || slot}{slot.available_count !== undefined ? ` — ${slot.available_count} uygun personel` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Notlar (İsteğe bağlı)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Özel isteklerinizi yazabilirsiniz..."
                    rows="3"
                  />
                </div>

                <button type="submit" className="btn-primary">
                  Randevu Oluştur
                </button>
              </form>
            )
          )}
        </div>

        <div className="reviews-section" id="reviews">
          <h2>Yorumlar</h2>
          {business.reviews && business.reviews.length > 0 ? (
            <div className="reviews-list">
              {business.reviews.map(review => (
                <div key={review.id} className="review-item">
                  <div className="review-header">
                    <span className="reviewer-name">{review.customer_name}</span>
                    <span className="review-rating">{'⭐'.repeat(review.rating)}</span>
                    {isAuthenticated && user?.role==='customer' && review.customer_id === user.id && (
                      <div className="review-actions">
                        <button className="btn-review-edit" onClick={async ()=>{
                          const ratingStr = prompt('Yeni puan (1-5):', String(review.rating));
                          if (ratingStr == null) return; const r = parseInt(ratingStr,10);
                          if (!r || r<1 || r>5) { alert('Geçersiz puan'); return; }
                          const comment = prompt('Yorum düzenle:', review.comment || '') || '';
                          try {
                            await reviewService.update(review.id, { rating: r, comment });
                            await fetchBusiness();
                          } catch(e){ alert(e.response?.data?.error || 'Yorum güncellenemedi'); }
                        }}>Düzenle</button>
                        <button className="btn-review-delete" onClick={async ()=>{
                          if(!window.confirm('Yorumu silmek istiyor musunuz?')) return;
                          try { await reviewService.delete(review.id); await fetchBusiness(); } catch(e){ alert(e.response?.data?.error || 'Yorum silinemedi'); }
                        }}>Sil</button>
                      </div>
                    )}
                  </div>
                  <p className="review-comment">{review.comment}</p>
                  <span className="review-date">
                    {new Date(review.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p>Henüz yorum yok</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessDetail;
