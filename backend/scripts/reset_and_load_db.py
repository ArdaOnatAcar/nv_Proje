r"""
DİKKAT: TÜM VERİLER SİLİNİR. Önce yedek alın.

SQLite veritabanını sıfırlar; isterseniz SQL dump yükler, isterseniz dummy verilerle seed eder.

Kullanım (Windows PowerShell):
    # Dump yüklemek için
    python .\backend\scripts\reset_and_load_db.py --db-path .\backend\randex.db --sql-dump .\backend\data\seed.sql

    # Dummy veri yüklemek için (dump olmadan)
    python .\backend\scripts\reset_and_load_db.py --db-path .\backend\randex.db --with-dummy

"""

# Genelde şu satırı çalıştırıcaz
# python .\backend\scripts\reset_and_load_db.py --db-path .\backend\randex.db --with-dummy

import argparse
import os
import sys
import sqlite3
import shutil
import subprocess


def reset_sqlite(db_path: str):
    # Veritabanı dosyasını tamamen silip yeniden oluştur
    if os.path.exists(db_path):
        os.remove(db_path)
    # Boş veritabanı oluştur
    sqlite3.connect(db_path).close()


def load_sqlite_dump(db_path: str, dump_path: str):
    if not os.path.exists(dump_path):
        raise FileNotFoundError(f"SQL dump bulunamadı: {dump_path}")

    # Önce sqlite3 CLI var mı kontrol et, varsa ona bırakmak daha hızlıdır
    sqlite3_cli = shutil.which("sqlite3")
    if sqlite3_cli:
        # Windows'ta .read komutu ile dosyayı uygula
        cmd = f'"{sqlite3_cli}" "{db_path}" ".read {dump_path}"'
        subprocess.run(cmd, shell=True, check=True)
        return

    # CLI yoksa Python içinden çalıştır
    with open(dump_path, "r", encoding="utf-8") as f:
        sql = f.read()
    con = sqlite3.connect(db_path)
    try:
        con.executescript(sql)
    finally:
        con.close()


SCHEMA_SQL = """
-- users
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK(role IN ('customer', 'business_owner')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- businesses
CREATE TABLE IF NOT EXISTS businesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    city TEXT,
    district TEXT,
    address TEXT,
    phone TEXT,
    image_url TEXT,
    opening_time TEXT,
    closing_time TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- services
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    duration INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

-- appointments
CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    customer_id INTEGER,
    appointment_date DATE NOT NULL,
    appointment_time TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    staff_id INTEGER,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    customer_name TEXT,
    customer_phone TEXT,
    source TEXT DEFAULT 'customer',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id),
    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (customer_id) REFERENCES users(id)
);

-- reviews
CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES users(id)
);

-- favorites
CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    business_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, business_id),
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

-- business_settings
CREATE TABLE IF NOT EXISTS business_settings (
    business_id INTEGER PRIMARY KEY,
    slot_interval_minutes INTEGER DEFAULT 15,
    min_notice_minutes INTEGER DEFAULT 60,
    booking_window_days INTEGER DEFAULT 30,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

-- staff
CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

-- staff_services
CREATE TABLE IF NOT EXISTS staff_services (
    staff_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    PRIMARY KEY (staff_id, service_id),
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);
"""


DUMMY_SQL = """
-- Users
INSERT INTO users (email, password, name, phone, role) VALUES
('owner1@example.com','{HASH}','İşletme Sahibi 1','05000000001','business_owner'),
('owner2@example.com','{HASH}','İşletme Sahibi 2','05000000002','business_owner'),
('owner3@example.com','{HASH}','İşletme Sahibi 3','05000000009','business_owner'),
('cust1@example.com','{HASH}','Müşteri 1','05000000003','customer'),
('cust2@example.com','{HASH}','Müşteri 2','05000000004','customer'),
('cust3@example.com','{HASH}','Müşteri 3','05000000005','customer'),
('cust4@example.com','{HASH}','Müşteri 4','05000000006','customer');

-- Businesses
INSERT INTO businesses (owner_id, name, type, description, city, district, address, phone, image_url, opening_time, closing_time) VALUES
(1,'Parla Kuaför','kuafor','Saç kesim ve bakım','İstanbul','Kadıköy','Moda Mah. 1','02165550000',NULL,'09:00','20:00'),
(2,'Ne Olur Dövme','dovmeci','Dövme hizmeti','Ankara','Çankaya','Kızılay 2','03125550000',NULL,'10:00','22:00'),
(3,'Nar Güzellik','guzellik','Güzellik Merkezi','İzmir','Konak','Alsancak 3','02325550000',NULL,'08:00','18:00');

-- Services
INSERT INTO services (business_id, name, description, price, duration) VALUES
(1,'Saç Kesim','Klasik saç kesim',250,45),
(1,'Fön','Fön ve şekillendirme',150,30),
(2,'Büyük Dövme','Dövme hizmeti',5000,60),
(2,'Küçük Dövme','Küçük dövme hizmeti',3000,30),
(3,'Yüz Maskesi','Yüz maskesi',350,40),
(3,'Nail Art','Tırnak süsleme',700,50);

-- Staff
INSERT INTO staff (business_id, name, active) VALUES
(1,'Ahmet',1),
(1,'Ayşe',1),
(2,'Mehmet',1),
(3,'Selin',1),
(3,'Ali',1);

-- Staff services (Az hizmet veren öncelik testi için eşleşmeler)
INSERT INTO staff_services (staff_id, service_id) VALUES
(1,1), (1,2),
(2,1),
(3,3), (3,4),
(4,5), (5,5), (5,6);

-- Business settings
INSERT INTO business_settings (business_id, slot_interval_minutes, min_notice_minutes, booking_window_days) VALUES
(1,15,60,30),
(2,20,120,45),
(3,15,30,20);

-- Appointments (bazıları geçmiş tarihli)
INSERT INTO appointments (business_id, service_id, customer_id, appointment_date, appointment_time, status, customer_name, customer_phone, source, notes, staff_id) VALUES
(1,1,3,date('now','-40 days'),'10:00','completed','Müşteri 1','05000000003','customer','Geçmiş randevu',1),
(1,2,4,date('now','-10 days'),'11:30','confirmed','Müşteri 2','05000000004','customer','Yakın geçmiş',2),
(2,3,3,date('now','+2 days'),'14:00','pending','Müşteri 1','05000000003','customer','Gelecek randevu',3),
(2,4,5,date('now','+5 days'),'16:00','pending','Müşteri 3','05000000005','customer','Aroma terapi',3),
(3,5,3,date('now','-1 days'),'09:30','confirmed','Müşteri 1','05000000003','owner','Muayene',4),
(3,6,6,date('now','+1 days'),'12:00','pending','Müşteri 4','05000000006','customer','Fzt seans',5);

-- Reviews (sadece tamamlanan/geçmiş için)
INSERT INTO reviews (business_id, customer_id, rating, comment) VALUES
(1,3,5,'Harika hizmet'),
(2,3,4,'İyi fakat yoğun'),
(2,4,5,'Çok memnun kaldım'),
(1,4,4,'İdare eder'),
(3,3,5,'Profesyonel yaklaşım');

-- Favorites
INSERT OR IGNORE INTO favorites (customer_id, business_id) VALUES
(3,1), (3,2), (4,2), (5,3), (6,1);
"""


def seed_dummy(db_path: str):
    # Derive bcrypt hash for a safe dev password using Node+bcryptjs
    def get_bcrypt_hash(pw: str) -> str:
        node = shutil.which("node")
        if not node:
            raise RuntimeError("Node.js bulunamadı. Lütfen Node.js kurun veya precomputed bcrypt hash kullanın.")
        js = "console.log(require('bcryptjs').hashSync(process.argv[1], 10))"
        try:
            # Çalışma dizini backend klasörü olsun ki local node_modules görülsün
            out = subprocess.check_output([node, "-e", js, pw], stderr=subprocess.STDOUT, cwd=os.path.join(os.path.dirname(__file__), ".."))
            return out.decode().strip()
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"Node ile bcrypt hash üretimi başarısız. 'npm install' ile bcryptjs kurulu mu? Ayrıntı: {e.output.decode()}")

    dev_password = "Test123!"
    hashed = get_bcrypt_hash(dev_password)

    con = sqlite3.connect(db_path)
    try:
        con.executescript(SCHEMA_SQL)
        # inject hashed password into dummy SQL
        con.executescript(DUMMY_SQL.format(HASH=hashed))
    finally:
        con.close()
    print("Dummy kullanıcılar şifre ile oluşturuldu: Test123!\nGiriş için örnek: cust1@example.com / Test123!")


def main():
    p = argparse.ArgumentParser(description="SQLite DB reset ve dump/dummy yükleme")
    p.add_argument("--db-path", required=True, help="SQLite veritabanı dosya yolu (ör: .\\backend\\randex.db)")
    p.add_argument("--sql-dump", help="Hazır SQL dump dosya yolu (ör: .\\backend\\data\\seed.sql)")
    p.add_argument("--with-dummy", action="store_true", help="Dump olmadan dummy verilerle seed et")
    args = p.parse_args()

    # Yolları normalize et
    db_path = os.path.normpath(args.db_path)
    dump_path = os.path.normpath(args.sql_dump) if args.sql_dump else None

    print("SQLite reset başlıyor...")
    reset_sqlite(db_path)

    if dump_path:
        print("Dump yükleniyor...")
        load_sqlite_dump(db_path, dump_path)
    if args.with_dummy:
        print("Dummy veriler yükleniyor...")
        seed_dummy(db_path)

    print("Tamamlandı: Veritabanı sıfırlandı ve seçilen yükleme tamamlandı.")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Hata: {e}", file=sys.stderr)
        sys.exit(1)
