import React, { useState, useEffect } from 'react';
import { businessService, serviceService, appointmentService, staffService, locationService } from '../services';
import './MyBusiness.css';

const MyBusiness = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBusinessForm, setShowBusinessForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState({});
  // Composite creation draft state
  const [businessFormData, setBusinessFormData] = useState({
    name: '',
    type: 'berber',
    description: '',
    city: '',
    district: '',
    address: '',
    phone: '',
    image_url: '',
    opening_time: '09:00',
    closing_time: '18:00'
  });
  const [bookingSettingsDraft, setBookingSettingsDraft] = useState({ slot_interval_minutes: 15, min_notice_minutes: 60, booking_window_days: 30 });
  const [draftStaff, setDraftStaff] = useState([]); // [{name: ''}]
  const [newStaffName, setNewStaffName] = useState('');
  const [draftServices, setDraftServices] = useState([]); // [{name, description, price, duration}]
  const [newService, setNewService] = useState({ name: '', description: '', price: '', duration: '30' });
  // assignments: staffIndex -> Set(serviceIndex)
  const [draftAssignments, setDraftAssignments] = useState({});
  const [creatingComposite, setCreatingComposite] = useState(false);
  const [serviceFormData, setServiceFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '30'
  });
  const [error, setError] = useState('');

  // Edit business modal state
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingBusinessId, setEditingBusinessId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    type: 'berber',
    description: '',
    city: '',
    district: '',
    address: '',
    phone: '',
    image_url: '',
    opening_time: '09:00',
    closing_time: '18:00'
  });
  const [editingSettings, setEditingSettings] = useState({ slot_interval_minutes: 15, min_notice_minutes: 60, booking_window_days: 30 });


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
  const [matcherSaving, setMatcherSaving] = useState({}); // { [`${staffId}`]: boolean }

  const businessTypes = [
    { value: 'berber', label: 'Berber' },
    { value: 'kuafor', label: 'Kuaför' },
    { value: 'dovmeci', label: 'Dövmeci' },
    { value: 'guzellik', label: 'Güzellik Merkezi' }
  ];

  useEffect(() => {
    fetchBusinesses();
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await locationService.getAll();
      setCities(response.data.cities || []);
      setDistricts(response.data.districts || {});
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

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

  const toggleStaffServiceImmediate = async (staffId, serviceId, checked) => {
    const prevSet = new Set(staffServices[staffId] || []);
    const nextSet = new Set(prevSet);
    if (checked) nextSet.add(serviceId); else nextSet.delete(serviceId);
    const nextArr = Array.from(nextSet);

    setStaffServices(prev => ({ ...prev, [staffId]: nextArr }));
    setMatcherSaving(prev => ({ ...prev, [staffId]: true }));
    try {
      await staffService.setServices(staffId, nextArr);
    } catch (e) {
      // revert on failure
      const prevArr = Array.from(prevSet);
      setStaffServices(prev => ({ ...prev, [staffId]: prevArr }));
      alert(e.response?.data?.error || 'Hizmet ataması kaydedilemedi');
    } finally {
      setMatcherSaving(prev => ({ ...prev, [staffId]: false }));
    }
  };

  const validateComposite = () => {
    const { name, type, description, city, district, address, phone, opening_time, closing_time } = businessFormData;
    if (!name || !type || !description || !city || !district || !address || !phone || !opening_time || !closing_time) return 'Tüm işletme alanları (görsel hariç) zorunlu.';
    if (draftStaff.length === 0) return 'En az bir personel ekleyin.';
    if (draftServices.length === 0) return 'En az bir hizmet ekleyin.';
    // ensure each service has at least one staff assignment
    for (let si = 0; si < draftServices.length; si++) {
      let assigned = false;
      for (let sti = 0; sti < draftStaff.length; sti++) {
        const set = draftAssignments[sti];
        if (set && set.has(si)) { assigned = true; break; }
      }
      if (!assigned) return `Hizmet '${draftServices[si].name || si+1}' için personel seçin.`;
    }
    return null;
  };

  const handleCompositeCreate = async () => {
    setError('');
    const errMsg = validateComposite();
    if (errMsg) { setError(errMsg); return; }
    setCreatingComposite(true);
    try {
      // 1. Create business
      const bizResp = await businessService.create(businessFormData);
      const businessId = bizResp.data.id;
      // 1b. Save booking settings
      try {
        await businessService.updateSettings(businessId, bookingSettingsDraft);
      } catch (_) { /* non-fatal */ }
      // 2. Create staff and map indices
      const staffIdMap = [];
      for (let i = 0; i < draftStaff.length; i++) {
        const st = draftStaff[i];
        const stResp = await staffService.create(businessId, { name: st.name });
        staffIdMap[i] = stResp.data.id;
      }
      // 3. Create services and map indices
      const serviceIdMap = [];
      for (let j = 0; j < draftServices.length; j++) {
        const svc = draftServices[j];
        const svcResp = await serviceService.create({
          business_id: businessId,
            name: svc.name,
            description: svc.description,
            price: parseFloat(svc.price),
            duration: parseInt(svc.duration)
        });
        serviceIdMap[j] = svcResp.data.id;
      }
      // 4. Assign services per staff
      for (let sti = 0; sti < draftStaff.length; sti++) {
        const set = draftAssignments[sti] || new Set();
        const serviceIds = Array.from(set).map(si => serviceIdMap[si]);
        await staffService.setServices(staffIdMap[sti], serviceIds);
      }
      // Done
      setShowBusinessForm(false);
      // reset draft states
      setBusinessFormData({
        name: '', type: 'berber', description: '', city: '', district: '', address: '', phone: '', image_url: '', opening_time: '09:00', closing_time: '18:00'
      });
      setBookingSettingsDraft({ slot_interval_minutes: 15, min_notice_minutes: 60, booking_window_days: 30 });
      setDraftStaff([]); setDraftServices([]); setDraftAssignments({}); setNewStaffName(''); setNewService({ name:'', description:'', price:'', duration:'30' });
      fetchBusinesses();
    } catch (e) {
      setError(e.response?.data?.error || 'İşletme oluşturma başarısız');
    } finally {
      setCreatingComposite(false);
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
        <div className="header-actions">
          <button 
            onClick={() => setShowBusinessForm(true)} 
            className="btn-header-action"
          >
            + Yeni İşletme Ekle
          </button>
          {businesses.length > 0 && (
            <button
              onClick={() => setShowOwnerBookingForm(true)}
              className="btn-header-action"
            >
              + Yeni Randevu Ekle
            </button>
          )}
        </div>
      </div>

      {showBusinessForm && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <h2>Yeni İşletme Ekle (Tüm Bilgiler)</h2>
            {error && <div className="error-message" style={{ marginBottom: 16 }}>{error}</div>}
            <section style={{ borderBottom: '1px solid #eee', paddingBottom: 12, marginBottom: 12 }}>
              <h3 style={{ marginTop: 0 }}>İşletme Bilgileri</h3>
              <div className="form-group">
                <label>İşletme Adı *</label>
                <input type="text" value={businessFormData.name} onChange={(e)=>setBusinessFormData({...businessFormData,name:e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Tür *</label>
                <select value={businessFormData.type} onChange={(e)=>setBusinessFormData({...businessFormData,type:e.target.value})} required>
                  {businessTypes.map(bt => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Açıklama *</label>
                <textarea rows="3" value={businessFormData.description} onChange={(e)=>setBusinessFormData({...businessFormData,description:e.target.value})} />
              </div>
              <div className="form-group">
                <label>Şehir *</label>
                <select value={businessFormData.city} onChange={(e)=>setBusinessFormData({...businessFormData, city:e.target.value, district: ''})} required>
                  <option value="">Şehir Seçiniz</option>
                  {cities.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>İlçe *</label>
                <select value={businessFormData.district} onChange={(e)=>setBusinessFormData({...businessFormData,district:e.target.value})} required disabled={!businessFormData.city}>
                  <option value="">İlçe Seçiniz</option>
                  {businessFormData.city && districts[businessFormData.city]?.map(dist => <option key={dist} value={dist}>{dist}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Adres *</label>
                <input type="text" value={businessFormData.address} onChange={(e)=>setBusinessFormData({...businessFormData,address:e.target.value})} />
              </div>
              <div className="form-group">
                <label>Telefon *</label>
                <input type="tel" value={businessFormData.phone} onChange={(e)=>setBusinessFormData({...businessFormData,phone:e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Açılış Saati *</label>
                  <input type="time" value={businessFormData.opening_time} onChange={(e)=>setBusinessFormData({...businessFormData,opening_time:e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Kapanış Saati *</label>
                  <input type="time" value={businessFormData.closing_time} onChange={(e)=>setBusinessFormData({...businessFormData,closing_time:e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Görsel URL (Opsiyonel)</label>
                <input type="url" value={businessFormData.image_url} onChange={(e)=>setBusinessFormData({...businessFormData,image_url:e.target.value})} />
              </div>
            </section>
            <section style={{ borderBottom: '1px solid #eee', paddingBottom: 12, marginBottom: 12 }}>
              <h3 style={{ marginTop: 0 }}>Rezervasyon Ayarları</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Slot Aralığı (dk)</label>
                  <input type="number" value={bookingSettingsDraft.slot_interval_minutes}
                         onChange={(e)=>setBookingSettingsDraft({ ...bookingSettingsDraft, slot_interval_minutes: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Minimum Bildirim (dk)</label>
                  <input type="number" value={bookingSettingsDraft.min_notice_minutes}
                         onChange={(e)=>setBookingSettingsDraft({ ...bookingSettingsDraft, min_notice_minutes: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Rezervasyon Penceresi (gün)</label>
                  <input type="number" value={bookingSettingsDraft.booking_window_days}
                         onChange={(e)=>setBookingSettingsDraft({ ...bookingSettingsDraft, booking_window_days: e.target.value })} />
                </div>
              </div>
            </section>
            <section style={{ borderBottom: '1px solid #eee', paddingBottom: 12, marginBottom: 12 }}>
              <h3 style={{ marginTop: 0 }}>Personeller *</h3>
              <div style={{ background: '#f9f9f9', padding: 12, borderRadius: 6, marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Yeni Personel Adı</label>
                <div style={{ display:'flex', gap:8 }}>
                  <input type="text" value={newStaffName} onChange={(e)=>setNewStaffName(e.target.value)} style={{ flex: 1 }} />
                  <button type="button" className="btn-primary" onClick={()=>{ const n = newStaffName.trim(); if(!n) return; setDraftStaff(prev=>[...prev,{name:n}]); setNewStaffName(''); }}>Ekle</button>
                </div>
              </div>
              
              <div style={{ marginTop: 12 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Eklenen Personeller:</label>
                {draftStaff.length === 0 ? <div style={{ fontSize:13, color:'#666' }}>Henüz personel eklenmedi.</div> : (
                  <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexWrap:'wrap', gap:8 }}>
                    {draftStaff.map((st,i)=>(
                      <li key={i} style={{ padding:'6px 10px', border:'1px solid #ddd', borderRadius:4, background:'#fff', display:'flex', alignItems:'center', gap:6 }}>
                        <span>{st.name}</span>
                        <button type="button" className="btn-delete-small" style={{ width:20, height:20, fontSize: 14 }} onClick={()=> setDraftStaff(prev=>prev.filter((_,idx)=>idx!==i))}>×</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
            <section style={{ borderBottom: '1px solid #eee', paddingBottom: 12, marginBottom: 12 }}>
              <h3 style={{ marginTop: 0 }}>Hizmetler *</h3>
              <div style={{ background: '#f9f9f9', padding: 12, borderRadius: 6, marginBottom: 12 }}>
                <h4 style={{ marginTop: 0, marginBottom: 10, fontSize: 14 }}>Yeni Hizmet Ekle</h4>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>Hizmet Adı</label>
                    <input type="text" value={newService.name} onChange={(e)=>setNewService({...newService,name:e.target.value})} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>Açıklama</label>
                    <textarea rows="2" value={newService.description} onChange={(e)=>setNewService({...newService,description:e.target.value})} style={{ width: '100%' }} />
                  </div>
                  <div style={{ display:'flex', gap:12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>Fiyat (TL)</label>
                      <input type="number" value={newService.price} onChange={(e)=>setNewService({...newService,price:e.target.value})} style={{ width: '100%' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>Süre (dk)</label>
                      <input type="number" value={newService.duration} onChange={(e)=>setNewService({...newService,duration:e.target.value})} style={{ width: '100%' }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <button type="button" className="btn-primary" onClick={()=>{
                      const { name, price, duration } = newService;
                      if(!name.trim() || !price || !duration) return;
                      setDraftServices(prev=>[...prev,{...newService}]);
                      setNewService({ name:'', description:'', price:'', duration:'30' });
                    }}>Listeye Ekle</button>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Eklenen Hizmetler:</label>
                {draftServices.length === 0 ? <div style={{ fontSize:13, color:'#666' }}>Henüz hizmet eklenmedi.</div> : (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {draftServices.map((svc,si)=>(
                      <div key={si} style={{ display:'flex', justifyContent: 'space-between', alignItems:'center', border:'1px solid #ddd', padding:'8px 12px', borderRadius:4, background: '#fff' }}>
                        <div>
                          <div style={{ fontWeight: 500 }}>{svc.name}</div>
                          <div style={{ fontSize: 13, color: '#666' }}>{svc.price} TL • {svc.duration} dk</div>
                        </div>
                        <button type="button" className="btn-delete-small" style={{ width:24, height:24 }} onClick={()=> setDraftServices(prev=>prev.filter((_,idx)=>idx!==si))}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
            <section style={{ borderBottom: '1px solid #eee', paddingBottom: 12, marginBottom: 12 }}>
              <h3 style={{ marginTop: 0 }}>Personel–Hizmet Eşleştirme *</h3>
              {draftStaff.length === 0 || draftServices.length === 0 ? (
                <div style={{ fontSize:13, color:'#666' }}>Önce personel ve hizmetleri ekleyin.</div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ borderCollapse:'collapse', minWidth: draftServices.length*140 + 160 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign:'left', padding:'6px 8px', borderBottom:'1px solid #eee' }}>Personel</th>
                        {draftServices.map((svc,si)=>(
                          <th key={si} style={{ padding:'6px 8px', borderBottom:'1px solid #eee' }}>{svc.name || `Hizmet ${si+1}`}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {draftStaff.map((st,sti)=>(
                        <tr key={sti}>
                          <td style={{ padding:'6px 8px', borderBottom:'1px solid #f5f5f5' }}>{st.name || `Personel ${sti+1}`}</td>
                          {draftServices.map((svc,si)=>{
                            const set = draftAssignments[sti] || new Set();
                            const checked = set.has(si);
                            return (
                              <td key={si} style={{ textAlign:'center', padding:'6px 8px', borderBottom:'1px solid #f5f5f5' }}>
                                <input type="checkbox" checked={checked} onChange={(e)=>{
                                  setDraftAssignments(prev=>{
                                    const copy = { ...prev };
                                    const current = new Set(copy[sti] || []);
                                    if(e.target.checked) current.add(si); else current.delete(si);
                                    copy[sti] = current;
                                    return copy;
                                  });
                                }} />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
            <div className="form-actions" style={{ position:'sticky', bottom:0 }}>
              <button type="button" disabled={creatingComposite} onClick={()=>!creatingComposite && setShowBusinessForm(false)} className="btn-secondary">İptal</button>
              <button type="button" className="btn-primary" disabled={creatingComposite} onClick={handleCompositeCreate}>{creatingComposite ? 'Kaydediliyor...' : 'İşletmeyi Oluştur'}</button>
            </div>
          </div>
        </div>
      )}

      {showServiceForm && (
        <div className="modal-overlay">
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
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    onClick={() => {
                      setEditingBusinessId(business.id);
                      setEditFormData({
                        name: business.name || '',
                        type: business.type || 'berber',
                        description: business.description || '',
                        city: business.city || '',
                        district: business.district || '',
                        address: business.address || '',
                        phone: business.phone || '',
                        image_url: business.image_url || '',
                        opening_time: business.opening_time || '09:00',
                        closing_time: business.closing_time || '18:00'
                      });
                      // Load settings for edit modal
                      (async () => {
                        try {
                          const s = await businessService.getSettings(business.id);
                          setEditingSettings({
                            slot_interval_minutes: s.data?.slot_interval_minutes ?? 15,
                            min_notice_minutes: s.data?.min_notice_minutes ?? 60,
                            booking_window_days: s.data?.booking_window_days ?? 30
                          });
                        } catch (_) {
                          setEditingSettings({ slot_interval_minutes: 15, min_notice_minutes: 60, booking_window_days: 30 });
                        }
                      })();
                      setShowEditForm(true);
                    }} 
                    className="btn-secondary"
                  >
                    Düzenle
                  </button>
                  <button 
                    onClick={() => handleDeleteBusiness(business.id)} 
                    className="btn-delete"
                  >
                    Sil
                  </button>
                </div>
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

                              {/* Hizmet atama kontrolleri bu bloktan kaldırıldı. Eşleştirme en altta. */}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Personel-Hizmet Eşleştirme - En altta */}
              <div className="services-section" style={{ marginTop: 16 }}>
                <div className="services-header">
                  <h4>Personel–Hizmet Eşleştirme</h4>
                </div>
                {!(business.services && business.services.length) && (
                  <div className="no-services">Önce hizmet ekleyin</div>
                )}
                {business.services && business.services.length > 0 && (
                  <div className="matcher-wrapper" style={{ overflowX: 'auto' }}>
                    {!(staffByBusiness[business.id] && staffByBusiness[business.id].length) ? (
                      <div style={{ color: '#666' }}>Önce personel ekleyin ve Personeller bölümünden yönetin.</div>
                    ) : (
                      <table className="matcher-table" style={{ borderCollapse: 'collapse', minWidth: 520 }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #eee' }}>Personel</th>
                            {business.services.map(svc => (
                              <th key={svc.id} style={{ padding: '8px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{svc.name}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {staffByBusiness[business.id].map(st => (
                            <tr key={st.id}>
                              <td style={{ padding: '8px', borderBottom: '1px solid #f2f2f2' }}>{st.name}</td>
                              {business.services.map(svc => {
                                const selected = (staffServices[st.id] || []).includes(svc.id);
                                const busy = !!matcherSaving[st.id];
                                return (
                                  <td key={svc.id} style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #f2f2f2' }}>
                                    <input
                                      type="checkbox"
                                      checked={selected}
                                      disabled={busy}
                                      onChange={(e) => toggleStaffServiceImmediate(st.id, svc.id, e.target.checked)}
                                    />
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showOwnerBookingForm && (
        <div className="modal-overlay">
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

      {showEditForm && (
        <div className="modal-overlay" onClick={() => setShowEditForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <h2>İşletme Bilgilerini Düzenle</h2>
            {error && <div className="error-message" style={{ marginBottom: 16 }}>{error}</div>}

            <div className="form-group">
              <label>İşletme Adı *</label>
              <input type="text" value={editFormData.name} onChange={(e)=>setEditFormData({...editFormData,name:e.target.value})} />
            </div>
            <div className="form-group">
              <label>Tür *</label>
              <select value={editFormData.type} onChange={(e)=>setEditFormData({...editFormData,type:e.target.value})}>
                {businessTypes.map(bt => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Açıklama *</label>
              <textarea rows="3" value={editFormData.description} onChange={(e)=>setEditFormData({...editFormData,description:e.target.value})} />
            </div>
            <div className="form-group">
              <label>Şehir *</label>
              <select value={editFormData.city} onChange={(e)=>setEditFormData({...editFormData, city:e.target.value, district: ''})}>
                <option value="">Şehir Seçiniz</option>
                {cities.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>İlçe *</label>
              <select value={editFormData.district} onChange={(e)=>setEditFormData({...editFormData,district:e.target.value})} disabled={!editFormData.city}>
                <option value="">İlçe Seçiniz</option>
                {editFormData.city && districts[editFormData.city]?.map(dist => <option key={dist} value={dist}>{dist}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Adres *</label>
              <input type="text" value={editFormData.address} onChange={(e)=>setEditFormData({...editFormData,address:e.target.value})} />
            </div>
            <div className="form-group">
              <label>Telefon *</label>
              <input type="tel" value={editFormData.phone} onChange={(e)=>setEditFormData({...editFormData,phone:e.target.value})} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Açılış Saati *</label>
                <input type="time" value={editFormData.opening_time} onChange={(e)=>setEditFormData({...editFormData,opening_time:e.target.value})} />
              </div>
              <div className="form-group">
                <label>Kapanış Saati *</label>
                <input type="time" value={editFormData.closing_time} onChange={(e)=>setEditFormData({...editFormData,closing_time:e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label>Görsel URL</label>
              <input type="url" value={editFormData.image_url} onChange={(e)=>setEditFormData({...editFormData,image_url:e.target.value})} />
            </div>

            <section style={{ borderTop: '1px solid #eee', paddingTop: 12, marginTop: 12 }}>
              <h3 style={{ marginTop: 0 }}>Rezervasyon Ayarları</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Slot Aralığı (dk)</label>
                  <input type="number" value={editingSettings.slot_interval_minutes}
                         onChange={(e)=>setEditingSettings({ ...editingSettings, slot_interval_minutes: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Minimum Bildirim (dk)</label>
                  <input type="number" value={editingSettings.min_notice_minutes}
                         onChange={(e)=>setEditingSettings({ ...editingSettings, min_notice_minutes: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Rezervasyon Penceresi (gün)</label>
                  <input type="number" value={editingSettings.booking_window_days}
                         onChange={(e)=>setEditingSettings({ ...editingSettings, booking_window_days: e.target.value })} />
                </div>
              </div>
            </section>

            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setShowEditForm(false)}>İptal</button>
              <button className="btn-primary" onClick={async ()=>{
                setError('');
                try {
                  await businessService.update(editingBusinessId, editFormData);
                  // Save booking settings
                  try {
                    await businessService.updateSettings(editingBusinessId, editingSettings);
                  } catch (_) { /* ignore non-fatal */ }
                  setShowEditForm(false);
                  setEditingBusinessId(null);
                  await fetchBusinesses();
                } catch (e) {
                  setError(e.response?.data?.error || 'İşletme güncellenemedi');
                }
              }}>Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBusiness;
