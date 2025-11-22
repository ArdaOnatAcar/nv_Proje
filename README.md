# Randex - Randevu Yönetim Sistemi

Randex, berber, kuaför, dövmeci ve güzellik merkezleri gibi saatlik randevu üzerine çalışan işletmeleri tek bir uygulamada toplayan bir randevu yönetim sistemidir.

## Özellikler

### Müşteri Özellikleri
- İşletmeleri türlerine göre filtreleme ve arama
- İşletme detaylarını, hizmetleri, fiyatları ve yorumları görüntüleme
- Uygun tarih ve saatlerde randevu alma
- Randevuları görüntüleme ve yönetme
- Tamamlanan randevular için yorum ve değerlendirme yapma

### İşletme Sahibi Özellikleri
- İşletme oluşturma ve yönetme
- Hizmet ekleme, düzenleme ve silme
- Çalışma saatlerini belirleme
- Gelen randevuları görüntüleme ve onaylama
- Randevu durumunu güncelleme (beklemede, onaylandı, iptal, tamamlandı)

## Teknolojiler

### Backend
- Node.js
- Express.js
- SQLite (veritabanı)
- JWT (kimlik doğrulama)
- bcrypt (şifre hashleme)

### Frontend
- React
- React Router
- Axios
- CSS3

## Kurulum

### Gereksinimler
- Node.js (v14 veya üzeri)
- npm veya yarn

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
