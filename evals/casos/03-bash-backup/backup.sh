#!/bin/bash
# Backup diário do banco, roda pelo cron às 02:00 como root

DESTINO=$1
SENHA=$(grep '^DB_PASSWORD=' /opt/app/.env | cut -d= -f2-)
DATA=$(date +%F)

cd $DESTINO
rm -rf $DESTINO/antigos/*

mysqldump -u backup -p$SENHA --single-transaction app > /tmp/dump.sql
gzip -c /tmp/dump.sql > $DESTINO/app-$DATA.sql.gz
rm /tmp/dump.sql

# mantém os 7 mais recentes
for f in $(ls -t $DESTINO/*.sql.gz | tail -n +8); do
  mv $f $DESTINO/antigos/
done

echo "backup ok"
