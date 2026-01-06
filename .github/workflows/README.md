# Deploy para Azure Web App

## Passo a Passo Simplificado

### 1. Criar o Web App no Azure
1. Acesse o [Portal Azure](https://portal.azure.com)
2. Crie um novo **Web App** (App Service)
3. Configure conforme necessário (Node 20 LTS, Linux)

### 2. Configurar Deploy Automático
1. No Web App criado, vá em **Centro de Implantação** (Deployment Center)
2. Em "Origem", selecione **GitHub**
3. Autorize sua conta GitHub
4. Selecione o **repositório** e a **branch** `main`
5. Clique em **Salvar**

### 3. Ajuste Obrigatório (IMPORTANTE!)
Após o Azure criar o workflow automaticamente, você precisa fazer **UMA única alteração**:

1. Vá no seu repositório GitHub
2. Acesse `.github/workflows/` e abra o arquivo `.yml` criado
3. Encontre a seção de upload de artefato (procure por `actions/upload-artifact`)
4. Mude a linha `path: .` para `path: dist`

**Antes:**
```yaml
- name: Upload artifact for deployment job
  uses: actions/upload-artifact@v4
  with:
    name: node-app
    path: .
```

**Depois:**
```yaml
- name: Upload artifact for deployment job
  uses: actions/upload-artifact@v4
  with:
    name: node-app
    path: dist
```

### 4. Configurar Startup Command
No Azure Web App, vá em **Configuração** > **Configurações gerais** > **Comando de inicialização**:

```
pm2 serve /home/site/wwwroot --no-daemon --spa
```

### 5. Pronto!
Faça um commit e o deploy será automático!

---

## Por que esse ajuste é necessário?

O Azure Deployment Center não sabe que esta é uma aplicação **Vite/React** que gera os arquivos de produção na pasta `dist`. Por padrão, ele tenta fazer upload de todo o projeto, mas precisamos apenas da pasta `dist` que contém o build final.
