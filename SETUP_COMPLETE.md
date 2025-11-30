# ✅ Vercel PostgreSQL Setup Checklist

## Что я сделал для вас:

### ✅ 1. Обновил Prisma конфигурацию
- Изменил provider с `sqlite` на `postgresql`
- Добавил правильные переменные окружения:
  - `POSTGRES_PRISMA_URL` - для приложения (с connection pooling)
  - `POSTGRES_URL_NON_POOLING` - для миграций

### ✅ 2. Создал файлы конфигурации
- `.env.local` - для локального тестирования
- `vercel.json` - конфигурация для Vercel
- `VERCEL_POSTGRES_SETUP.md` - подробная инструкция

### ✅ 3. Создал миграции для PostgreSQL
- Файл `/prisma/migrations/0_init/migration.sql`
- Содержит все таблицы с правильными типами для PostgreSQL

### ✅ 4. Обновил package.json
- Добавил `@vercel/postgres` в dependencies
- Обновил build script для запуска миграций: `prisma generate && prisma migrate deploy`
- Добавил новые скрипты:
  - `npm run db:push` - для локального push
  - `npm run db:migrate` - для создания миграций
  - `npm run db:init` - полная инициализация БД

### ✅ 5. Создал вспомогательные скрипты
- `scripts/setup-vercel-db.sh` - для Linux/Mac
- `scripts/setup-vercel-db.ps1` - для Windows PowerShell

## 🚀 Что делать дальше:

### Шаг 1: Создать Vercel Postgres БД
1. Откой https://vercel.com/dashboard
2. Выбери свой проект
3. Storage → Create Database → Postgres
4. Выбери регион и подтверди

### Шаг 2: Добавить Environment Variables в Vercel
1. Settings → Environment Variables
2. Добавь две переменные:
   - `POSTGRES_PRISMA_URL` = (Connection String из Vercel)
   - `POSTGRES_URL_NON_POOLING` = (Connection String из Vercel)
3. Убедись все окружения отмечены (Production, Preview, Development)

### Шаг 3: Обновить .env.local (для локального тестирования - опционально)
```
POSTGRES_PRISMA_URL="postgresql://..."
POSTGRES_URL_NON_POOLING="postgresql://..."
```

### Шаг 4: Задеплоить
```bash
git add .
git commit -m "Setup Vercel PostgreSQL"
git push
```

Vercel автоматически:
- Установит зависимости
- Запустит миграции
- Развернёт приложение

### Шаг 5: Проверить
1. Откой свой деплой URL
2. Создай аккаунт
3. Убедись что данные сохраняются

## 📋 Файлы которые были изменены:

- ✅ `prisma/schema.prisma` - изменён provider на PostgreSQL
- ✅ `prisma/migrations/0_init/migration.sql` - создана миграция
- ✅ `package.json` - обновлены scripts и dependencies
- ✅ `.env.local` - создан
- ✅ `vercel.json` - создан
- ✅ `VERCEL_POSTGRES_SETUP.md` - создана подробная инструкция
- ✅ `scripts/setup-vercel-db.sh` - создан
- ✅ `scripts/setup-vercel-db.ps1` - создан

## 🔗 Полезные ссылки:

- Vercel Postgres Docs: https://vercel.com/docs/storage/vercel-postgres
- Prisma Docs: https://www.prisma.io/docs/
- Vercel Dashboard: https://vercel.com/dashboard

## ⚡ Быстрая команда для локального тестирования:

```powershell
# Windows PowerShell
npm install
# Добавь свои CONNECTION STRINGS в .env.local перед этим!
npm run db:push
npm run db:seed
npm run dev
```

---

**Всё готово! Просто добавь Connection Strings в Vercel и задеплой. 🚀**
