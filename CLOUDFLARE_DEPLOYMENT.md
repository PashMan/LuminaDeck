# Настройка Cloudflare Pages для LuminaDeck

## ⚙️ Настройки в панели Cloudflare Pages (Build Settings)

В выпадающем списке пресетов Cloudflare Pages опции "Vite" действительно нет. Установите следующие значения:

1. **Framework preset**: Выберите **`None`** (или `Create React App`).
2. **Build command**: `npm run build`
3. **Build output directory**: `dist`
4. **Root directory**: оставьте пустым.

> 💡 **Почему это работает:** В корне проекта уже есть конфигурация `wrangler.toml` (`pages_build_output_dir = "dist"`), поэтому Cloudflare автоматически видит папку `dist` и выполняет команду `npm run build`.

---

## 🚀 Проверка работоспособности:

1. Нажмите **Sync to GitHub** в AI Studio.
2. В логах Cloudflare отобразится успешный запуск:
   - `pages_build_output_dir: dist`
   - `Executing user command: npm run build`
   - `Successfully copied dist/index.html to dist/404.html`
   - `Success: Your site was deployed!`
3. Чтобы сразу увидеть обновлённый сайт без старого кэша браузера/CDN, откройте его в режиме **Инкогнито** (`Ctrl + Shift + N` или `Cmd + Shift + N`) или нажмите `Ctrl + F5` (`Cmd + Shift + R`).
