# Инструкция по деплою LuminaDeck на Cloudflare Pages

Проект полностью переведен в режим **Client-Side Single Page Application (SPA)**.
Все функции создания карточек, генерации и оценки ответов работают прямо в браузере без серверов, поэтому сайт летает и не требует настройки API-ключей на стороне Cloudflare!

---

## 🛠️ Что нужно сделать, чтобы сайт заработал:

### 1️⃣ Запушьте свежий код в GitHub
Cloudflare Pages запускает сборку только после нового коммита в ветку `main`.
Если вы внесли изменения здесь, отправьте их на GitHub:
```bash
git add .
git commit -m "Fix SPA deployment for Cloudflare Pages"
git push origin main
```

---

### 2️⃣ Проверьте логи сборки в Cloudflare
1. Откройте **Cloudflare Dashboard** → **Workers & Pages** → **luminadeck**.
2. Перейдите во вкладку **Deployments** (Деплои).
3. Посмотрите на статус последнего деплоя:
   - Если горит красная ошибка — нажмите **Retry deployment** (Повторить деплой) или откройте логи, чтобы увидеть, на каком шаге произошла задержка.
   - После пуша свежего кода запустится новый деплой **Building...** → **Success**.

---

### 3️⃣ Проверьте настройки сборки (Build settings)
У вас на скриншоте всё указано верно:
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: *(оставьте пустым)*

---

### 4️⃣ Укажите версию Node.js (Рекомендуется)
Для корректной сборки React 19 и Vite 6 рекомендуется задать версию Node:
1. В Cloudflare откройте **Settings** → **Variables and secrets**.
2. Нажмите **Add** (Добавить):
   - **Variable name**: `NODE_VERSION`
   - **Value**: `20`
3. Нажмите **Save**.

---

### 5️⃣ Очистите кэш браузера
После успешного деплоя откройте сайт [luminadeck.pages.dev](https://luminadeck.pages.dev) в режиме инкогнито (`Ctrl + Shift + N` или в браузере телефона), чтобы браузер загрузил новую версию сайта без старого кэша.
