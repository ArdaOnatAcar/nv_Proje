# Proje Planı Dokümanı (Project Plan Document)

## İçindekiler (Table of Contents)
1.  Proje Kapsamı (Project Scope)
2.  Proje Organizasyonu - Kişiler (Roller ve Sorumluluklar)
3.  Anahtar Aşamalar ve Zaman Çizelgesi (Timeline)
4.  Kaynak Planlaması (Resource Planning)
5.  Risk Yönetimi (Risk Management)
6.  İletişim Planı (Communication Plan)
7.  Değişiklik Yönetim Planı (Change Management)
8.  Efor Tahminleri (Effort Estimations)
9.  Görev Atamaları (Task Assignments)
10. Doküman Görev Matrisi

---

### 1. Proje Kapsamı (Project Scope)
Proje, 1.5 aylık süre kısıtı nedeniyle `localhost` üzerinde çalışacak bir web uygulaması prototipidir. 6 anahtar özelliği (yorumlama dahil) içerecektir. Mobil uygulamalar, ödeme sistemleri ve bulut dağıtımı kapsam dışıdır.

### 2. Proje Organizasyonu - Kişiler (Roller ve Sorumluluklar)
* **Ekip Üyesi 1: Arda Onat Acar**
    * **Rol:** Proje Yöneticisi & Backend Lideri
    * **Sorumluluklar:** Notion panosunun yönetimi, haftalık toplantıların moderasyonu, Backend mimarisinin kurulması, Kullanıcı (Auth) ve Randevu API'lerinin geliştirilmesi.
* **Ekip Üyesi 2: Aybars Kansu Han**
    * **Rol:** Backend Geliştirici & Veritabanı Yöneticisi
    * **Sorumluluklar:** Veritabanı şemasının (SQLite/PostgreSQL) tasarlanması ve oluşturulması. İşletme Profili, Hizmetler ve Yorumlama API'lerinin geliştirilmesi.
* **Ekip Üyesi 3: Eren Budak**
    * **Rol:** Frontend Lideri & UI/UX Tasarımcısı
    * **Sorumluluklar:** React/Vue projesinin kurulması, temel component yapısının (Header, Footer, Button) oluşturulması. Giriş/Kayıt ve Randevu Alma akışlarının kodlanması.
* **Ekip Üyesi 4: Ahmet Adil Akça**
    * **Rol:** Frontend Geliştirici & Test Sorumlusu
    * **Sorumluluklar:** İşletme Listeleme, Profil Sayfası ve Yorum/Puanlama arayüzlerinin kodlanması. Backend API'sinin Postman ile test edilmesi ve Frontend'e entegrasyonu.

### 3. Anahtar Aşamalar ve Zaman Çizelgesi (6 Haftalık Plan)
* **Hafta 1: Planlama ve Kurulum**
    * *Görevler:* Bu dokümanların tamamlanması. Teknoloji seçimi, Trello panosunun oluşturulması, Git deposunun ayarlanması. Veritabanı şeması ve API kontratının (Postman) taslağının hazırlanması.
    * *Teslimat:* Onaylanmış dokümanlar, API Kontratı V1.
* **Hafta 2-3: Backend Geliştirme**
    * *Görevler (Arda & Aybars):* Backend projesinin (Node/FastAPI) kurulması. Veritabanı bağlantısı. Tüm API endpoint'lerinin (Auth, İşletme, Hizmet, Randevu, Yorum) kodlanması ve Postman ile test edilmesi.
    * *Teslimat:* Tamamı Postman ile test edilmiş, çalışan Backend API.
* **Hafta 2-3: Frontend Kurulum & Tasarım**
    * *Görevler (Eren & Adil):* Frontend projesinin (React/Vue) kurulması. Component kütüphanesinin (örn: Material-UI) seçilmesi. Tüm sayfaların "sahte" (mock) verilerle tasarlanması ve kodlanması.
    * *Teslimat:* Tıklanabilir, sahte verilerle çalışan Frontend prototipi.
* **Hafta 4-5: Entegrasyon ve Test**
    * *Görevler (Tüm Ekip):* Frontend ve Backend'in birbirine bağlanması (Arda & Aybars API desteği, Eren & Adil entegrasyonu). Temel akışın (Kayıt -> Randevu Al -> Yorum Yap) uçtan uca test edilmesi.
    * *Teslimat:* Entegre edilmiş, ana fonksiyonları çalışan prototip.
* **Hafta 6: Hata Ayıklama ve Teslimat**
    * *Görevler (Tüm Ekip):* Tespit edilen kritik hataların (bug) düzeltilmesi. `README.md` dosyasının (projenin nasıl çalıştırılacağını anlatan) yazılması. Final sunumunun hazırlanması.
    * *Teslimat:* Final proje sunumu ve Git deposu.

### 4. Kaynak Planlaması (Basit)
* **Geliştirme:** VS Code, Node.js, React, Git, MySQL.
* **Yönetim ve Test:** Notion, WhatsApp, Postman.

### 5. Risk Yönetimi (Basit)
* **Risk:** Entegrasyon Gecikmesi - Frontend ve Backend'in planlandığı gibi Hafta 4'te birleşememesi.
    * **Önlem:** Hafta 1'de hazırlanan API Kontratına (Postman) her iki tarafın da (Backend/Frontend) harfiyen uyması.
* **Risk:** Görevlerin Eşit Dağılmaması.
    * **Önlem:** Haftalık toplantıda Trello panosu üzerinden görevlerin gözden geçirilmesi ve gerekirse yeniden dağıtılması (Proje Yöneticisi sorumluluğunda).

### 6. İletişim Planı (Basit)
* **Günlük İletişim:** WhatsApp üzerinden anlık yazışma (özellikle entegrasyon fazında).
* **Görev Takibi:** Notion (Tüm görevler "To-Do, In-Progress, Done" olarak burada izlenecek).
* **Haftalık Zorunlu Toplantı:** Her Pazartesi 1 saatlik senkronizasyon toplantısı (Geçen haftanın özeti, bu haftanın görev dağılımı).

### 7. Değişiklik Yönetim Planı
Proje süresi (6 hafta) çok kısıtlı olduğundan, **hiçbir değişiklik talebi (yeni özellik) kabul edilmeyecektir.** Tüm odak, Hafta 1'de tanımlanan MVP'yi (6 anahtar özellik) tamamlamak olacaktır.

### 8. Efor Tahminleri (Effort Estimations)
* **Tahmin Yöntemi:** Kapasite Planlaması (4 kişi, kişi başı haftalık 10 saat).
* **Haftalık Efor:** 4 Kişi * 10 Saat/Hafta = 40 Kişi-Saat
* **Toplam Proje Eforu:** 40 Kişi-Saat/Hafta * 6 Hafta = **240 Kişi-Saat**
* **Faz Başına Efor:**
    1.  Hafta 1 (Planlama): 40 Kişi-Saat
    2.  Hafta 2-3 (Paralel Geliştirme): 80 Kişi-Saat
    3.  Hafta 4-5 (Entegrasyon & Test): 80 Kişi-Saat
    4.  Hafta 6 (Hata Ayıklama & Teslimat): 40 Kişi-Saat

### 9. Görev Atamaları (Task Assignments - Proje Geneli)
*Aşağıdaki matris, projenin tamamındaki ana sorumlulukları göstermektedir.*

| Görev / Alan | Sorumlu Kişi(ler) | Rol |
| :--- | :--- | :--- |
| **Backend API (Genel)** | Arda Onat Acar, Aybars Kansu Han | Backend Ekibi |
| Veritabanı Şeması (MySQL) | Aybars Kansu Han | Veritabanı Yöneticisi |
| Kullanıcı Auth API (FR1-3) | Arda Onat Acar | Backend Lideri |
| İşletme & Yorum API (FR4,5,8) | Aybars Kansu Han | Backend Geliştirici |
| Randevu & Müsaitlik API (FR6,7,11,12,13) | Arda Onat Acar | Backend Lideri |
| **Frontend UI/UX (Genel)** | Ahmet Adil Akça , Eren Budak | Frontend Ekibi |
| Proje Kurulumu, Component Kütüphanesi | Ahmet Adil Akça | Frontend Lideri |
| Giriş/Kayıt Sayfaları (FR1-3) | Ahmet Adil Akça | Frontend Lideri |
| İşletme Listeleme/Arama/Profil (FR9,10) | Eren Budak | Frontend Geliştirici |
| Randevu Alma Akışı (FR10,11) | Ahmet Adil Akça | Frontend Lideri |
| Randevularım & Yorum Yapma (FR12,13) | Eren Budak | Frontend Geliştirici |
| İşletme Yönetim Paneli Arayüzü (FR4-7) | Ahmet Adil Akça & Eren Budak | Frontend Ekibi |
| **Test & Yönetim** | | |
| API Testleri (Postman) | Eren Budak | Test Sorumlusu |
| Proje Yönetimi (Notion, Toplantılar) | Arda Onat Acar | Proje Yöneticisi |
| Final Sunum ve `README.md` | Tüm ekip katkısıyla |

### 10. Doküman Görev Matrisi (Document-Specific Task Matrix)
*Bu dokümanın (Proje Planı Dokümanı) oluşturulması sürecindeki görev dağılımı aşağıdadır.*

| Görev | Sorumlu Ekip Üyesi |
| :--- | :--- |
| Proje Organizasyonu (Roller) ve İletişim Planının Yazılması | Ahmet Yılmaz |
| Efor Tahminleri ve Kaynak Planlamasının Yapılması | Burak Kaya |
| Zaman Çizelgesi (Timeline) Oluşturulması | Ceyda Demir |
| Risk Yönetimi ve Değişiklik Yönetim Planı | Deniz Arslan |
| Proje Geneli Görev Atamaları (Task Assignments) Matrisi | Ahmet Yılmaz |