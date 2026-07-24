# Решение проблемы деплоя в Cloudflare Pages

## 🔍 Разбор ошибки `Infinite loop detected in this rule`

В логах сборки Cloudflare Pages появилось следующее предупреждение:
```
Parsed 0 valid redirect rules.
Found invalid redirect lines:
  - #1: /*  /index.html  200
    Infinite loop detected in this rule and has been ignored.
```

### Почему это произошло?
Правило `/* /index.html 200` в файле `_redirects` совпадает с абсолютно любым URL, включая сам `/index.html`. В Cloudflare Pages это вызовет цикличный перенаправление. Cloudflare заблокировал этот файл, из-за чего клиенты при запросах получали сбои в маршрутизации.

### 🛠️ Что исправлено:
1. **Удален конфликтный файл `/public/_redirects`**.
2. **Используется официальный механизмов Cloudflare Pages для SPA**:
   В `vite.config.ts` подключен `cloudflareSpaPlugin()`, который при сборке создаёт копию `dist/index.html` под именем `dist/404.html`.
   Cloudflare Pages автоматически использует `dist/404.html` как фолбэк для всех роутов SPA без каких-либо `_redirects` и без циклических редиректов!
3. **Название приложения исправлено на `LuminaDeck`** во всех шапках и метаданных (`metadata.json`).
4. **Адаптировано верхнее меню (Navbar)**:
   - Шапка переработана, сделана компактной и адаптивной для мобильных устройств.
   - Вкладки Decks, Analytics и Export логично структурированы и больше не вылезают за границы экрана на любых разрешениях.

---

## 🚀 Как применить правки на GitHub и Cloudflare:

1. Перейдите во вкладку **Integrations -> GitHub** в AI Studio.
2. Нажмите **Sync to GitHub** (Sync changes to `PashMan/LuminaDeck`).
3. Cloudflare Pages автоматически выполнит свежую сборку и опубликует рабочее приложение.
