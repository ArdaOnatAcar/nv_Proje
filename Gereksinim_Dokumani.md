# Gereksinim Dokümanı (Requirements Document)

## İçindekiler (Table of Contents)
1.  Fonksiyonel Gereksinimler (Functional Requirements)
    * 1.1. Kullanıcı Yönetimi
    * 1.2. İşletme Fonksiyonları (İşletme Rolü)
    * 1.3. Müşteri Fonksiyonları (Müşteri Rolü)
2.  Fonksiyonel Olmayan Gereksinimler (Non-Functional Requirements)
3.  Doküman Görev Matrisi

---

### 1. Fonksiyonel Gereksinimler (Functional Requirements)

#### 1.1. Kullanıcı Yönetimi
* **FR1:** Kullanıcı, ad, e-posta, şifre ve "Kullanıcı Rolü" (Müşteri / İşletme) seçerek sisteme kayıt olabilmelidir.
* **FR2:** Kayıtlı kullanıcılar e-posta ve şifreleri ile sisteme giriş yapabilmelidir.
* **FR3:** Giriş yapan kullanıcı, rolüne (Müşteri veya İşletme) göre farklı bir ana sayfaya/arayüze yönlendirilmelidir.

#### 1.2. İşletme Fonksiyonları (İşletme Rolü)
* **FR4:** İşletme, kendi profil sayfasını (işletme adı, adres) oluşturabilmeli ve güncelleyebilmelidir.
* **FR5:** İşletme, sunduğu hizmetleri (hizmet adı, fiyat) ekleyebilmeli, düzenleyebilmeli ve silebilmelidir.
* **FR6:** İşletme, belirli bir tarih ve saat için (örn: 29 Ekim, 14:00) "müsait" bir randevu slotu oluşturabilmelidir.
* **FR7:** İşletme, kendi takviminde hem "müsait" hem de müşteriler tarafından "doldurulmuş" slotlarını görebilmelidir (Müşteri adıyla birlikte).
* **FR8:** İşletme, kendi profiline bırakılan yorumları ve ortalama puanını görebilmelidir.

#### 1.3. Müşteri Fonksiyonları (Müşteri Rolü)
* **FR9:** Müşteri, sistemdeki tüm kayıtlı işletmelerin listesini görebilmeli ve işletme adına göre arama yapabilmelidir.
* **FR10:** Müşteri, bir işletmenin üzerine tıkladığında o işletmenin profilini, hizmetlerini, yorumlarını ve *sadece müsait olan* randevu slotlarını görebilmelidir.
* **FR11:** Müşteri, müsait bir randevu slotunu seçerek kendi adına randevu alabilmelidir.
* **FR12:** Müşteri, "Randevularım" sayfasında aldığı tüm yaklaşan randevuları görebilmeli ve iptal edebilmelidir.
* **FR13:** Müşteri, "Geçmiş Randevularım" listesinden, tamamladığı hizmetler için 1-5 arası puan ve yazılı yorum bırakabilmelidir.

### 2. Fonksiyonel Olmayan Gereksinimler (Non-Functional Requirements)
* **NFR1 (Kurulum):** Proje, `README.md` dosyasındaki talimatlarla (`npm install` ve `npm start` gibi) `localhost` üzerinde 5 dakika içinde çalıştırılabilmelidir.
* **NFR2 (Performans):** Uygulama `localhost` üzerinde çalışırken, sayfa geçişleri ve veritabanı sorguları 1 saniye altında tamamlanmalıdır.
* **NFR3 (Güvenlik):** Kullanıcı şifreleri veritabanında mutlaka `hash`lenerek (örn: bcrypt) saklanmalıdır.
* **NFR4 (Uyumluluk):** Web uygulaması, güncel Google Chrome ve Firefox tarayıcılarında sorunsuz çalışmalıdır.
* **NFR5 (Veri Bütünlüğü):** İki müşterinin, aynı işletmeden, aynı saat dilimine aynı anda randevu alması (Race Condition) veritabanı seviyesinde engellenmelidir.

### 3. Doküman Görev Matrisi (Document-Specific Task Matrix)
*Bu dokümanın (Gereksinim Dokümanı) oluşturulması sürecindeki görev dağılımı aşağıdadır.*

| Görev | Sorumlu Ekip Üyesi |
| :--- | :--- |
| Kullanıcı Yönetimi (Auth) ve İşletme Fonksiyonları (FR) | Burak Kaya |
| Müşteri ve Randevu/Yorum Fonksiyonları (FR) | Ceyda Demir |
| Fonksiyonel Olmayan (NFR) Gereksinimlerin Belirlenmesi | Deniz Arslan |
| Tüm gereksinimlerin gözden geçirilmesi ve finalize edilmesi | Ahmet Yılmaz |