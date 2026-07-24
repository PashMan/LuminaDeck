# Полная инструкция и исправление деплоя на Cloudflare Pages (LuminaDeck)

В проекте выполнены **все необходимые комплексные технические настройки** для полной совместимости с Cloudflare Pages.

---

## 🔑 Главная причина, почему деплой может выдавать ошибку в Cloudflare:

По умолчанию Cloudflare Pages использует устаревшую версию Node.js (12 или 16), в то время как **Vite 6** требует **Node.js 18+ или 20+**. Если версия не указана в настройках Cloudflare, сборка падает с ошибкой `Vite requires Node.js version >=18.0.0`.

### 1️⃣ Шаг 1. Установите переменную `NODE_VERSION` в Cloudflare Pages:
1. Зайдите в ваш аккаунт **Cloudflare** -> **Workers & Pages**.
2. Выберите ваш проект **LuminaDeck**.
3. Перейдите в **Settings** -> **Environment variables**.
4. Нажмите **Add variable** (или Edit variables) и добавьте:
   - **Variable name**: `NODE_VERSION`
   - **Value**: `20`
5. Сохраните изменения (**Save**).

---

## ⚙️ 2️⃣ Шаг 2. Проверьте параметры сборки (Build Settings):
В разделе **Settings** -> **Build & deployments** -> **Build config**:
- **Framework preset**: `None` *(не выбирайте Create React App/Next.js, иначе запутаются директории)*
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: *(оставьте пустым)*

---

## 🛠️ 3️⃣ Что уже добавлено и настроено в репозитории:

1. **Конфигурация версий**:
   - Файлы `.node-version` (установлено `20.18.0`) и `.nvmrc` (установлено `20.18.0`) — задают правильную среду выполнения.
2. **SPA-маршрутизация**:
   - `public/_redirects`: Правило `/* /index.html 200` для обработки страниц в режиме SPA.
   - `vite.config.ts`: Автоматически копирует `dist/index.html` в `dist/404.html`.
3. **Безопасное хранилище (Storage Fail-safe)**:
   - В `src/lib/storage.ts` добавлены проверки на доступность `localStorage` и `window`, чтобы сайт не выдавал белый экран при блокировке cookie/storage.

---

## 🚀 4️⃣ Как запустить новый деплой:

1. Нажмите **Sync to GitHub** в AI Studio, чтобы отправленный комит попал в GitHub.
2. В панели Cloudflare Pages зайдите в **Deployments** -> нажмите **Retry deployment** (или сделайте новый комит в GitHub).
3. После завершения деплоя откройте сайт в режиме **Инкогнито** (`Ctrl + Shift + N` / `Cmd + Shift + N`) или сбросьте кэш (`Ctrl + F5` / `Cmd + Shift + R`).
