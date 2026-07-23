# Исправление ошибки загрузки стилей и скриптов в Cloudflare Pages

## 🔍 Причина ошибки
Ошибка `Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "text/html"` возникала по двум причинам:
1. **Необработанный `public/404.html`**: Статический файл `public/404.html` содержал исходный путь `<script src="/src/main.tsx">`, которого не существует после сборки в папке `dist/`. Когда Cloudflare Pages отдавал `404.html` при перезагрузке страниц или маршрутизации, браузер пытался загрузить `/src/main.tsx`, получал от сервера HTML-страницу ошибки 404 вместо JS-кода и выдавал ошибку MIME-типа.
2. **Кэширование `index.html`**: Без заголовков управления кэшем браузер или CDN Cloudflare запрашивали устаревший файл стилей/скриптов от предыдущей сборки.

---

## 🛠️ Что было исправлено:
1. **Авто-генерация `dist/404.html` из скомпилированного `dist/index.html`**:
   - Удален сырой `public/404.html`.
   - В `vite.config.ts` добавлен плагин `cloudflareSpaPlugin`, который после каждой сборки копирует итоговый скомпилированный `dist/index.html` (со всеми верными хэшами JS/CSS бандлов) в `dist/404.html`.
2. **Настроены правильные заголовки кэширования (`public/_headers`)**:
   - Для `/index.html` и `/404.html` установлен `Cache-Control: no-cache, no-store, must-revalidate`, чтобы браузер ВСЕГДА загружал актуальную версию приложения.
   - Для `/assets/*` установлено долговременное кэширование.
3. **Обновлена версия Node.js (`.nvmrc`)**:
   - Зафиксирована версия Node.js 22.16.0 для Cloudflare Pages.

---

## 🚀 Инструкция для обновления:

### 1️⃣ Запушьте свежие изменения в GitHub:
```bash
git add .
git commit -m "Fix Cloudflare Pages SPA 404 routing with compiled index.html and cache headers"
git push origin main
```

### 2️⃣ Проверьте деплой в Cloudflare:
Зайдите в **Cloudflare Dashboard** → **Workers & Pages** → **luminadeck** → **Deployments**.
Дождитесь завершения сборки. В логах сборки появится строка:
`Successfully copied dist/index.html to dist/404.html for Cloudflare Pages SPA fallback.`

### 3️⃣ Откройте сайт:
Зайдите на **https://luminadeck.pages.dev** (желательно в режиме инкогнито `Ctrl + Shift + N` или через жесткую перезагрузку `Ctrl + F5`).
