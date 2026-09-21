# Como adicionar um novo sistema

1. Copie esta pasta `_template` para `systems/<seu-sistema-id>/`
   (o nome da pasta vira o `id` do sistema, use apenas letras minúsculas e hífen).
2. Edite `config.json` com nome, descrição, ícone, categoria, comando e colunas
   da tabela de resultados.
3. Garanta que o comando configurado siga o protocolo descrito em `main.py`:
   - imprime linhas `PROGRESS {json}` no stdout para reportar progresso;
   - escreve o resultado final (lista JSON) no arquivo indicado pela variável
     de ambiente `PH_OUTPUT_FILE`.
4. Se você já tem um repositório Python real no GitHub:
   - opção A: clone o repositório dentro desta pasta (ex.: `systems/<id>/repo/`)
     e crie um `main.py` (adapter) que importa/chama o código real e traduz a
     saída para o protocolo acima;
   - opção B: adicione os `prints` de progresso e a escrita do arquivo de saída
     diretamente no seu script existente.
5. Se o sistema usa credenciais/tokens, crie um `.env` nesta pasta (nunca
   versionado) a partir de um `.env.example`, e carregue-o no seu script com
   `python-dotenv`. O backend nunca lê nem expõe esse conteúdo.
6. Reinicie o backend (ou aguarde o próximo `GET /api/systems`, que já lê o
   registro dinamicamente) — nenhuma alteração de código é necessária.
