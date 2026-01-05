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
7. [Build da Aplicação](#7-build-da-aplicação)
8. [Deploy no Azure App Services](#8-deploy-no-azure-app-services)
9. [Configurar a Aplicação](#9-configurar-a-aplicação)
10. [Testar a Aplicação](#10-testar-a-aplicação)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Pré-requisitos

Antes de começar, certifique-se de ter:

- ✅ **Conta Azure** ativa (pode ser a conta de estudante)
- ✅ **Node.js** versão 18 ou superior instalado
- ✅ **Git** instalado no seu computador
- ✅ **Visual Studio Code** ou outro editor de código
- ✅ Conhecimento básico de terminal/linha de comando

### Verificar instalações

```bash
# Verificar Node.js
node --version
# Deve retornar v18.x.x ou superior

# Verificar npm
npm --version

# Verificar Git
git --version
```

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
| **Resource group** | Crie um novo ou use existente (ex: `rg-galeria-midias`) |
| **Storage account name** | Nome único (ex: `stgaleriamidias` - apenas letras minúsculas e números) |
| **Region** | Brazil South (ou região mais próxima) |
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
| **Resource group** | Mesmo do Storage Account (ex: `rg-galeria-midias`) |
| **Name** | Nome único (ex: `app-galeria-midias`) - será a URL |
| **Publish** | Code |
| **Runtime stack** | Node 18 LTS |
| **Operating System** | Linux |
| **Region** | Brazil South (mesma do Storage) |

**Aba Pricing plans:**
- Selecione **Free F1** para desenvolvimento/testes

4. Clique em **"Review + create"**
5. Clique em **"Create"**
6. Aguarde a criação

### Passo 6.3: Anotar a URL

Após a criação, anote a URL do seu Web App:
```
https://app-galeria-midias.azurewebsites.net
```

---

## 7. Build da Aplicação

### Passo 7.1: Clonar o repositório

```bash
# Clone o repositório do projeto
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git

# Entre na pasta do projeto
cd SEU_REPOSITORIO
```

### Passo 7.2: Instalar dependências

```bash
# Instalar dependências
npm install
```

### Passo 7.3: Gerar build de produção

```bash
# Criar build otimizado
npm run build
```

Isso criará uma pasta `dist/` com os arquivos estáticos da aplicação.

### Passo 7.4: Verificar o build

A estrutura da pasta `dist/` deve ser similar a:
```
dist/
├── index.html
├── assets/
│   ├── index-xxxxx.js
│   └── index-xxxxx.css
└── ...
```

---

## 8. Deploy no Azure App Services

Existem várias formas de fazer o deploy. Vamos cobrir as duas mais comuns:

### Opção A: Deploy via Azure CLI (Recomendado)

#### Passo 8.1: Instalar Azure CLI

- **Windows**: [Download do instalador](https://aka.ms/installazurecliwindows)
- **macOS**: `brew install azure-cli`
- **Linux**: Consulte a [documentação oficial](https://docs.microsoft.com/cli/azure/install-azure-cli-linux)

#### Passo 8.2: Login no Azure

```bash
az login
```

Isso abrirá o navegador para autenticação.

#### Passo 8.3: Configurar startup command

Para que o Azure sirva corretamente a aplicação SPA (Single Page Application), precisamos configurar:

```bash
az webapp config set \
  --resource-group rg-galeria-midias \
  --name app-galeria-midias \
  --startup-file "pm2 serve /home/site/wwwroot/dist --no-daemon --spa"
```

#### Passo 8.4: Deploy dos arquivos

```bash
# Zipar a pasta dist
cd dist
zip -r ../deploy.zip .
cd ..

# Fazer deploy
az webapp deployment source config-zip \
  --resource-group rg-galeria-midias \
  --name app-galeria-midias \
  --src deploy.zip
```

### Opção B: Deploy via VS Code

#### Passo 8.1: Instalar extensão Azure

1. Abra o VS Code
2. Vá em Extensions (Ctrl+Shift+X)
3. Pesquise **"Azure App Service"**
4. Instale a extensão da Microsoft

#### Passo 8.2: Login e Deploy

1. Clique no ícone do Azure na barra lateral
2. Faça login na sua conta Azure
3. Encontre seu Web App na lista
4. Clique com botão direito → **"Deploy to Web App"**
5. Selecione a pasta `dist/`
6. Confirme o deploy

### Opção C: Deploy via GitHub Actions (Avançado)

Crie o arquivo `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure Web App

on:
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      
    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v3
      with:
        app-name: 'app-galeria-midias'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: './dist'
```

Para usar esta opção:
1. No Portal Azure, vá ao Web App → **Deployment Center** → **Manage publish profile**
2. Baixe o arquivo de perfil
3. No GitHub, vá em **Settings** → **Secrets** → **Actions**
4. Crie um secret chamado `AZURE_WEBAPP_PUBLISH_PROFILE` com o conteúdo do arquivo

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

Ou configure o startup command conforme Seção 8.

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
- [SAS Tokens](https://docs.microsoft.com/azure/storage/common/storage-sas-overview)
- [CORS no Azure Storage](https://docs.microsoft.com/azure/storage/blobs/quickstart-storage-blobs-javascript-browser)

---

## ✅ Conclusão

Parabéns! Você concluiu o deploy da aplicação Azure Gallery. Agora você tem:

- ✅ Uma aplicação web hospedada no Azure App Services
- ✅ Armazenamento de mídias no Azure Blob Storage
- ✅ Sistema de autenticação para administração
- ✅ Interface moderna para gerenciar sua galeria de mídias

---

**Desenvolvido para a disciplina de Administração de Ambientes Azure**

*Última atualização: Janeiro 2026*
