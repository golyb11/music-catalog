#!/bin/sh
set -e

echo "Ожидание готовности базы данных и синхронизация схемы Prisma..."
node node_modules/prisma/build/index.js db push --skip-generate || node node_modules/prisma/build/index.js migrate deploy

if [ "$SEED_DEMO_DATA" = "true" ]; then
  echo "Сидирование демо-данными (пропускается, если данные уже есть)..."
  node prisma/seed.cjs || echo "Сидирование не выполнено (не критично), продолжаю."
fi

echo "Запуск сервера на порту ${PORT:-3000}..."
exec node server.js
