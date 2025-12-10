# Randex - Randevu Yönetim Sistemi

Randex, berber, kuaför, dövmeci ve güzellik merkezleri gibi saatlik randevu üzerine çalışan işletmeleri tek bir uygulamada toplayan bir randevu yönetim sistemidir.

 - İşletmeleri tür/şehir/ilçe göre filtreleme ve arama
 - Arama çubuğu işletme adı/açıklama yanında hizmet adı/açıklamayı da tarar
- Uygun tarih ve saatlerde randevu alma
- Randevuları görüntüleme ve yönetme

### Arama ve Sıralama
 - `minRating` eşiği ile puan filtresi (örn: 4.0+)
 - `reviewCountRange` ile yorum sayısı aralığı (0-50, 51-200, 200+)
 - Sıralama: `rating` (puan) veya `reviews` (yorum sayısı)
- Hizmet ekleme, düzenleme ve silme
- Çalışma saatlerini belirleme
- Gelen randevuları görüntüleme ve onaylama
- Randevu durumunu güncelleme (beklemede, onaylandı, iptal, tamamlandı)


Veritabanını dummy verilerle hızlıca doldurmak için:
```powershell
python .\backend\scripts\reset_and_load_db.py --db-path .\backend\randex.db --with-dummy
```
## Teknolojiler

### Backend
- Node.js
- Express.js

`.env` içinde `REACT_APP_API_URL` ayarlanmadıysa, frontend `package.json` içindeki `proxy` sayesinde `http://localhost:3001/api` adresine bağlanır.
- SQLite (veritabanı)
- JWT (kimlik doğrulama)
 - Sorgu parametreleri: `type`, `city`, `district`, `search`, `sort`, `minRating`, `reviewCountRange`
 - Not: `search` hem işletme adı/açıklama hem de hizmet adı/açıklama içinde arar
### Frontend
- React
 - `GET /api/businesses/:id/availability?service_id=...&date=YYYY-MM-DD` - Uygun saatler (servis ve personel uygunluğuna göre)
- Axios
- CSS3

## Kurulum

 - city, district alanları ile konum bilgisi
- Node.js (v14 veya üzeri)
- npm veya yarn
 - id, business_id, service_id, customer_id, appointment_date, appointment_time, start_time, end_time, staff_id, status, notes
### Backend Kurulumu

1. Projeyi klonlayın veya indirin
2. Proje dizinine gidin:
```bash
cd Randex
```

3. Bağımlılıkları yükleyin:
```bash
npm install
```

4. `.env` dosyasını oluşturun (`.env.example` dosyasından kopyalayabilirsiniz)

5. Backend sunucusunu başlatın:
```bash
npm start
```

Backend sunucusu http://localhost:3001 adresinde çalışacaktır.

### Frontend Kurulumu

1. Frontend dizinine gidin:
```bash
cd frontend
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Frontend uygulamasını başlatın:
```bash
npm start
```

Frontend uygulaması http://localhost:3000 adresinde açılacaktır.

## Kullanım

### İlk Adımlar

1. Uygulamaya http://localhost:3000 adresinden erişin
2. "Kayıt Ol" butonuna tıklayın
3. Müşteri veya İşletme Sahibi olarak kayıt olun
4. Giriş yapın

### Müşteri Olarak Kullanım

1. Ana sayfada işletmeleri inceleyin
2. İşletme türüne göre filtreleme yapın veya arama yapın
3. Bir işletmeye tıklayarak detaylarını görüntüleyin
4. Hizmet seçin, tarih ve saat belirleyerek randevu alın
5. "Randevularım" sayfasından randevularınızı takip edin
6. Tamamlanan randevular için yorum bırakın

### İşletme Sahibi Olarak Kullanım

1. "İşletmelerim" sayfasına gidin
2. "Yeni İşletme Ekle" butonuna tıklayın
3. İşletme bilgilerini doldurun (ad, tür, adres, çalışma saatleri vb.)
4. İşletme oluşturulduktan sonra hizmet ekleyin
5. Her hizmet için ad, açıklama, fiyat ve süre belirleyin
6. "Randevularım" sayfasından gelen randevuları görüntüleyin
7. Randevuları onaylayın veya iptal edin
8. Tamamlanan randevuları işaretleyin

## API Endpoints

### Kimlik Doğrulama
- `POST /api/auth/register` - Kayıt ol
- `POST /api/auth/login` - Giriş yap

### İşletmeler
- `GET /api/businesses` - Tüm işletmeleri listele
- `GET /api/businesses/:id` - İşletme detayları
- `POST /api/businesses` - İşletme oluştur (İşletme sahibi)
- `PUT /api/businesses/:id` - İşletme güncelle (İşletme sahibi)
- `DELETE /api/businesses/:id` - İşletme sil (İşletme sahibi)
- `GET /api/businesses/owner/my-businesses` - Kendi işletmelerimi getir

### Hizmetler
- `GET /api/services/business/:businessId` - İşletmeye ait hizmetler
- `POST /api/services` - Hizmet ekle (İşletme sahibi)
- `PUT /api/services/:id` - Hizmet güncelle (İşletme sahibi)
- `DELETE /api/services/:id` - Hizmet sil (İşletme sahibi)

### Randevular
- `GET /api/appointments/my-appointments` - Randevularım
- `GET /api/appointments/available-slots/:businessId/:date` - Uygun saatler
- `POST /api/appointments` - Randevu oluştur
- `PUT /api/appointments/:id/status` - Randevu durumu güncelle

### Yorumlar
- `GET /api/reviews/business/:businessId` - İşletme yorumları
- `POST /api/reviews` - Yorum ekle
- `PUT /api/reviews/:id` - Yorum güncelle
- `DELETE /api/reviews/:id` - Yorum sil

## Veritabanı Yapısı

### Users (Kullanıcılar)
- id, email, password, name, phone, role (customer/business_owner)

### Businesses (İşletmeler)
- id, owner_id, name, type, description, address, phone, image_url, opening_time, closing_time

### Services (Hizmetler)
- id, business_id, name, description, price, duration

### Appointments (Randevular)
- id, business_id, service_id, customer_id, appointment_date, appointment_time, status, notes

### Reviews (Yorumlar)
- id, business_id, customer_id, rating, comment

## Güvenlik

- Şifreler bcrypt ile hashlenir
- JWT token ile kimlik doğrulama
- Rol bazlı yetkilendirme
- API endpoint'leri güvenli

## Lisans

ISC

## Geliştirici

Bu proje Randex ekibi tarafından geliştirilmiştir.
