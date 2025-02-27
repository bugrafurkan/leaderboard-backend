Leaderboard Projesi

Bu proje, yüksek trafikli bir Leaderboard uygulamasının hem backend (Node.js, PostgreSQL, Redis, RabbitMQ) hem de frontend (ör. React, Vue veya Angular) kısımlarını Docker Compose ile yönetir. Ayrıca izleme (Prometheus, Grafana), kuyruk yönetimi (RabbitMQ) ve cache/cluster (Redis) içeren bir mimariye sahiptir.
İçindekiler

    Kurulum Önkoşulları
    Dosya Yapısı
    Docker Compose ile Çalıştırma
    Çoklu Replikalar Neden ve Nasıl
    Büyük Veri Yönetimi
    Önemli Notlar / Sık Sorulan Sorular

Kurulum Önkoşulları

    Docker 20.x veya üstü
    Docker Compose v2 (veya klasik docker-compose v1.29+)
    Sunucu / Geliştirme makinenizde 80 ve 443 portları serbest (veya uygun portlar)
    2+ CPU ve en az 4-8 GB RAM (projeye göre değişiklik gösterebilir)

Dosya Yapısı

Örnek bir dizin yerleşimi (kendi projenize göre uyarlayın):

leaderboard-backend/
  ├─ Dockerfile
  ├─ src/...
  ├─ package.json
  ├─ ... 
leaderboard-frontend/
  ├─ Dockerfile
  ├─ dist/ (derlenmiş dosyalar)
  ├─ src/...
docker-compose.yml
nginx/
  ├─ nginx.conf
  ├─ conf.d/ (opsiyonel)
  ├─ ssl/ (sertifikalar, opsiyonel)
postgres/
  ├─ postgresql.conf
  ├─ setup-replica.sh
rabbitmq/
  ├─ rabbitmq.conf
  ├─ enabled_plugins
grafana/
  ├─ provisioning/...
prometheus/
  ├─ prometheus.yml
README.md
...

Bu yapıda backend ve frontend ayrı dizinlerde, docker-compose.yml ise üst dizinde duruyor.
Docker Compose ile Çalıştırma

    Ortam Değişkenleri (Opsiyonel)
    .env dosyasında, POSTGRES_PASSWORD, RABBITMQ_USER, JWT_SECRET vb. değerleri belirleyebilirsiniz.

    İlk Kurulum
    Tüm container’ları ayağa kaldırmak için:

docker-compose up -d --build

Bu komut, sırasıyla:

    PostgreSQL (Primary & Replica)
    Redis (Master cluster)
    RabbitMQ (management)
    Leaderboard Backend (Node.js)
    Worker Service (Node.js)
    Nginx (reverse proxy, load balancer)
    Prometheus, Grafana (monitoring)
    (Opsiyonel) Leaderboard Frontend
    container’larını oluşturur ve başlatır.

Log’ları İnceleme (Opsiyonel)
Her servisin loglarını tek tek görüntülemek için:

docker-compose logs -f leaderboard-backend
docker-compose logs -f rabbitmq
...

Kapatma
Projeyi durdurmak için:

docker-compose down

(Varsayılan olarak container’lar silinir, named volumes verisi kalır.)

Ölçeklendirme
Daha sonra, backend veya worker gibi servisleri ölçeklendirmek (aynı anda birden fazla container örneği):

    docker-compose up -d --scale leaderboard-backend=2 --scale worker=3


Çoklu Replikalar Neden ve Nasıl

    Neden: Yüksek trafikli ortamlarda aynı servisin birden fazla kopyasını (replicas) çalıştırarak yatay ölçekleme yapmak, daha fazla eşzamanlı istemciye cevap vermek ve kesintisiz hizmet sağlamak için.
    Nasıl:
        leaderboard-backend’te deploy.replicas: 2 ekleyerek ya da docker-compose up --scale leaderboard-backend=2 kullanarak.
        Host port çakışması olmaması için leaderboard-backend servisine doğrudan ports: satırı eklemiyoruz.
        Trafik, Nginx reverse proxy üzerinden “container ismi:port” (örn. leaderboard-backend:3000) yoluyla dağıtılır.
        Docker’ın default DNS round-robin mantığı ile container’lar arasında yük dağıtılır.

Büyük Veri Yönetimi

    PostgreSQL:
        Primary ve Replica kurulumuyla verileri çoğaltır. Büyük veri tablolarında disk IO’yu azaltmak için replikadan okuma (READ) yapabilirsiniz.
        postgresql.conf’da bellek (shared_buffers, work_mem) ve WAL ayarlarını optimize edin.
    Redis Cluster:
        3 Master node (ve opsiyonel 3 replica) ile yüksek performanslı cache/storage. Büyük veri yönetiminde sık erişilen verileri Redis’e aktarıp sorgu hızını artırabilirsiniz.
    RabbitMQ:
        Kuyrukların boyut ve hacmini policy veya quorum queue ile yönetebilirsiniz. Büyük veri veya çok sayıda mesaj, Worker service ile asenkron işlenebilir.
    Sharding ve Partition (Opsiyonel):
        Veritabanlarını yatay bölerek veya Redis’te ek cluster node’lar ekleyerek.
        RabbitMQ’de farklı vhost/policy kurguları.

Böylece on milyonlarca kullanıcı ve yüksek sorgu hacmini yönetmeye uygun bir altyapı oluşturmuş olmayı ön görüyoruz.
Önemli Notlar

    Tarayıcıda hangi port?
        Nginx host’ta 80:80 (veya 3000:80) map edildiği için http://localhost (veya http://localhost:3000) üzerinden projeye erişebilirsiniz.
        Eğer SSL (443) kullanıyorsanız, sertifikaları nginx/ssl/ dizinine koyup Nginx config’inde listen 443 ssl; ayarlarını yapın, ardından docker-compose up -d --build.

    Frontend ve Backend Aynı Domainde mi?
        Evet, Nginx üzerinden proxy yaparak http://localhost/ ile frontend (statik dosyalar) yüklenir, /api/v1/... gibi path’ler backend’e yönlendirilir.

    Veri Kalıcılığı
        Postgres, Redis, RabbitMQ gibi servislerde volumes: tanımıyla kalıcı disk alanı (named volumes) kullanılıyor. docker-compose down -v derseniz veriler silinir, dikkatli olun.

    Performans ve Kaynak Ayarı
        deploy.resources.limits veya --scale ayarlarını projenin gereksinimlerine göre şekillendirin. Docker Desktop kullanıyorsanız yeterli CPU/RAM ayrıldığından emin olun.

Bu README.md içinde özetlediğimiz gibi, projenin tamamı Docker Compose üzerinden birkaç komutla ayağa kalkacak şekilde tasarlanmıştır. Dilerseniz Docker Swarm veya Kubernetes gibi platformlara da taşıyabilir, hem development hem production senaryolarında esnek bir mimari elde edebilirsiniz.
