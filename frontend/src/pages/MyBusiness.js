import React, { useState, useEffect } from 'react';
import { businessService, serviceService, appointmentService, staffService } from '../services';
import './MyBusiness.css';

const MyBusiness = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBusinessForm, setShowBusinessForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [businessFormData, setBusinessFormData] = useState({
    name: '',
    type: 'berber',
    description: '',
    address: '',
    phone: '',
    image_url: '',
    opening_time: '09:00',
    closing_time: '18:00'
  });
  const [serviceFormData, setServiceFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '30'
  });
  const [error, setError] = useState('');


  // Owner manual booking modal state
  const [showOwnerBookingForm, setShowOwnerBookingForm] = useState(false);
  const [ownerBooking, setOwnerBooking] = useState({
    business_id: '',
    service_id: '',
    appointment_date: '',
    start_time: '',
    customer_name: '',
    customer_phone: '',
    notes: ''
  });
  const [ownerSlots, setOwnerSlots] = useState([]);
  const [ownerBookingError, setOwnerBookingError] = useState('');

  // Staff management state
  const [expandedStaffBusinessIds, setExpandedStaffBusinessIds] = useState([]); // which business cards show staff section
  const [staffByBusiness, setStaffByBusiness] = useState({}); // { [businessId]: Array<staff> }
  const [newStaffNameByBusiness, setNewStaffNameByBusiness] = useState({}); // { [businessId]: string }
  const [staffServices, setStaffServices] = useState({}); // { [staffId]: Array<number> }
  const [staffLoading, setStaffLoading] = useState({}); // { [businessId]: boolean }
  const [serviceStaffSelection, setServiceStaffSelection] = useState({}); // { [businessId]: Array<staffId> }

  const businessTypes = [
    { value: 'berber', label: 'Berber' },
    { value: 'kuafor', label: 'Kuaför' },
    { value: 'dovmeci', label: 'Dövmeci' },
    { value: 'guzellik', label: 'Güzellik Merkezi' }
  ];

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const response = await businessService.getMyBusinesses();
      setBusinesses(response.data);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  };


  const toggleStaffSection = async (businessId) => {
    const isOpen = expandedStaffBusinessIds.includes(businessId);
    if (isOpen) {
      setExpandedStaffBusinessIds(expandedStaffBusinessIds.filter(id => id !== businessId));
      return;
    }
    setExpandedStaffBusinessIds([...expandedStaffBusinessIds, businessId]);
    if (!staffByBusiness[businessId]) {
      await loadStaff(businessId);
    }
  };

  const loadStaff = async (businessId) => {
    try {
      setStaffLoading(prev => ({ ...prev, [businessId]: true }));
      const resp = await staffService.listByBusiness(businessId);
      const list = resp.data || [];
      setStaffByBusiness(prev => ({ ...prev, [businessId]: list }));
      // Preload staff services for each staff
      for (const st of list) {
        try {
          const m = await staffService.getServices(st.id);
          setStaffServices(prev => ({ ...prev, [st.id]: m.data?.service_ids || [] }));
        } catch (_) { /* ignore */ }
      }
    } catch (e) {
      console.error('Staff load failed', e);
      setStaffByBusiness(prev => ({ ...prev, [businessId]: [] }));
    } finally {
      setStaffLoading(prev => ({ ...prev, [businessId]: false }));
    }
  };

  const addStaff = async (businessId) => {
    const name = (newStaffNameByBusiness[businessId] || '').trim();
    if (!name) return;
    try {
      await staffService.create(businessId, { name });
      setNewStaffNameByBusiness(prev => ({ ...prev, [businessId]: '' }));
      await loadStaff(businessId);
    } catch (e) {
      alert(e.response?.data?.error || 'Personel eklenemedi');
    }
  };

  const saveStaff = async (businessId, staff) => {
    try {
      await staffService.update(staff.id, { name: staff.name, active: !!staff.active });
      await loadStaff(businessId);
    } catch (e) {
      alert(e.response?.data?.error || 'Personel güncellenemedi');
    }
  };

  const saveStaffServices = async (staffId, serviceIds) => {
    try {
      await staffService.setServices(staffId, serviceIds);
      setStaffServices(prev => ({ ...prev, [staffId]: serviceIds }));
    } catch (e) {
      alert(e.response?.data?.error || 'Hizmet ataması yapılamadı');
    }
  };

  const handleBusinessSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await businessService.create(businessFormData);
      setShowBusinessForm(false);
      setBusinessFormData({
        name: '',
        type: 'berber',
        description: '',
        address: '',
        phone: '',
        image_url: '',
        opening_time: '09:00',
        closing_time: '18:00'
      });
      fetchBusinesses();
    } catch (error) {
      setError(error.response?.data?.error || 'İşletme oluşturulamadı');
    }
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const created = await serviceService.create({
        ...serviceFormData,
        business_id: selectedBusiness,
        price: parseFloat(serviceFormData.price),
        duration: parseInt(serviceFormData.duration)
      });
      const newServiceId = created.data?.id;
      // Assign to selected staff (if any)
      const selectedStaff = serviceStaffSelection[selectedBusiness] || [];
      for (const staffId of selectedStaff) {
        try {
          const current = await staffService.getServices(staffId);
          const existing = new Set(current.data?.service_ids || []);
          if (!existing.has(newServiceId)) {
            existing.add(newServiceId);
            await staffService.setServices(staffId, Array.from(existing));
          }
        } catch (_) { /* ignore per-staff failures */ }
      }
      setShowServiceForm(false);
      setServiceFormData({
        name: '',
        description: '',
        price: '',
        duration: '30'
      });
      setSelectedBusiness(null);
      setServiceStaffSelection(prev => ({ ...prev, [selectedBusiness]: [] }));
      fetchBusinesses();
    } catch (error) {
      setError(error.response?.data?.error || 'Hizmet eklenemedi');
    }
  };

  const handleDeleteBusiness = async (id) => {
    if (window.confirm('Bu işletmeyi silmek istediğinizden emin misiniz?')) {
      try {
        await businessService.delete(id);
        fetchBusinesses();
      } catch (error) {
        alert('İşletme silinemedi');
      }
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (window.confirm('Bu hizmeti silmek istediğinizden emin misiniz?')) {
      try {
        await serviceService.delete(serviceId);
        fetchBusinesses();
      } catch (error) {
        alert('Hizmet silinemedi');
      }
    }
  };


  if (loading) return <div className="loading">Yükleniyor...</div>;

  return (
    <div className="my-business-container">
      <div className="page-header">
        <h1>İşletmelerim</h1>
        <button 
          onClick={() => setShowBusinessForm(true)} 
          className="btn-primary"
        >
          + Yeni İşletme Ekle
        </button>
        {businesses.length > 0 && (
          <button
            onClick={() => setShowOwnerBookingForm(true)}
            className="btn-primary"
            style={{ marginLeft: 8 }}
          >
            + Yeni Randevu Ekle
          </button>
        )}
      </div>

      {showBusinessForm && (
        <div className="modal-overlay" onClick={() => setShowBusinessForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Yeni İşletme Ekle</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleBusinessSubmit}>
              <div className="form-group">
                <label>İşletme Adı *</label>
                <input
                  type="text"
                  value={businessFormData.name}
                  onChange={(e) => setBusinessFormData({...businessFormData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tür *</label>
                <select
                  value={businessFormData.type}
                  onChange={(e) => setBusinessFormData({...businessFormData, type: e.target.value})}
                  required
                >
                  {businessTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Açıklama</label>
                <textarea
                  value={businessFormData.description}
                  onChange={(e) => setBusinessFormData({...businessFormData, description: e.target.value})}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Adres</label>
                <input
                  type="text"
                  value={businessFormData.address}
                  onChange={(e) => setBusinessFormData({...businessFormData, address: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Telefon</label>
                <input
                  type="tel"
                  value={businessFormData.phone}
                  onChange={(e) => setBusinessFormData({...businessFormData, phone: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Görsel URL</label>
                <input
                  type="url"
                  value={businessFormData.image_url}
                  onChange={(e) => setBusinessFormData({...businessFormData, image_url: e.target.value})}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Açılış Saati</label>
                  <input
                    type="time"
                    value={businessFormData.opening_time}
                    onChange={(e) => setBusinessFormData({...businessFormData, opening_time: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Kapanış Saati</label>
                  <input
                    type="time"
                    value={businessFormData.closing_time}
                    onChange={(e) => setBusinessFormData({...businessFormData, closing_time: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowBusinessForm(false)} className="btn-secondary">
                  İptal
                </button>
                <button type="submit" className="btn-primary">
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showServiceForm && (
        <div className="modal-overlay" onClick={() => setShowServiceForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Yeni Hizmet Ekle</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleServiceSubmit}>
              <div className="form-group">
                <label>Hizmet Adı *</label>
                <input
                  type="text"
                  value={serviceFormData.name}
                  onChange={(e) => setServiceFormData({...serviceFormData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Açıklama</label>
                <textarea
                  value={serviceFormData.description}
                  onChange={(e) => setServiceFormData({...serviceFormData, description: e.target.value})}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Fiyat (TL) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={serviceFormData.price}
                  onChange={(e) => setServiceFormData({...serviceFormData, price: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Süre (dakika) *</label>
                <input
                  type="number"
                  value={serviceFormData.duration}
                  onChange={(e) => setServiceFormData({...serviceFormData, duration: e.target.value})}
                  required
                />
              </div>
              {selectedBusiness && (
                <div className="form-group">
                  <label>Bu hizmette çalışacak personel(ler)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {(staffByBusiness[selectedBusiness] || []).length === 0 ? (
                      <div style={{ fontSize: 13, color: '#666' }}>Önce personel ekleyin</div>
                    ) : (
                      (staffByBusiness[selectedBusiness] || []).map(st => {
                        const sel = new Set(serviceStaffSelection[selectedBusiness] || []);
                        const checked = sel.has(st.id);
                        return (
                          <label key={st.id} style={{ border: '1px solid #ddd', padding: '6px 8px', borderRadius: 4 }}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const next = new Set(serviceStaffSelection[selectedBusiness] || []);
                                if (e.target.checked) next.add(st.id); else next.delete(st.id);
                                setServiceStaffSelection(prev => ({ ...prev, [selectedBusiness]: Array.from(next) }));
                              }}
                              style={{ marginRight: 6 }}
                            />
                            {st.name}
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
              <div className="form-actions">
                <button type="button" onClick={() => setShowServiceForm(false)} className="btn-secondary">
                  İptal
                </button>
                <button type="submit" className="btn-primary">
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {businesses.length === 0 ? (
        <div className="no-businesses">
          <p>Henüz işletme eklemediniz. Başlamak için yukarıdaki butona tıklayın.</p>
        </div>
      ) : (
        <div className="businesses-list">
          {businesses.map(business => (
            <div key={business.id} className="business-card">
              <div className="business-card-header">
                <h3>{business.name}</h3>
                <button 
                  onClick={() => handleDeleteBusiness(business.id)} 
                  className="btn-delete"
                >
                  Sil
                </button>
              </div>
              <p className="business-type">{business.type}</p>
              <p className="business-description">{business.description}</p>
              <div className="business-rating">
                <span className="stars">{'⭐'.repeat(Math.round(business.average_rating))}</span>
                <span className="rating-value">
                  {business.average_rating > 0 ? business.average_rating.toFixed(1) : 'Henüz değerlendirme yok'}
                </span>
                <span className="review-count">({business.review_count} yorum)</span>
              </div>

              <div className="services-section">
                <div className="services-header">
                  <h4>Hizmetler</h4>
                  <button 
                    onClick={async () => {
                      setSelectedBusiness(business.id);
                      setShowServiceForm(true);
                      if (!staffByBusiness[business.id]) {
                        await loadStaff(business.id);
                      }
                      setServiceStaffSelection(prev => ({ ...prev, [business.id]: [] }));
                    }}
                    className="btn-add-service"
                  >
                    + Hizmet Ekle
                  </button>
                </div>
                {business.services && business.services.length > 0 ? (
                  <div className="services-list">
                    {business.services.map(service => (
                      <div key={service.id} className="service-item">
                        <div className="service-info">
                          <strong>{service.name}</strong>
                          <span className="service-details">
                            {service.price} TL • {service.duration} dakika
                          </span>
                        </div>
                        <button 
                          onClick={() => handleDeleteService(service.id)}
                          className="btn-delete-small"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-services">Henüz hizmet eklenmemiş</p>
                )}
              </div>


              <div className="staff-section" style={{ marginTop: 16 }}>
                <div className="services-header">
                  <h4>Personeller</h4>
                  <button
                    onClick={() => toggleStaffSection(business.id)}
                    className="btn-add-service"
                  >
                    {expandedStaffBusinessIds.includes(business.id) ? 'Gizle' : 'Yönet'}
                  </button>
                </div>
                {expandedStaffBusinessIds.includes(business.id) && (
                  <div className="staff-manager" style={{ borderTop: '1px solid #eee', paddingTop: 12 }}>
                    <div className="form-inline" style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <input
                        type="text"
                        placeholder="Yeni personel adı"
                        value={newStaffNameByBusiness[business.id] || ''}
                        onChange={(e) => setNewStaffNameByBusiness(prev => ({ ...prev, [business.id]: e.target.value }))}
                      />
                      <button className="btn-primary" onClick={() => addStaff(business.id)}>Ekle</button>
                    </div>
                    {staffLoading[business.id] ? (
                      <div>Yükleniyor...</div>
                    ) : (
                      <div className="staff-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {(staffByBusiness[business.id] || []).length === 0 ? (
                          <div>Henüz personel eklenmemiş</div>
                        ) : (
                          (staffByBusiness[business.id] || []).map(st => (
                            <div key={st.id} className="staff-item" style={{ border: '1px solid #eee', borderRadius: 6, padding: 10 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                  <input
                                    type="text"
                                    value={st.name}
                                    onChange={(e) => {
                                      const name = e.target.value;
                                      setStaffByBusiness(prev => ({
                                        ...prev,
                                        [business.id]: prev[business.id].map(x => x.id === st.id ? { ...x, name } : x)
                                      }));
                                    }}
                                    style={{ minWidth: 200 }}
                                  />
                                  <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <input
                                      type="checkbox"
                                      checked={!!st.active}
                                      onChange={(e) => {
                                        const active = e.target.checked ? 1 : 0;
                                        setStaffByBusiness(prev => ({
                                          ...prev,
                                          [business.id]: prev[business.id].map(x => x.id === st.id ? { ...x, active } : x)
                                        }));
                                      }}
                                    /> Aktif
                                  </label>
                                </div>
                                <button className="btn-primary" onClick={() => saveStaff(business.id, st)}>Kaydet</button>
                              </div>

                              <div style={{ marginTop: 8 }}>
                                <div style={{ fontSize: 13, marginBottom: 4 }}>Hizmet Atamaları</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                  {(business.services || []).map(svc => {
                                    const selected = (staffServices[st.id] || []).includes(svc.id);
                                    return (
                                      <label key={svc.id} style={{ border: '1px solid #ddd', padding: '6px 8px', borderRadius: 4, cursor: 'pointer' }}>
                                        <input
                                          type="checkbox"
                                          checked={selected}
                                          onChange={(e) => {
                                            const next = new Set(staffServices[st.id] || []);
                                            if (e.target.checked) next.add(svc.id); else next.delete(svc.id);
                                            const arr = Array.from(next);
                                            setStaffServices(prev => ({ ...prev, [st.id]: arr }));
                                          }}
                                          style={{ marginRight: 6 }}
                                        />
                                        {svc.name}
                                      </label>
                                    );
                                  })}
                                </div>
                                <div style={{ marginTop: 8 }}>
                                  <button className="btn-secondary" onClick={() => saveStaffServices(st.id, staffServices[st.id] || [])}>Atamaları Kaydet</button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showOwnerBookingForm && (
        <div className="modal-overlay" onClick={() => setShowOwnerBookingForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Yeni Randevu (Owner)</h2>
            {ownerBookingError && <div className="error-message">{ownerBookingError}</div>}

            <div className="form-group">
              <label>İşletme</label>
              <select
                value={ownerBooking.business_id}
                onChange={(e) => {
                  const business_id = e.target.value;
                  setOwnerBooking({ ...ownerBooking, business_id, service_id: '', appointment_date: '', start_time: '' });
                  setOwnerSlots([]);
                }}
                required
              >
                <option value="">Seçin</option>
                {businesses.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Servis</label>
              <select
                value={ownerBooking.service_id}
                onChange={(e) => {
                  const service_id = e.target.value;
                  setOwnerBooking({ ...ownerBooking, service_id, start_time: '' });
                  setOwnerSlots([]);
                }}
                required
              >
                <option value="">Seçin</option>
                {(businesses.find(b => String(b.id) === String(ownerBooking.business_id))?.services || []).map(s => (
                  <option key={s.id} value={s.id}>{s.name} — {s.duration} dk</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Tarih</label>
              <input
                type="date"
                value={ownerBooking.appointment_date}
                onChange={async (e) => {
                  const appointment_date = e.target.value;
                  const state = { ...ownerBooking, appointment_date, start_time: '' };
                  setOwnerBooking(state);
                  setOwnerBookingError('');
                  if (state.business_id && state.service_id && appointment_date) {
                    try {
                      const resp = await businessService.getAvailability(state.business_id, { service_id: state.service_id, date: appointment_date });
                      setOwnerSlots(resp.data?.slots || []);
                    } catch (err) {
                      setOwnerSlots([]);
                      setOwnerBookingError(err.response?.data?.error || 'Uygunluk alınamadı');
                    }
                  } else {
                    setOwnerSlots([]);
                  }
                }}
                required
              />
            </div>

            {ownerBooking.appointment_date && (
              <div className="form-group">
                <label>Saat</label>
                <select
                  value={ownerBooking.start_time}
                  onChange={(e) => setOwnerBooking({ ...ownerBooking, start_time: e.target.value })}
                  required
                >
                  <option value="">Seçin</option>
                  {ownerSlots.map(s => (
                    <option key={s.time} value={s.time}>{s.time} — {s.available_count} uygun personel</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Müşteri Adı</label>
              <input
                type="text"
                value={ownerBooking.customer_name}
                onChange={(e) => setOwnerBooking({ ...ownerBooking, customer_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Müşteri Telefonu</label>
              <input
                type="tel"
                value={ownerBooking.customer_phone}
                onChange={(e) => setOwnerBooking({ ...ownerBooking, customer_phone: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Not</label>
              <textarea
                rows="2"
                value={ownerBooking.notes}
                onChange={(e) => setOwnerBooking({ ...ownerBooking, notes: e.target.value })}
              />
            </div>

            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setShowOwnerBookingForm(false)}>İptal</button>
              <button
                className="btn-primary"
                onClick={async () => {
                  setOwnerBookingError('');
                  try {
                    await appointmentService.createOwner(ownerBooking);
                    setShowOwnerBookingForm(false);
                    setOwnerBooking({ business_id:'', service_id:'', appointment_date:'', start_time:'', customer_name:'', customer_phone:'', notes:'' });
                  } catch (err) {
                    setOwnerBookingError(err.response?.data?.error || 'Randevu oluşturulamadı');
                  }
                }}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBusiness;
