# Инструкция по деплою на Cloudflare Pages & Workers

Проект полностью оптимизирован и подготовлен для успешного деплоя на платформу **Cloudflare Pages** с бессерверными Edge-функциями **Cloudflare Workers Functions** (`/functions/api`).

---

## 🛠 Важно: исправление ошибки сборки ("Could not resolve @google/genai")

Функции в папке `/functions/api` переведены на **нативный fetch к Gemini REST API** без внешних npm-зависимостей (`0 dependencies`):
1. Больше нет ошибок сборки Wrangler / esbuild при компиляции Edge Workers.
2. Бессерверные функции работают с минимальным оверхедом и молниеносным холодным стартом.

---

## 📁 Структура Cloudflare файлов в репозитории

1. `functions/api/` — нативные Edge Functions:
   - `health.ts` (`/api/health`) — Проверка статуса API и ключей
   - `generate-cards.ts` (`/api/generate-cards`) — Генерация Anki-карточек через Gemini AI
   - `evaluate-answer.ts` (`/api/evaluate-answer`) — ИИ-оценка семантики ответов
   - `explain-card.ts` (`/api/explain-card`) — Персональный ИИ-репетитор (ELI5 + мнемоника)
2. `wrangler.toml` — Чистый конфигурационный файл Cloudflare Pages (`pages_build_output_dir = "dist"`)
3. `public/_routes.json` — Настройка проксирования маршрутов `/api/*`
4. `package.json` — Готовые скрипты:
   - `npm run build:cf` — Сборка фронтенда Vite в дистрибутив `dist`
   - `npm run deploy:cf` — Деплой в Cloudflare через Wrangler
   - `npm run preview:cf` — Локальное тестирование эмулятора Cloudflare Pages

---

## ⚙️ Настройки в Cloudflare Dashboard (для подключения через GitHub)

Если вы деплоите проект через интеграцию с GitHub:

1. В разделе **Build settings** установите:
   - **Framework preset**: `Vite` (или `None`)
   - **Build command**: `npm run build:cf`
   - **Build output directory**: `dist`
2. В разделе **Settings** -> **Environment variables** (Production / Preview):
   - Добавьте переменную `GEMINI_API_KEY` со значением вашего API ключа Google Gemini.
3. Перезапустите деплой (Retry deployment) — все функции и фронтенд соберутся автоматически!

---

## 🚀 Деплой через консоль (Wrangler CLI)

1. Авторизация:
   ```bash
   npx wrangler login
   ```

2. Автоматическая сборка и публикация:
   ```bash
   npm run deploy:cf
   ```

3. Установка секретного ключа Gemini:
   ```bash
   npx wrangler pages secret put GEMINI_API_KEY
   ```
