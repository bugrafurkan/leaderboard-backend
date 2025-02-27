#!/bin/bash
set -e

# PostgreSQL replikasyon kullanıcısı oluştur
echo "Creating replication user..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'replpass';
EOSQL

# Ana veritabanına bağlanıp replication slot oluştur
echo "Setting up replication from master..."
until pg_isready -h $POSTGRES_MASTER_HOST -p 5432 -U $POSTGRES_USER; do
  echo "Waiting for master to be ready..."
  sleep 1
done

# Ana veritabanında replicator kullanıcısını oluştur
PGPASSWORD=$POSTGRES_PASSWORD psql -v ON_ERROR_STOP=1 -h $POSTGRES_MASTER_HOST -U $POSTGRES_USER -d $POSTGRES_DB <<-EOSQL
  CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'replpass';
  SELECT pg_create_physical_replication_slot('replica_slot');
EOSQL

# pg_hba.conf dosyasını güncelle
echo "Updating pg_hba.conf..."
cat > /var/lib/postgresql/data/pg_hba.conf <<-EOF
# TYPE  DATABASE        USER            ADDRESS                 METHOD
# "local" is for Unix domain socket connections only
local   all             all                                     trust
# IPv4 local connections:
host    all             all             127.0.0.1/32            trust
# IPv6 local connections:
host    all             all             ::1/128                 trust
# Allow replication connections
host    replication     replicator      all                     md5
host    all             all             all                     md5
EOF

# postgresql.conf dosyasını replikasyon için güncelle
echo "Updating postgresql.conf for replication..."
cat >> /var/lib/postgresql/data/postgresql.conf <<-EOF
# Replication settings
wal_level = replica
max_wal_senders = 10
wal_keep_segments = 64
hot_standby = on
primary_conninfo = 'host=$POSTGRES_MASTER_HOST port=5432 user=replicator password=replpass'
primary_slot_name = 'replica_slot'
EOF

# recovery.conf dosyasını oluştur (PostgreSQL 11 ve öncesi için)
if [ $(postgres --version | cut -d" " -f3 | cut -d. -f1) -lt 12 ]; then
  echo "Creating recovery.conf for PostgreSQL 11 or below..."
  cat > /var/lib/postgresql/data/recovery.conf <<-EOF
standby_mode = 'on'
primary_conninfo = 'host=$POSTGRES_MASTER_HOST port=5432 user=replicator password=replpass'
primary_slot_name = 'replica_slot'
trigger_file = '/var/lib/postgresql/data/promote_to_master'
EOF
else
  # PostgreSQL 12+ için
  echo "Creating standby.signal file for PostgreSQL 12 or above..."
  touch /var/lib/postgresql/data/standby.signal
fi

# PostgreSQL servisini yeniden başlat
echo "Restarting PostgreSQL for changes to take effect..."
pg_ctl -D /var/lib/postgresql/data restart

echo "Replica setup completed!"
