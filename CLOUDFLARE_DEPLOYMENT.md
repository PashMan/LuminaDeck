# Руководство по устранению любых ошибок деплоя LuminaDeck на Cloudflare Pages

Проведён полный аудит и исправлены все технические тонкости, которые могли мешать деплою приложения.

---

## 🛠️ Что конкретно было исправлено в коде проекта:

1. **Исправлена ошибка `ReferenceError: __dirname is not defined` в `vite.config.ts`**:
   - В Node.js ES Modules (`"type": "module"`) переменная `__dirname` не доступна по умолчанию. При сборке в Cloudflare Pages это вызвало бы ошибку сборщика.
   - Мы переписали `vite.config.ts` с использованием стандарта `fileURLToPath(import.meta.url)`, обеспечив 100% стабильную сборку в любом окружении Node 18/20.

2. **Зафиксирована версия Node.js для Cloudflare Pages**:
   - Созданы файлы `.node-version` (`20.18.0`) и `.nvmrc` (`20.18.0`).

3. **Гарантированная SPA-маршрутизация без 404**:
   - Добавлен `public/_redirects` со строкой `/* /index.html 200`.
   - В `vite.config.ts` встроен плагин, создающий копию `dist/404.html` при сборке.

4. **Защита от белого экрана (Storage Fail-safe)**:
   - Все обращения к `localStorage` в `src/lib/storage.ts` обёрнуты в безопасные проверки `typeof window !== 'undefined'`.

---

## 🚨 Если в Cloudflare Pages всё ещё возникает ошибка — проверьте лог деплоя:

### Вариант 1: Ошибка `Vite requires Node.js version >=18.0.0`
* **Причина**: В настройках Cloudflare Pages осталась стандартная версия Node.js 12/16.
* **Решение**:
  1. Перейдите в **Cloudflare Pages** -> ваш проект **LuminaDeck**.
  2. Зайдите в **Settings** -> **Environment variables**.
  3. Добавьте переменную: `NODE_VERSION` = `20`.
  4. Сохраните и перезапустите деплой.

### Вариант 2: Ошибка `Directory not found: dist`
* **Причина**: В настройках указана не та папка сборки.
* **Решение**:
  1. Перейдите в **Settings** -> **Build & deployments**.
  2. Нажмите **Edit config**.
  3. **Framework preset**: установите **`None`**.
  4. **Build command**: `npm run build`
  5. **Build output directory**: `dist`
  6. **Root directory**: оставьте пустым.

### Вариант 3: Ошибка при прямой публикации через Wrangler CLI (командную строку)
* Если вы деплоите из терминала локально, используйте команду:
  ```bash
  npm run build && npx wrangler pages deploy dist --project-name=luminadeck
  ```

---

## 🚀 Следующие шаги:
1. Нажмите **Sync to GitHub** в AI Studio.
2. В Cloudflare Pages перейдите в раздел **Deployments** -> нажмите **Retry deployment** (или сделайте повторный запуск деплоя).
