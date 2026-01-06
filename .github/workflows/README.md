# Deploy para Azure Web App

## Apenas 2 Secrets no GitHub!

O workflow já está configurado. Você só precisa criar 2 secrets:

### 1️⃣ AZURE_WEBAPP_PUBLISH_PROFILE
- **No Azure**: Web App → Visão Geral → Baixar perfil de publicação
- **No GitHub**: Settings → Secrets → Actions → New secret
- **Valor**: Cole TODO o conteúdo do arquivo `.PublishSettings` baixado

### 2️⃣ AZURE_WEBAPP_NAME
- **No GitHub**: Settings → Secrets → Actions → New secret
- **Valor**: Nome do seu Web App (ex: `app-galeria-joao-001`)

---

## Executar o Deploy

1. No GitHub, vá na aba **Actions**
2. Clique em **"Deploy to Azure Web App"**
3. Clique em **"Run workflow"** → **"Run workflow"**
4. Aguarde ficar verde ✅

---

## Configurar Startup Command

No Azure Web App → Configuração → Configurações gerais → Comando de inicialização:

```
pm2 serve /home/site/wwwroot --no-daemon --spa
```

---

## Pronto! 🎉

O deploy será automático a cada push na branch `main`!
