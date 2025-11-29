import React, { useState, useEffect, useMemo } from 'react';
import { appointmentService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import './Appointments.css';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await appointmentService.getMyAppointments();
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await appointmentService.updateStatus(id, newStatus);
      fetchAppointments();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Durum güncellenirken hata oluştu');
    }
  };

  const businessOptions = useMemo(() => {
    const map = new Map();
    for (const a of appointments) {
      // Prefer name + id pair from appointment payload
      const id = a.business_id;
      const name = a.business_name || `İşletme #${id}`;
      if (id != null && !map.has(id)) map.set(id, name);
    }
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      const matchBiz = selectedBusiness ? String(a.business_id) === String(selectedBusiness) : true;
      const matchStatus = selectedStatus ? a.status === selectedStatus : true;
      return matchBiz && matchStatus;
    });
  }, [appointments, selectedBusiness, selectedStatus]);

  const isExpired = (appointment) => {
    try {
      const today = new Date();
      const apptDate = new Date(appointment.appointment_date);
      // Compare by date part only
      const todayYMD = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const apptYMD = new Date(apptDate.getFullYear(), apptDate.getMonth(), apptDate.getDate());
      return apptYMD < todayYMD;
    } catch (e) {
      return false;
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Beklemede', class: 'status-pending' },
      confirmed: { label: 'Onaylandı', class: 'status-confirmed' },
      cancelled: { label: 'İptal Edildi', class: 'status-cancelled' },
      completed: { label: 'Tamamlandı', class: 'status-completed' }
    };
    const statusInfo = statusMap[status] || statusMap.pending;
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  if (loading) return <div className="loading">Yükleniyor...</div>;

  return (
    <div className="appointments-container">
      <h1>Randevularım</h1>

      {/* Filters */}
      <div className="filters-bar" style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#666' }}>İşletme</label>
          <select value={selectedBusiness} onChange={(e) => setSelectedBusiness(e.target.value)}>
            <option value="">Tümü</option>
            {businessOptions.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#666' }}>Durum</label>
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="">Tümü</option>
            <option value="pending">Beklemede</option>
            <option value="confirmed">Onaylandı</option>
            <option value="cancelled">İptal Edildi</option>
            <option value="completed">Tamamlandı</option>
          </select>
        </div>
        {(selectedBusiness || selectedStatus) && (
          <button className="btn-secondary" onClick={() => { setSelectedBusiness(''); setSelectedStatus(''); }}>Filtreyi Temizle</button>
        )}
      </div>
      
      {appointments.length === 0 ? (
        <div className="no-appointments">
          <p>Henüz randevunuz bulunmamaktadır.</p>
        </div>
      ) : (
        <div className="appointments-list">
          {filteredAppointments.map(appointment => {
            const displayName = appointment.manual_customer_name || appointment.account_customer_name || appointment.customer_name || '-';
            const displayPhone = appointment.manual_customer_phone || appointment.account_customer_phone || appointment.customer_phone || '-';
            const displayEmail = appointment.account_customer_email || appointment.customer_email || '';
            const displayStart = appointment.start_time || appointment.appointment_time;
            const displayEnd = appointment.end_time ? ` - ${appointment.end_time}` : '';
            const expired = isExpired(appointment);
            return (
            <div key={appointment.id} className={`appointment-card${expired ? ' expired' : ''}`}>
              <div className="appointment-header">
                <h3>{appointment.business_name}</h3>
                {getStatusBadge(appointment.status)}
                {appointment.source === 'owner_manual' && (
                  <span className="status-badge status-confirmed" style={{ marginLeft: 8 }}>Owner</span>
                )}
              </div>
              
              <div className="appointment-details">
                <p><strong>Hizmet:</strong> {appointment.service_name}</p>
                <p>
                  <strong>Tarih:</strong> {new Date(appointment.appointment_date).toLocaleDateString('tr-TR')}
                  {expired && (
                    <span className="expired-badge" style={{ marginLeft: 8 }}>Tarihi geçti</span>
                  )}
                </p>
                <p><strong>Saat:</strong> {displayStart}{displayEnd}</p>
                <p><strong>Süre:</strong> {appointment.duration} dakika</p>
                <p><strong>Fiyat:</strong> {appointment.price} TL</p>
                {appointment.notes && (
                  <p><strong>Notlar:</strong> {appointment.notes}</p>
                )}
                
                {user.role === 'business_owner' && (
                  <>
                    <p><strong>Müşteri:</strong> {displayName}</p>
                    <p><strong>E-posta:</strong> {displayEmail || '-'}</p>
                    <p><strong>Telefon:</strong> {displayPhone}</p>
                  </>
                )}
              </div>

              <div className="appointment-actions">
                {appointment.status === 'pending' && !expired && (
                  <>
                    {user.role === 'business_owner' && (
                      <button 
                        onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                        className="btn-confirm"
                      >
                        Onayla
                      </button>
                    )}
                    <button 
                      onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                      className="btn-cancel"
                    >
                      İptal Et
                    </button>
                  </>
                )}
                {/* İşletme tarafında tamamlandı butonu gereksiz: kaldırıldı */}
              </div>
            </div>
          );})}
        </div>
      )}
    </div>
  );
};

export default Appointments;
