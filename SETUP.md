# Randex - Kurulum ve Kullanım Rehberi

## Hızlı Başlangıç

### Gereksinimler
- Node.js v14 veya üzeri
- npm veya yarn

### Adım 1: Projeyi İndirin
```bash
git clone https://github.com/ArdaOnatAcar/Randex.git
cd Randex
```

### Adım 2: Backend Kurulumu ve Başlatma
```bash
# Bağımlılıkları yükle
npm install

# Backend sunucusunu başlat
npm start
```
Backend sunucusu http://localhost:3001 adresinde çalışacaktır.

### Adım 3: Frontend Kurulumu ve Başlatma
Yeni bir terminal penceresi açın:
```bash
# Frontend dizinine git
cd frontend

# Bağımlılıkları yükle
npm install

# Frontend uygulamasını başlat
npm start
```
Frontend uygulaması http://localhost:3000 adresinde otomatik olarak açılacaktır.

## Uygulamayı Kullanma

### Müşteri Olarak
1. http://localhost:3000/register adresine gidin
2. "Müşteri" hesap tipiyle kayıt olun
3. Giriş yapın
4. Ana sayfada işletmeleri inceleyin
5. Bir işletmeye tıklayarak detayları görün
6. Hizmet seçin, tarih ve saat belirleyin (uygunluk listesi servis süresi ve personel uygunluğuna göre üretilir)
7. Randevu oluşturun (personel seçmezsiniz; sistem otomatik atar)
8. "Randevularım" sayfasından randevularınızı takip edin

### İşletme Sahibi Olarak
1. http://localhost:3000/register adresine gidin
2. "İşletme Sahibi" hesap tipiyle kayıt olun
3. Giriş yapın
4. "İşletmelerim" sayfasına gidin
5. "Yeni İşletme Ekle" butonuna tıklayın
6. İşletme bilgilerini doldurun (ad, tür, adres, çalışma saatleri vb.)
7. Personel (Staff) ekleyin: “Personeller” bölümünden çalışanları oluşturun (ad, aktif)
8. Hizmet Ekle: “Hizmet Ekle” butonuyla hizmet bilgilerini girin (ad, açıklama, fiyat, süre)
9. Bu hizmeti yapabilen personeller: Hizmet formunda “Bu servisi yapabilen personeller” çoklu seçiminden ilgili staff’ları seçin
10. "Randevularım" sayfasından gelen randevuları yönetin (personel ataması otomatik yapılır)

## Veritabanı

Uygulama SQLite veritabanı kullanır. İlk çalıştırmada `randex.db` dosyası otomatik olarak oluşturulur ve gerekli tablolar yaratılır.

### Veritabanını Sıfırlama
Tüm verileri silmek ve baştan başlamak için:
```powershell
Remove-Item .\backend\randex.db -Force
npm start  # Veritabanı yeniden oluşturulacak
```

## Sorun Giderme

### Port Kullanımda Hatası
Eğer 3000 veya 3001 portları kullanımdaysa:
```bash
# Port kullanımını kontrol et
lsof -i :3000
lsof -i :3001

# İlgili işlemi sonlandır
kill -9 <PID>
```

### Modül Bulunamadı Hatası
```bash
# node_modules klasörünü sil ve yeniden yükle
rm -rf node_modules package-lock.json
npm install
```

## Özellikler

✅ Kullanıcı kimlik doğrulama ve yetkilendirme
✅ İşletme oluşturma ve yönetimi
✅ Hizmet ekleme, düzenleme ve silme
✅ Randevu alma sistemi
✅ Uygun saat kontrolü
✅ Randevu durumu yönetimi
✅ Yorum ve değerlendirme sistemi
✅ Türkçe arayüz
✅ Responsive tasarım

## Güvenlik

- Şifreler bcrypt ile hashlenmiştir
- JWT token tabanlı kimlik doğrulama
- Rol bazlı yetkilendirme
- SQL injection koruması
- Güvenli bağımlılıklar (güvenlik taraması yapılmıştır)

## Destek

Sorunlar için GitHub Issues kullanabilirsiniz.
