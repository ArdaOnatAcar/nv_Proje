import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { businessService, locationService } from '../services';
import './Home.css';

const Home = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState({});

  const businessTypes = [
    { value: '', label: 'Tüm İşletmeler' },
    { value: 'berber', label: 'Berber' },
    { value: 'kuafor', label: 'Kuaför' },
    { value: 'dovmeci', label: 'Dövmeci' },
    { value: 'guzellik', label: 'Güzellik Merkezi' }
  ];

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await locationService.getAll();
        setCities(response.data.cities || []);
        setDistricts(response.data.districts || {});
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };
    fetchLocations();
  }, []);

  const fetchBusinesses = useCallback(async () => {
    try {
      const params = {};
      if (typeFilter) params.type = typeFilter;
      if (cityFilter) params.city = cityFilter;
      if (districtFilter) params.district = districtFilter;
      if (search) params.search = search;
      
      const response = await businessService.getAll(params);
      setBusinesses(response.data);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, cityFilter, districtFilter, search]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBusinesses();
  };

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Randex'e Hoş Geldiniz</h1>
        <p>Berber, kuaför, dövmeci ve güzellik merkezlerinden kolayca randevu alın</p>
      </div>

      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <select 
            value={cityFilter} 
            onChange={(e) => { setCityFilter(e.target.value); setDistrictFilter(''); }}
            className="city-filter"
          >
            <option value="">Tüm Şehirler</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          {cityFilter && (
            <select 
              value={districtFilter} 
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="district-filter"
              style={{ marginRight: '10px', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
            >
              <option value="">Tüm İlçeler</option>
              {districts[cityFilter]?.map(dist => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          )}
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            className="type-filter"
          >
            {businessTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="İşletme adı veya hizmet ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn-search">Ara</button>
        </form>
      </div>

      <div className="businesses-section">
        {loading ? (
          <p>Yükleniyor...</p>
        ) : businesses.length === 0 ? (
          <p className="no-results">İşletme bulunamadı</p>
        ) : (
          <div className="business-grid">
            {businesses.map((business) => (
              <Link 
                to={`/business/${business.id}`} 
                key={business.id} 
                className="business-card"
              >
                <div className="business-image">
                  {business.image_url ? (
                    <img src={business.image_url} alt={business.name} />
                  ) : (
                    <div className="placeholder-image">{business.name.charAt(0)}</div>
                  )}
                </div>
                <div className="business-info">
                  <h3>{business.name}</h3>
                  <p className="business-type">{business.type}</p>
                  <p className="business-address">
                    {business.city ? `${business.city}` : ''}
                    {business.district ? ` / ${business.district}` : ''}
                    {business.address ? ` - ${business.address}` : ''}
                  </p>
                  <div className="business-rating">
                    <span className="stars">{'⭐'.repeat(Math.round(business.average_rating))}</span>
                    <span className="rating-value">
                      {business.average_rating > 0 ? business.average_rating.toFixed(1) : 'Henüz değerlendirme yok'}
                    </span>
                    <span className="review-count">({business.review_count} yorum)</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
