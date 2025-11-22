# Proje Tanım Dokümanı (Project Definition Document)

## İçindekiler (Table of Contents)
1.  Proje Adı
2.  Proje Özeti
3.  Hedefler (Objectives)
4.  Kapsam (Scope)
5.  Hedef Kitle (Target Audience)
6.  Anahtar Özellikler (Key Features)
7.  Çıktılar (Deliverables)
8.  Bütçe ve Kaynaklar (Budget and Resources)
9.  Riskler ve Azaltma Stratejileri
10. Proje Başarı Kriterleri
11. Doküman Görev Matrisi

---

### 1. Proje Adı
**Randex: Randevu Sistemi**

### 2. Proje Özeti
Bu proje, yazılım mühendisliği dersi kapsamında geliştirilen, `localhost` ortamında çalışması hedeflenen bir web uygulamasıdır. Proje, berber, kuaför, güzellik merkezi ve psikolog gibi saatlik randevu ile çalışan yerel işletmelerle bu hizmetlere ihtiyaç duyan müşterileri buluşturan basit bir pazar yerini simüle etmeyi amaçlar.

Temel amaç, 1.5 aylık kısıtlı sürede, bir pazar yeri uygulamasının temel fonksiyonlarını (çift taraflı kullanıcı rolleri, profil yönetimi, randevu ve yorumlama) 4 kişilik bir ekiple çalışan bir prototip olarak sunmaktır. Uygulama, buluta taşınmayacak ve ödeme sistemleri içermeyecektir.

### 3. Hedefler (Objectives)
* "Müşteri" ve "İşletme Sahibi" olmak üzere iki farklı kullanıcı rolünü yönetebilen bir kimlik doğrulama sistemi uygulamak.
* İşletme sahiplerinin profillerini, hizmetlerini ve müsait randevu saatlerini yönetebileceği bir web paneli oluşturmak.
* Müşterilerin, işletmeleri listeleyebilmesi, profillerini inceleyebilmesi ve online randevu alabilmesini sağlamak.
* Müşterilerin, tamamladıkları randevulara puan ve yorum bırakabilmesini sağlamak.
* Tüm veri işlemlerini `localhost` üzerinde çalışan bir veritabanı (örn: SQLite veya lokal PostgreSQL/MySQL) ile yönetmek.

### 4. Kapsam (Scope)
**Kapsama Dahil Olanlar (In-Scope):**
* Web tabanlı uygulama (Desktop tarayıcılar için).
* `localhost` üzerinde çalıştırma (Deployment/Hosting yok).
* İki kullanıcı rolü (Müşteri, İşletme).
* Temel Kullanıcı Kayıt/Giriş (Authentication).
* İşletmeler için CRUD işlemleri (Profil, Hizmetler, Müsait Saatler).
* Müşteriler için Randevu CRUD işlemleri (Alma, Listeleme, İptal Etme).
* Temel Puanlama ve Yorumlama sistemi.

**Kapsam Dışı Olanlar (Out-of-Scope):**
* **Mobil Uygulama** (iOS/Android).
* **Bulut Dağıtımı (Deployment):** Proje (Heroku, Vercel, AWS vb. platformlara yüklenmeyecek).
* **Ödeme Sistemleri:** Tüm ödemeler kapsam dışıdır.
* **Konum Bazlı Arama/Harita:** Sadece işletme adı/kategorisine göre listeleme olacak.
* **Gelişmiş Özellikler:** Parola sıfırlama, anlık bildirimler, canlı sohbet.

### 5. Hedef Kitle (Target Audience)
* **Bireysel Müşteriler:** Yerel hizmetlere (kişisel bakım, sağlık vb.) kolayca erişmek ve `localhost` demosunda randevu alma sürecini test etmek isteyen kullanıcılar.
* **KOBİ İşletme Sahipleri:** Randevu defterini dijitalleştirmek ve randevu yönetiminin nasıl çalıştığını test etmek isteyen küçük ve orta ölçekli hizmet sağlayıcılar.

### 6. Anahtar Özellikler (Key Features)
1.  **Çift Rolü Kullanıcı Kaydı:** Kullanıcının "Müşteri" veya "İşletme" olarak kaydolabilmesi.
2.  **İşletme Profil Yönetimi (İşletme):** İşletme adını, adresini ve sunduğu hizmetleri (isim, süre, fiyat) ekleyip/silebilmesi.
3.  **Müsaitlik Yönetimi (İşletme):** İşletmenin, manuel olarak "müsait randevu slotları" (örn: 29 Ekim Salı, 14:00-15:00) ekleyebilmesi.
4.  **İşletme Listeleme ve Arama (Müşteri):** Müşterinin sistemdeki tüm işletmeleri bir liste halinde görebilmesi ve isimle arayabilmesi.
5.  **Randevu Alma (Müşteri):** Müşterinin, işletmenin "müsait" bir slotunu seçerek kendi adına rezerve edebilmesi (Slot'un "dolu" hale gelmesi).
6.  **Puan & Yorum Sistemi (Müşteri):** Müşterinin, *tamamlanmış* randevuları için 1-5 arası puan verebilmesi ve kısa bir yorum yazabilmesi.

### 7. Çıktılar (Deliverables)
* Proje Tanım, Gereksinim ve Proje Planı Dokümanları.
* Veritabanı Şeması.
* API Dokümantasyonu (Postman Collection veya Swagger).
* Web Uygulaması (Frontend) Kaynak Kodları (GitHub Deposu).
* Backend API Kaynak Kodları (GitHub Deposu).
* Final Sunumu ve `localhost` üzerinde canlı demo.

### 8. Bütçe ve Kaynaklar (Budget and Resources)
* **Ekip:** 4 Yazılım Mühendisliği Öğrencisi.
* **Yazılım Araçları (Tümü Ücretsiz):**
    * Kodlama: VS Code
    * Versiyon Kontrol: Git, GitHub
    * API Geliştirme: Node.js (Express) veya Python (FastAPI)
    * Frontend: React (veya Vue.js)
    * Veritabanı: **SQLite** veya lokal MySQL.
    * Proje Yönetimi: Notion.
    * İletişim: WhatsApp.
* **Bütçe:** 0 TL. Tüm proje, ücretsiz ve açık kaynaklı araçlarla `localhost` üzerinde geliştirilecektir.

### 9. Riskler ve Azaltma Stratejileri
* **Risk:** İletişim Yetersizliği ve Eşgüdüm Sorunu (4 kişilik ekipte).
    * **Azaltma:** Proje yönetimi için Notion'ın aktif kullanılması, net görev dağılımı ve zorunlu haftalık 1 saatlik senkronizasyon toplantısı.
* **Risk:** Entegrasyon Sorunları (Frontend ve Backend'in birleşmesi).
    * **Azaltma:** Kodlamaya başlamadan önce API kontratının (endpoint'ler, JSON yapıları) Postman/Swagger ile net bir şekilde tanımlanması ve tüm ekiple paylaşılması.
* **Risk:** Kapsam Kayması (Scope Creep) - Süre kısıtına rağmen yeni özellikler ekleme isteği.
    * **Azaltma:** Bu dokümanda tanımlanan 6 anahtar özelliğe sadık kalınması. Tüm yeni fikirlerin "Gelecek Sürüm" olarak etiketlenip ertelenmesi.

### 10. Proje Başarı Kriterleri
1.  **Fonksiyonellik:** Tanımlanan 6 anahtar özelliğin tamamının `localhost` demosunda hatasız çalışması.
2.  **Temel Akış:** Bir "İşletme" kullanıcısının kayıt olup slot ekleyebilmesi VE bir "Müşteri" kullanıcısının bu slotu rezerve edip sonrasında yoruma bırakabilmesi akışının başarıyla tamamlanması.
3.  **Teslimat:** Projenin, 6 haftalık zaman sınırı içinde tamamlanıp sunulması.

### 11. Doküman Görev Matrisi (Document-Specific Task Matrix)
*Bu dokümanın (Proje Tanım Dokümanı) oluşturulması sürecindeki görev dağılımı aşağıdadır.*

| Görev | Sorumlu Ekip Üyesi |
| :--- | :--- |
| Proje Özeti ve Hedeflerin Yazılması |  Arda Onat Acar |
| Kapsam (Scope) ve Kapsam Dışı (Out-of-Scope) Tanımlaması | Ahmet Adil Akça |
| Hedef Kitle ve Anahtar Özelliklerin Belirlenmesi | Aybars Kansu Han |
| Riskler ve Başarı Kriterlerinin Yazılması | Eren Budak |
| Dokümanın son okuması ve revizyonu | Eren Budak |