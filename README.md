# Python Hub

Central pessoal de automações: um dashboard web onde cada sistema Python que você já tem
no GitHub vira um **card**, executável com um clique, com progresso em tempo real, resultados
em tabela dinâmica e exportação para Excel/CSV.

![status](https://img.shields.io/badge/status-mvp%20funcional-blue)

---

## Sumário

- [Arquitetura](#arquitetura)
- [Como os sistemas se comunicam com o backend](#como-os-sistemas-se-comunicam-com-o-backend)
- [Instalação](#instalação)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Executando o backend](#executando-o-backend)
- [Executando o frontend](#executando-o-frontend)
- [Docker](#docker)
- [Como adicionar um novo sistema](#como-adicionar-um-novo-sistema)
- [Como conectar um repositório GitHub real](#como-conectar-um-repositório-github-real)
- [Como adicionar/editar campos da tabela](#como-adicionareditar-campos-da-tabela)
- [Exportação para Excel/CSV](#exportação-para-excelcsv)
- [Ambientes Python isolados por sistema](#ambientes-python-isolados-por-sistema)
- [API — referência rápida](#api--referência-rápida)
- [Deploy](#deploy)
- [Mock vs. execução real](#mock-vs-execução-real)
- [Início rápido (resumo)](#início-rápido-resumo)

---

## Arquitetura

```
plataforma-central/
├─ backend/                  # FastAPI - orquestra execução dos sistemas
│  └─ app/
│     ├─ main.py             # app FastAPI + CORS
│     ├─ systems_registry.py # lê systems/*/config.json dinamicamente
│     ├─ process_runner.py   # spawna o subprocess real, lê stdout/stderr
│     ├─ execution_manager.py# orquestra execução assíncrona + SSE
│     ├─ database.py         # SQLite (histórico de execuções + favoritos)
│     ├─ excel_export.py     # gera .xlsx formatado com pandas/openpyxl
│     └─ routers/            # /api/systems, /api/executions
├─ systems/                  # cada sistema Python é uma pasta independente
│  ├─ _template/              # modelo para criar um novo sistema
│  ├─ job-hunter/             # exemplo funcional (demo)
│  ├─ leilao-imoveis/         # exemplo funcional (demo)
│  ├─ mestrados/              # exemplo funcional (demo)
│  ├─ monitor-investimentos/  # placeholder "em breve"
│  ├─ pesquisa-concursos/     # placeholder "em breve"
│  └─ outros-sistemas/        # placeholder "em breve"
├─ frontend/                  # React + TypeScript + Vite (sem Tailwind)
│  └─ src/
│     ├─ pages/                # Dashboard, SystemDetail, History
│     ├─ components/           # Header, SystemCard, ResultsTable, ExecutionOverlay...
│     ├─ hooks/                # useSystems, useExecution (SSE + polling)
│     └─ api/                  # client HTTP tipado
├─ docker-compose.yml
└─ README.md
```

**Por que essa arquitetura?**

- **Cada sistema é uma pasta isolada** com seu próprio `config.json`, dependências e (opcionalmente)
  seu próprio `.env`. Adicionar um sistema novo = criar uma pasta. Nenhum código do backend/frontend
  precisa mudar.
- **O backend nunca importa código dos seus sistemas.** Ele apenas executa o `command` configurado
  como um processo real (subprocess), captura stdout/stderr, e lê o resultado de um arquivo JSON.
  Isso significa que seus scripts podem ser Python 3.9, 3.11, usar Django, Selenium, o que for —
  o backend não precisa saber.
- **SQLite** guarda apenas o histórico de execuções e favoritos (não guardamos segredos nem
  reinventamos um ORM pesado para um app pessoal).
- **Frontend 100% desacoplado**, fala com o backend só por HTTP/SSE, nunca executa Python.

---

## Como os sistemas se comunicam com o backend

Para o backend real (não mockado) funcionar com qualquer script Python, existe um protocolo simples
baseado em stdout + um arquivo de saída:

1. O script imprime linhas de progresso no formato:
   ```
   PROGRESS {"progress": 45, "message": "Processando resultados..."}
   ```
   O backend interpreta essas linhas em tempo real e as envia para o frontend via
   Server-Sent Events (SSE).

2. Ao final, o script escreve a lista de resultados (um array JSON de objetos "achatados") no
   arquivo indicado pela variável de ambiente `PH_OUTPUT_FILE`, que o backend cria e injeta
   automaticamente antes de iniciar o processo.

Veja [systems/_template/main.py](systems/_template/main.py) para um exemplo mínimo comentado, e
[systems/job-hunter/demo_main.py](systems/job-hunter/demo_main.py) para um exemplo completo com
delays realistas.

Se seu script já existe e você não quer alterá-lo, crie um **adapter**: um arquivo `main.py`
simples nessa pasta que importa/chama seu código real e traduz a saída para esse protocolo.

---

## Instalação

Pré-requisitos: **Python 3.10+** e **Node.js 18+** (testado com Python 3.13 e Node 24).

```powershell
git clone <seu-fork-ou-repo> plataforma-central
cd plataforma-central
```

---

## Variáveis de ambiente

| Arquivo | Uso |
|---|---|
| `backend/.env.example` → `backend/.env` | CORS, host/porta do backend |
| `frontend/.env.example` → `frontend/.env` | URL da API para o frontend |
| `systems/<id>/.env.example` → `systems/<id>/.env` | Credenciais/tokens **de cada sistema**, nunca chegam ao frontend nem ao backend — são lidas apenas pelo próprio script Python (ex.: com `python-dotenv`) |

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

---

## Executando o backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Teste rápido: abra `http://localhost:8000/api/systems` — deve listar os 6 cards (3 funcionais + 3 "em breve").

Documentação interativa (Swagger) em `http://localhost:8000/docs`.

---

## Executando o frontend

```powershell
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`.

---

## Docker

```powershell
docker compose up --build
```

- `backend` sobe na porta `8000`, com `systems/` montado como volume (edite/adicione sistemas sem
  rebuildar a imagem).
- `frontend` sobe na porta `5173` em modo dev.

---

## Como adicionar um novo sistema

1. Copie `systems/_template` para `systems/<seu-id>` (o nome da pasta = `id` do sistema, use
   minúsculas e hífen).
2. Edite `systems/<seu-id>/config.json`:
   ```json
   {
     "name": "Meu Sistema",
     "description": "O que ele faz.",
     "icon": "🚀",
     "category": "Automação",
     "repository": "https://github.com/voce/seu-repo",
     "command": "python main.py",
     "timeout_seconds": 600,
     "status": "ready",
     "output": {
       "mode": "file",
       "columns": [
         { "key": "campo", "label": "Campo", "type": "text" }
       ]
     },
     "export": { "enabled": true, "filename_prefix": "meu-sistema" }
   }
   ```
3. Garanta que o `command` siga o protocolo `PROGRESS` + `PH_OUTPUT_FILE` (veja seção anterior).
4. Reinicie o backend (ou apenas aguarde — o registro é lido a cada chamada de `GET /api/systems`,
   sem cache).
5. O card aparece automaticamente no dashboard — **nenhuma alteração de frontend é necessária.**

---

## Como conectar um repositório GitHub real

Você tem duas opções, sem precisar reestruturar o projeto:

**Opção A — clonar dentro da pasta do sistema**
```powershell
cd systems\job-hunter
git clone https://github.com/voce/job-hunter-real.git repo
```
Depois, ajuste `command` em `config.json` para apontar para o script real, por exemplo:
```json
"command": "python repo/main.py"
```

**Opção B — criar um adapter fino**
Mantenha `demo_main.py` como inspiração e crie um novo arquivo (ex.: `adapter.py`) que:
```python
import json, os, sys
sys.path.insert(0, "repo")       # ou faça `pip install -e repo`
from repo.core import buscar_vagas  # sua função real

def emit_progress(p, m):
    print(f"PROGRESS {json.dumps({'progress': p, 'message': m})}")
    sys.stdout.flush()

emit_progress(10, "Iniciando sistema...")
resultados = buscar_vagas()  # sua lógica real
emit_progress(90, f"Encontrados {len(resultados)} registros...")

with open(os.environ["PH_OUTPUT_FILE"], "w", encoding="utf-8") as f:
    json.dump(resultados, f, ensure_ascii=False)

emit_progress(100, "Finalizando...")
```
E aponte `"command": "python adapter.py"`.

Em ambos os casos, defina `"repository"` em `config.json` com a URL do GitHub — isso é usado apenas
como referência/link na UI (menu de Configurações), nunca para clonar automaticamente.

---

## Como adicionar/editar campos da tabela

As colunas da tabela de resultados vêm de `output.columns` no `config.json` do sistema:

```json
"columns": [
  { "key": "empresa", "label": "Empresa", "type": "text" },
  { "key": "salario", "label": "Salário", "type": "currency" },
  { "key": "link", "label": "Link", "type": "url" }
]
```

Tipos suportados: `text`, `number`, `currency`, `percent`, `date`, `url`. O `key` deve bater
exatamente com a chave que seu script escreve no JSON de resultado. A tabela (`ResultsTable`) e a
exportação (Excel/CSV) usam a mesma configuração — não há necessidade de tocar em código React.

---

## Exportação para Excel/CSV

- **Excel**: gerado no backend (`GET /api/systems/{id}/export`) com `pandas` + `openpyxl` — cabeçalho
  em negrito/colorido, autofiltro, primeira linha congelada, colunas com largura automática e
  hyperlinks reais para colunas do tipo `url`. Nome do arquivo: `<prefixo>-<data>.xlsx`.
- **CSV**: gerado no navegador a partir dos dados já carregados na tabela (respeita busca/ordenação
  atuais), sem round-trip ao backend.

Para exportar uma execução específica do histórico (não a mais recente):
`GET /api/systems/{id}/export?execution_id=<id>`.

---

## Ambientes Python isolados por sistema

Sistemas diferentes podem exigir versões de Python ou dependências conflitantes entre si. Duas
estratégias, ambas suportadas pela arquitetura atual sem mudar código:

1. **Virtualenv por sistema (recomendado para uso local):**
   ```powershell
   cd systems\meu-sistema
   python -m venv .venv
   .\.venv\Scripts\pip install -r requirements.txt
   ```
   E aponte o `command` no `config.json` diretamente para o interpretador da venv:
   ```json
   "command": ".venv\\Scripts\\python.exe main.py"
   ```
   (o backend executa o comando com `cwd` = pasta do sistema, então caminhos relativos funcionam).

2. **Container por sistema (para casos extremos de conflito, ex. Python 2 vs 3, libs nativas
   incompatíveis):** crie um `Dockerfile` dentro de `systems/<id>/` e mude o `command` para invocar
   `docker run --rm -v <pasta>:/work -w /work <imagem> python main.py`. Isso mantém o backend
   simples (ele só chama um comando de shell) enquanto isola completamente as dependências. Use essa
   opção apenas quando a venv não for suficiente, pois adiciona latência de inicialização do
   container a cada execução.

---

## API — referência rápida

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/systems` | Lista todos os sistemas (cards) |
| GET | `/api/systems/{id}` | Detalhe + colunas + histórico do sistema |
| POST | `/api/systems/{id}/run` | Inicia execução assíncrona → `{ execution_id, status }` |
| POST | `/api/systems/{id}/favorite` | Alterna favorito |
| GET | `/api/systems/{id}/export` | Baixa `.xlsx` da última execução (ou `?execution_id=`) |
| GET | `/api/executions` | Histórico (todas execuções, filtrável por `?system_id=`) |
| GET | `/api/executions/{id}` | Status/resultado de uma execução |
| GET | `/api/executions/{id}/stream` | Progresso em tempo real via SSE |
| GET | `/api/stats` | Contadores para o header (disponíveis/executando) |

Fluxo assíncrono (sistemas demorados nunca bloqueiam a requisição HTTP):

```
POST /api/systems/job-hunter/run → { "execution_id": "...", "status": "running" }
GET  /api/executions/{execution_id}/stream  (SSE, com fallback de polling no frontend)
  → data: {"status":"running","progress":45,"message":"Processando resultados..."}
  → data: {"status":"completed","progress":100,"results":[...]}
```

---

## Deploy

- **Backend**: qualquer host com Docker ou Python 3.10+ (Railway, Fly.io, VPS próprio). Monte
  `systems/` como volume persistente e configure `backend/.env` com as origens de CORS do seu
  domínio de frontend.
- **Frontend**: `npm run build` gera `frontend/dist/` — sirva como site estático (Netlify, Vercel,
  Nginx) apontando `VITE_API_URL` para a URL pública do backend.
- **Importante**: como o backend executa processos Python reais, ele precisa rodar em um ambiente
  com acesso de escrita a disco (para `PH_OUTPUT_FILE`) e permissão para spawnar subprocessos —
  não funciona em plataformas serverless que proíbem `subprocess`.

---

## Mock vs. execução real

- `job-hunter`, `leilao-imoveis` e `mestrados` vêm com um `demo_main.py` que **executa de verdade**
  (subprocess real, progresso real via stdout, JSON real) mas gera **dados fictícios** — não há
  nenhuma raspagem real de vagas/leilões/mestrados. Isso existe para provar que toda a infraestrutura
  (execução assíncrona, SSE, tabela dinâmica, exportação) funciona ponta a ponta antes de você
  conectar seus scripts reais.
- `monitor-investimentos`, `pesquisa-concursos` e `outros-sistemas` são cards **"Em breve"**
  (`"status": "coming_soon"`), sem comando configurado — servem de exemplo de como o dashboard já
  suporta crescer para novos sistemas.
- Assim que você tiver a URL do repositório real, siga
  [Como conectar um repositório GitHub real](#como-conectar-um-repositório-github-real) — nenhuma
  parte do frontend ou do backend precisa mudar.

---

## Início rápido (resumo)

```powershell
# Backend
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000

# Frontend (em outro terminal)
cd frontend
npm install
copy .env.example .env
npm run dev
```

- **Onde colocar seus repositórios GitHub:** campo `repository` em `systems/<id>/config.json`
  (apenas referência/link) + o código real clonado ou linkado conforme a seção
  [Como conectar um repositório GitHub real](#como-conectar-um-repositório-github-real).
- **Como adicionar um novo sistema Python:** copie `systems/_template`, edite `config.json`,
  garanta o protocolo `PROGRESS`/`PH_OUTPUT_FILE` no script.
- **Como isso vira um card:** automaticamente — o dashboard lê `GET /api/systems`, que escaneia
  `systems/*/config.json` a cada chamada.
- **Como os resultados chegam na tabela:** o script escreve um array JSON no arquivo de
  `PH_OUTPUT_FILE`; as colunas exibidas vêm de `output.columns` no `config.json`.
- **Como exportar para Excel:** botão "Exportar Excel" na tabela, ou `GET /api/systems/{id}/export`.
