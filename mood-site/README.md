# Belbin jamoa rollari testi

## Ishga tushirish (kompyuteringizda)
1. Node.js 18+ o'rnating.
2. https://console.anthropic.com saytidan API kalit oling.
3. Papkada:
   npm install
   export ANTHROPIC_API_KEY=sk-ant-...      (Windows PowerShell: $env:ANTHROPIC_API_KEY="sk-ant-...")
   npm start
4. Brauzerda http://localhost:3000 oching.

## Internetga joylash (hamma ko'ra olishi uchun)
Render.com, Railway yoki Fly.io kabi Node hosting'ga yuklang:
- Build: npm install    Start: npm start
- Environment variables: ANTHROPIC_API_KEY (majburiy), MODEL (ixtiyoriy)
API kalitni HECH QACHON public/index.html ichiga yozmang — u faqat serverda turadi.
