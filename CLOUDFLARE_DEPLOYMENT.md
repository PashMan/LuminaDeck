# Инструкция по деплою на Cloudflare Pages & Workers

Проект полностью подготовлен для развертывания на платформе **Cloudflare Pages** с бессерверными функциями **Cloudflare Workers Functions** (`/functions/api`).

---

## 📁 Подготовленные файлы проекта

1. `functions/api/` — функции Cloudflare Workers для бэкенда API:
   - `health.ts` (`/api/health`) — Проверка работоспособности API
   - `generate-cards.ts` (`/api/generate-cards`) — Генерация карточек через Gemini AI
   - `evaluate-answer.ts` (`/api/evaluate-answer`) — ИИ-оценка ответов пользователя
   - `explain-card.ts` (`/api/explain-card`) — Режим ИИ-репетитора (ELI5 + мнемоника)
2. `wrangler.toml` — Конфигурация Wrangler CLI для Cloudflare
3. `public/_routes.json` — Настройка маршрутизации статичных файлов и API функций
4. `package.json` — Добавлены скрипты:
   - `npm run build:cf` — Сборка фронтенда для Cloudflare Pages
   - `npm run deploy:cf` — Автоматический деплой с помощью Wrangler
   - `npm run preview:cf` — Локальное тестирование в эмуляторе Cloudflare Pages

---

## 🚀 Вариант 1: Деплой через CLI (Wrangler)

1. Авторизуйтесь в Cloudflare через CLI:
   ```bash
   npx wrangler login
   ```

2. Соберите и задеплойте проект:
   ```bash
   npm run deploy:cf
   ```

3. Установите секретный ключ `GEMINI_API_KEY` для ваших Cloudflare Functions:
   ```bash
   npx wrangler pages secret put GEMINI_API_KEY
   ```
   *(Введите ваш API ключ Google Gemini при запросе)*

---

## 🌐 Вариант 2: Подключение через GitHub в панели Cloudflare Dashboard

1. Зайдите в [Cloudflare Dashboard](https://dash.cloudflare.com/) -> **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
2. Выберите ваш репозиторий GitHub.
3. Укажите настройки сборки:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build:cf`
   - **Build output directory**: `dist`
4. Перейдите в **Settings** -> **Environment Variables** -> **Production & Preview** и добавьте переменную:
   - **Variable name**: `GEMINI_API_KEY`
   - **Value**: `ваш_ключ_gemini`
5. Нажмите **Save and Deploy**.

---

## ⚡ Проверка работы

После деплоя ваше приложение будет доступно по адресу `https://<ваше-имя>.pages.dev`:
- Фронтенд работает как молниеносная SPA на глобальном CDN Cloudflare.
- API запросы на `/api/*` обрабатываются бессерверными функциями Cloudflare Workers Edge Network в ближайшем к пользователю дата-центре.
