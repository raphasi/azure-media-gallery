# 📚 Guia de Deploy - Azure Gallery

## Galeria de Mídias com Azure Blob Storage e Azure App Services

Este guia irá orientá-lo no processo completo de deploy da aplicação Azure Gallery, desde a configuração do Azure Storage até a publicação no Azure App Services.

---

## 📋 Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Arquitetura da Aplicação](#2-arquitetura-da-aplicação)
3. [Configurar Azure Storage Account](#3-configurar-azure-storage-account)
4. [Configurar CORS no Storage Account](#4-configurar-cors-no-storage-account)
5. [Gerar SAS Token](#5-gerar-sas-token)
6. [Criar Azure Web App](#6-criar-azure-web-app)
7. [Deploy via Deployment Center (Recomendado)](#7-deploy-via-deployment-center-recomendado-)
8. [Deploy Automático](#8-deploy-automático)
9. [Configurar a Aplicação](#9-configurar-a-aplicação)
10. [Testar a Aplicação](#10-testar-a-aplicação)
11. [Troubleshooting](#11-troubleshooting)
12. [Métodos Alternativos de Deploy](#12-métodos-alternativos-de-deploy)

---

## 1. Pré-requisitos

Antes de começar, certifique-se de ter:

- ✅ **Conta Azure** ativa (pode ser a conta de estudante)
- ✅ **Conta GitHub** com o repositório do projeto
- ✅ Conhecimento básico do Portal Azure

> 💡 **Nota**: Não é necessário instalar Node.js, Git ou VS Code localmente! O deploy será feito diretamente pelo Azure.

---

## 2. Arquitetura da Aplicação

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUÁRIO                                   │
│                          │                                       │
│                          ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Azure App Services (Web App)                │    │
│  │                                                          │    │
│  │   ┌──────────────────────────────────────────────────┐  │    │
│  │   │            Aplicação React (SPA)                  │  │    │
│  │   │                                                   │  │    │
│  │   │  • Galeria Pública (/)                           │  │    │
│  │   │  • Login Admin (/login)                          │  │    │
│  │   │  • Painel Admin (/admin)                         │  │    │
│  │   └──────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                          │                                       │
│                          │ SAS Token                             │
│                          ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Azure Blob Storage                          │    │
│  │                                                          │    │
│  │   ┌──────────────────────────────────────────────────┐  │    │
│  │   │            Container de Mídias                    │  │    │
│  │   │                                                   │  │    │
│  │   │  • Imagens (JPG, PNG, GIF, WebP)                 │  │    │
│  │   │  • Vídeos (MP4, WebM, OGG)                       │  │    │
│  │   └──────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Componentes:

| Componente | Descrição |
|------------|-----------|
| **Azure App Services** | Hospeda a aplicação React (frontend) |
| **Azure Blob Storage** | Armazena as imagens e vídeos da galeria |
| **SAS Token** | Autenticação para acesso ao Storage Account |

---

## 3. Configurar Azure Storage Account

### Passo 3.1: Criar Storage Account

1. Acesse o [Portal Azure](https://portal.azure.com)
2. Clique em **"Create a resource"** (+ Criar um recurso)
3. Pesquise por **"Storage account"** e selecione
4. Clique em **"Create"**

### Passo 3.2: Configurar o Storage Account

Preencha os campos:

| Campo | Valor |
|-------|-------|
| **Subscription** | Sua assinatura Azure |
| **Resource group** | Escolher o rg-prd-aue-001 |
| **Storage account name** | Nome único (ex: `stgaleriamidias` - apenas letras minúsculas e números) |
| **Region** | Canada Central |
| **Performance** | Standard |
| **Redundancy** | LRS (Locally-redundant storage) |

5. Clique em **"Review + create"**
6. Clique em **"Create"**
7. Aguarde a criação (cerca de 1-2 minutos)

### Passo 3.3: Criar Container

1. Acesse o Storage Account recém-criado
2. No menu lateral, clique em **"Containers"** (em Data storage)
3. Clique em **"+ Container"**
4. Configure:
   - **Name**: `midias` (ou nome de sua preferência)
   - **Public access level**: `Private (no anonymous access)`
5. Clique em **"Create"**

---

## 4. Configurar CORS no Storage Account

> ⚠️ **IMPORTANTE**: Esta etapa é essencial para que a aplicação web consiga acessar o Storage Account.

### Passo 4.1: Acessar configurações de CORS

1. No Storage Account, vá para **"Resource sharing (CORS)"** no menu lateral
2. Selecione a aba **"Blob service"**

### Passo 4.2: Adicionar regra CORS

Clique em **"+ Add"** e preencha:

| Campo | Valor |
|-------|-------|
| **Allowed origins** | `*` |
| **Allowed methods** | ✅ GET, ✅ PUT, ✅ DELETE, ✅ OPTIONS, ✅ HEAD |
| **Allowed headers** | `*` |
| **Exposed headers** | `*` |
| **Max age** | `3600` |

3. Clique em **"Save"**

### Explicação dos campos:

- **Allowed origins**: Domínios permitidos (`*` = todos, para produção use o domínio específico)
- **Allowed methods**: Operações HTTP permitidas
- **Allowed headers**: Headers HTTP aceitos
- **Exposed headers**: Headers retornados ao cliente
- **Max age**: Tempo em segundos que o navegador pode cachear a resposta preflight

---

## 5. Gerar SAS Token

O SAS (Shared Access Signature) Token permite acesso seguro e temporário ao Storage Account.

### Passo 5.1: Acessar Shared Access Signature

1. No Storage Account, clique em **"Shared access signature"** no menu lateral

### Passo 5.2: Configurar permissões

Marque as seguintes opções:

**Allowed services:**
- ✅ Blob

**Allowed resource types:**
- ✅ Container
- ✅ Object

**Allowed permissions:**
- ✅ Read
- ✅ Add
- ✅ Create
- ✅ Write
- ✅ Delete
- ✅ List

**Blob versioning permissions:**
- (deixe desmarcado)

**Start and expiry date/time:**
- **Start**: Data/hora atual
- **Expiry**: Data futura (ex: 1 ano para desenvolvimento, menos para produção)

**Allowed protocols:**
- ✅ HTTPS only

### Passo 5.3: Gerar o SAS Token

1. Clique em **"Generate SAS and connection string"**
2. **COPIE E SALVE** os seguintes valores:
   - **Blob service SAS URL** (usaremos apenas o SAS token)
   - **SAS token** (começa com `sv=`)

> ⚠️ **ATENÇÃO**: O SAS Token só é exibido uma vez. Salve-o em local seguro!

### Exemplo de SAS Token:
```
sp=racwdl&st=2024-01-05T14:38:32Z&se=2024-12-31T22:53:32Z&spr=https&sv=2024-11-04&sr=c&sig=xxxxxxxxxxxxxx
```

---

## 6. Criar Azure Web App

### Passo 6.1: Criar o Web App

1. No Portal Azure, clique em **"Create a resource"**
2. Pesquise por **"Web App"** e selecione
3. Clique em **"Create"**

### Passo 6.2: Configurar o Web App

**Aba Basics:**

| Campo | Valor |
|-------|-------|
| **Subscription** | Sua assinatura |
| **Resource group** | Mesmo do Storage Account (rg-prd-aue-001) |
| **Name** | Nome único (ex: `app-galeria-midias-001`) - será a URL |
| **Publish** | Code |
| **Runtime stack** | Node 20 LTS, 22 LTS ou 24 LTS (qualquer uma funciona) |
| **Operating System** | Linux |
| **Region** | Austria East  (mesma do Storage) |

**Aba Pricing plans:**
- Selecione **Basic B1** para desenvolvimento/testes

4. Clique em **"Review + create"**
5. Clique em **"Create"**
6. Aguarde a criação

### Passo 6.3: Anotar a URL

Após a criação, anote a URL do seu Web App:
```
https://app-galeria-midias-001.azurewebsites.net
```

---

## 7. Deploy via GitHub Actions (Recomendado) ⭐

> 🚀 **Esta é a forma mais simples!** O repositório já vem com o workflow configurado. Você só precisa criar **2 secrets** no GitHub!

---

### ✅ Passo 7.1: Baixar o Publish Profile no Azure

1. Acesse o [Portal Azure](https://portal.azure.com)
2. Vá até o seu **Web App** criado na seção anterior
3. Na página **Visão Geral** (Overview), localize o botão **"Baixar perfil de publicação"** (Download publish profile)
4. Clique no botão - um arquivo `.PublishSettings` será baixado para seu computador
5. **NÃO feche este arquivo** - você vai precisar dele no próximo passo

> 💡 **Dica**: O arquivo baixado contém credenciais de acesso ao seu Web App. Não compartilhe este arquivo publicamente!

---

### ✅ Passo 7.2: Criar os Secrets no GitHub

Você precisa criar **2 secrets** no GitHub:

1. Acesse seu repositório no **GitHub**
2. Clique na aba **Settings** (Configurações)

   ```
   📁 Seu Repositório
   ├── Code | Issues | Pull requests | Actions | Projects | Wiki | Security | Insights | ⚙️ Settings
   ```

3. No menu lateral esquerdo, clique em **Secrets and variables** → **Actions**

#### 🔑 Secret 1: AZURE_WEBAPP_PUBLISH_PROFILE

4. Clique no botão verde **"New repository secret"**

5. Preencha os campos:

   | Campo | Valor |
   |-------|-------|
   | **Name** | `AZURE_WEBAPP_PUBLISH_PROFILE` |
   | **Secret** | Cole **TODO o conteúdo** do arquivo `.PublishSettings` baixado |

   > 📋 **Como copiar o conteúdo**: Abra o arquivo `.PublishSettings` com o **Bloco de Notas** (Notepad), selecione tudo (Ctrl+A), copie (Ctrl+C) e cole no campo Secret.

6. Clique em **"Add secret"**

#### 🔑 Secret 2: AZURE_WEBAPP_NAME

7. Clique novamente em **"New repository secret"**

8. Preencha os campos:

   | Campo | Valor |
   |-------|-------|
   | **Name** | `AZURE_WEBAPP_NAME` |
   | **Secret** | O nome exato do seu Web App (ex: `app-galeria-joao-001`) |

   > ⚠️ **IMPORTANTE**: Use o nome exato do Web App (aquele que aparece na URL, **sem** `.azurewebsites.net`)

9. Clique em **"Add secret"**

10. ✅ Você verá os 2 secrets criados na lista:
    ```
    AZURE_WEBAPP_NAME               Updated just now
    AZURE_WEBAPP_PUBLISH_PROFILE    Updated just now
    ```

---

### ✅ Passo 7.3: Executar o Deploy

Agora você precisa disparar o workflow:

1. No GitHub, clique na aba **"Actions"**
2. No menu lateral, clique em **"Deploy to Azure Web App"**
3. Clique no botão **"Run workflow"** (à direita)
4. Clique no botão verde **"Run workflow"**
5. Aguarde o workflow executar (🟡 → ✅)

   ```
   ✅ build-and-deploy    Success in 2m 34s
   ```

> 💡 **Dica**: Após a primeira execução, o deploy será **automático** a cada push na branch `main`!

> ❌ **Se falhar**: Verifique se os 2 secrets foram criados com os nomes corretos.

---

### ✅ Passo 7.4: Configurar Startup Command (Última etapa!)

Esta configuração é **obrigatória** para que as rotas da aplicação funcionem:

1. No **Portal Azure**, acesse seu Web App
2. No menu lateral, clique em **"Configuração"** (Configuration)
3. Clique na aba **"Configurações gerais"** (General settings)
4. Localize o campo **"Comando de inicialização"** (Startup Command)
5. Cole o seguinte comando:

   ```
   pm2 serve /home/site/wwwroot --no-daemon --spa
   ```

6. Clique em **"Salvar"** (Save) no topo da página
7. Clique em **"Continuar"** (Continue) na janela de confirmação
8. Aguarde o reinício do app (cerca de 1 minuto)

---

### 🎉 Pronto! Seu deploy está configurado!

Agora, toda vez que você fizer um **push** para a branch `main`, o deploy será **automático**!

**Acesse sua aplicação:**
```
https://SEU-WEB-APP.azurewebsites.net
```

---

### 📋 Resumo - Apenas 2 Secrets!

| Secret | Valor |
|--------|-------|
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Conteúdo do arquivo `.PublishSettings` |
| `AZURE_WEBAPP_NAME` | Nome do Web App (ex: `app-galeria-joao-001`) |

> ⚠️ **Importante**: O startup command (Passo 7.4) garante que todas as rotas da aplicação (como `/login` e `/admin`) funcionem corretamente.

---

## 8. Deploy Automático

Após a configuração inicial:

1. **Faça qualquer alteração** no código
2. **Commit e push** para o GitHub:
   ```bash
   git add .
   git commit -m "Minha alteração"
   git push
   ```
3. O Azure **detecta automaticamente** o push
4. O **build e deploy** são executados
5. Em ~2-5 minutos, as alterações estão no ar!

### Verificar status do deploy

- **No Azure**: Web App → Deployment Center → Logs
- **No GitHub**: Aba Actions → Workflow mais recente

---

## 9. Configurar a Aplicação

### Passo 9.1: Acessar a aplicação

Abra o navegador e acesse:
```
https://SEU-APP.azurewebsites.net
```

### Passo 9.2: Fazer login como administrador

1. Clique em **"Login"** no canto superior direito
2. Use as credenciais padrão:
   - **Usuário**: `admin`
   - **Senha**: `admin123`

> ⚠️ **IMPORTANTE**: Em produção, altere as credenciais no código antes do deploy!

### Passo 9.3: Configurar Azure Storage

1. Após o login, vá para a aba **"Configuração"**
2. Preencha os campos:
   - **URL do Container**: `https://SEU-STORAGE.blob.core.windows.net/midias`
   - **SAS Token**: Cole o token gerado anteriormente (sem o `?` inicial)
3. Clique em **"Salvar Configuração"**

### Passo 9.4: Testar upload

1. Vá para a aba **"Upload"**
2. Arraste uma imagem ou clique para selecionar
3. Verifique se o upload foi concluído com sucesso
4. Vá para a aba **"Mídias"** para ver o arquivo

---

## 10. Testar a Aplicação

### Checklist de testes:

- [ ] **Galeria Pública**: Acesse a página inicial e verifique se as mídias aparecem
- [ ] **Lightbox**: Clique em uma mídia para abrir a visualização ampliada
- [ ] **Navegação**: Use as setas para navegar entre as mídias
- [ ] **Login**: Faça login como administrador
- [ ] **Upload**: Faça upload de uma imagem ou vídeo
- [ ] **Listagem**: Verifique se a mídia aparece na galeria
- [ ] **Download**: Baixe uma mídia pelo lightbox
- [ ] **Exclusão**: Delete uma mídia (teste com cuidado!)
- [ ] **Logout**: Faça logout e verifique que o painel admin não está acessível

---

## 11. Troubleshooting

### Erro: "Failed to fetch" ou "Erro de rede"

**Causa**: CORS não configurado corretamente no Storage Account.

**Solução**:
1. Verifique se o CORS está configurado (Seção 4)
2. Certifique-se que todos os métodos HTTP estão marcados
3. Aguarde alguns minutos após salvar (pode haver cache)

### Erro: "403 Forbidden"

**Causa**: SAS Token sem permissões suficientes ou expirado.

**Solução**:
1. Gere um novo SAS Token com todas as permissões necessárias
2. Verifique a data de expiração do token
3. Atualize o token na configuração da aplicação

### Erro: "404 Not Found" ao acessar rotas

**Causa**: Web App não configurado para SPA (Single Page Application).

**Solução**:
Crie um arquivo `staticwebapp.config.json` na pasta `dist/`:
```json
{
  "navigationFallback": {
    "rewrite": "/index.html"
  }
}
```

Ou configure o startup command conforme Seção 7, Passo 7.8.

### Erro: Build falhou no GitHub Actions

**Causa**: Dependências ou configuração incorretas.

**Solução**:
1. Vá no GitHub → aba **Actions** → clique no workflow que falhou
2. Verifique os logs de erro
3. Certifique-se que `package.json` e `package-lock.json` estão no repositório
4. Verifique se o comando `npm run build` funciona localmente

### Aplicação não carrega após deploy

**Possíveis causas e soluções**:
1. Verifique os logs: Azure Portal → Web App → Log stream
2. Certifique-se que o Node.js está na versão correta
3. Verifique se o build foi feito corretamente

### Imagens/vídeos não aparecem

**Causa**: URL do container ou SAS Token incorretos.

**Solução**:
1. Verifique a URL do container (deve terminar com o nome do container)
2. Verifique se o SAS Token está completo
3. Teste acessando diretamente a URL do blob no navegador

---

## 12. Métodos Alternativos de Deploy

> ℹ️ Estes métodos são opcionais. O método recomendado é o **Deployment Center** (Seção 7).

### Opção A: Deploy via Azure CLI (Local)

Se preferir fazer o build localmente:

#### Pré-requisitos adicionais:
- Node.js 18+ instalado
- Azure CLI instalado

```bash
# 1. Clone o repositório
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
cd SEU_REPOSITORIO

# 2. Instale dependências e faça o build
npm install
npm run build

# 3. Login no Azure
az login

# 4. Configure o startup command
az webapp config set \
  --resource-group rg-galeria-midias \
  --name app-galeria-midias \
  --startup-file "pm2 serve /home/site/wwwroot --no-daemon --spa"

# 5. Zipar e fazer deploy
cd dist
zip -r ../deploy.zip .
cd ..

az webapp deployment source config-zip \
  --resource-group rg-galeria-midias \
  --name app-galeria-midias \
  --src deploy.zip
```

### Opção B: Deploy via VS Code

1. Instale a extensão **Azure App Service** no VS Code
2. Faça login na conta Azure
3. Clique com botão direito no Web App → **Deploy to Web App**
4. Selecione a pasta `dist/` após o build

---

## 📝 Notas Adicionais

### Segurança em Produção

Para um ambiente de produção, considere:

1. **Alterar credenciais do admin** no código antes do deploy
2. **Usar variáveis de ambiente** para o SAS Token
3. **Limitar CORS** para domínios específicos
4. **Usar SAS Tokens com tempo de expiração curto**
5. **Implementar HTTPS** (já é padrão no Azure App Services)

### Custos

| Recurso | Tier | Custo Estimado |
|---------|------|----------------|
| Storage Account | Standard LRS | ~$0.02/GB/mês |
| Web App | Free F1 | Gratuito |
| Web App | Basic B1 | ~$13/mês |

### Recursos Úteis

- [Documentação Azure Blob Storage](https://docs.microsoft.com/azure/storage/blobs/)
- [Documentação Azure App Services](https://docs.microsoft.com/azure/app-service/)
- [GitHub Actions para Azure](https://docs.microsoft.com/azure/app-service/deploy-github-actions)
- [SAS Tokens](https://docs.microsoft.com/azure/storage/common/storage-sas-overview)
- [CORS no Azure Storage](https://docs.microsoft.com/azure/storage/blobs/quickstart-storage-blobs-javascript-browser)

---

## ✅ Conclusão

Parabéns! Você concluiu o deploy da aplicação Azure Gallery. Agora você tem:

- ✅ Uma aplicação web hospedada no Azure App Services
- ✅ Deploy automático via GitHub (push = deploy)
- ✅ Armazenamento de mídias no Azure Blob Storage
- ✅ Sistema de autenticação para administração
- ✅ Interface moderna para gerenciar sua galeria de mídias

---

**Desenvolvido para a disciplina de Administração de Ambientes Azure**

*Última atualização: Janeiro 2026*
