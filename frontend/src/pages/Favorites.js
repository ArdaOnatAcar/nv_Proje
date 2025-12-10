import React, { useEffect, useState } from 'react';
import { favoritesService } from '../services';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Home.css'; // reuse card/grid styles

const Favorites = () => {
  const { user, isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'customer') {
      favoritesService.list()
        .then(r => setFavorites(r.data))
        .catch(err => console.error('Favoriler alınamadı', err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated || user?.role !== 'customer') {
    return <div style={{ padding: 40, textAlign: 'center' }}>Favoriler yalnızca müşteri hesapları için kullanılabilir.</div>;
  }

  return (
    <div className="home-container">
      <h1>Favori İşletmelerim</h1>
      {loading ? (
        <p>Yükleniyor...</p>
      ) : favorites.length === 0 ? (
        <p className="no-results">Henüz favori işletmeniz yok.</p>
      ) : (
        <div className="business-grid">
          {favorites.map(biz => (
            <Link to={`/business/${biz.id}`} key={biz.id} className="business-card">
              <div className="business-image">
                {biz.image_url ? (
                  <img src={biz.image_url} alt={biz.name} />
                ) : (
                  <div className="placeholder-image">{biz.name.charAt(0)}</div>
                )}
              </div>
              <div className="business-info">
                <h3>{biz.name}</h3>
                <p className="business-type">{biz.type}</p>
                <p className="business-address">
                  {biz.city ? `${biz.city}` : ''}
                  {biz.district ? ` / ${biz.district}` : ''}
                  {biz.address ? ` - ${biz.address}` : ''}
                </p>
                <div className="business-rating">
                  <span className="stars">{'⭐'.repeat(Math.round(biz.average_rating))}</span>
                  <span className="rating-value">{biz.average_rating > 0 ? biz.average_rating.toFixed(1) : 'Henüz değerlendirme yok'}</span>
                  <span className="review-count">({biz.review_count} yorum)</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;