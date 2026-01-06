# 🚀 Deploy para Azure Web App

## Passo a Passo (3 passos simples!)

### 1️⃣ Baixar o Publish Profile no Azure
1. Acesse o [Portal Azure](https://portal.azure.com)
2. Vá no seu **Web App**
3. Na página **Visão Geral**, clique em **Baixar perfil de publicação**
4. Um arquivo `.PublishSettings` será baixado

### 2️⃣ Criar o Secret no GitHub
1. No seu repositório GitHub, vá em **Settings** > **Secrets and variables** > **Actions**
2. Clique em **New repository secret**
3. Nome: `AZURE_WEBAPP_PUBLISH_PROFILE`
4. Valor: Abra o arquivo baixado com um editor de texto e **cole todo o conteúdo**
5. Clique em **Add secret**

### 3️⃣ Editar o Nome do Web App
1. Abra o arquivo `.github/workflows/azure-deploy.yml`
2. Na **linha 12**, troque `COLOQUE-O-NOME-DO-SEU-WEBAPP-AQUI` pelo nome do seu Web App
3. Faça commit da alteração

### ✅ Pronto!
O deploy será automático a cada push na branch `main`!

---

## 🔧 Configuração do Web App (única vez)

No Azure Web App, configure o **Comando de inicialização**:

1. Vá em **Configuração** > **Configurações gerais**
2. Em **Comando de inicialização**, coloque:
```
pm2 serve /home/site/wwwroot --no-daemon --spa
```
3. Clique em **Salvar**

---

## ❓ Dúvidas Comuns

**P: O deploy falhou, o que fazer?**
R: Verifique se o nome do Web App está correto e se o secret foi criado corretamente.

**P: Onde vejo os logs do deploy?**
R: No GitHub, vá em **Actions** e clique no workflow para ver os detalhes.
