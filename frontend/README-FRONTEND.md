# Frontend — Sistema Barbearia RPV

Frontend em React + Vite para consumir a API NestJS existente.

## O que está integrado

- Empresas: listar, cadastrar e editar.
- Clientes: listar, cadastrar, editar e excluir.
- Profissionais: listar, cadastrar, editar, ativar/desativar e excluir.
- Serviços: listar, cadastrar, editar e excluir.
- Agendamentos: criar com cliente, profissional, data/hora e seleção de vários serviços.
- Cabeçalho `x-empresa-id` enviado nas rotas que exigem contexto da empresa.

## Limitação importante do backend recebido

No backend atual, `GET /agendamentos`, `GET /agendamentos/:id` e `DELETE /agendamentos/:id` ainda retornam textos provisórios. A atualização de status também não está exposta no Controller. Por isso, o frontend não apresenta uma agenda/listagem falsa: ele permite criar agendamentos, que é a operação efetivamente implementada.

Também não há autenticação de usuários no backend. O seletor de empresa apenas envia o ID no cabeçalho; ele não substitui autenticação/autorização.

## Requisitos

- Node.js 20 ou superior recomendado
- pnpm
- Backend NestJS iniciado na porta 3000
- Banco de dados configurado e acessível pelo backend

## Instalação

Abra um terminal na pasta `frontend`:

```bash
pnpm install
pnpm dev
```

Abra `http://localhost:5173`.

O Vite encaminha as rotas `/empresas`, `/clientes`, `/profissionais`, `/servicos` e `/agendamentos` para `http://localhost:3000`. Isso evita precisar habilitar CORS no backend durante o desenvolvimento local.

## Onde colocar

Extraia a pasta `frontend` para dentro da pasta principal do projeto:

```text
sistema-barbearia-rpv/
├── src/                 # backend NestJS existente
├── prisma/
├── package.json         # package.json do backend, manter
└── frontend/            # nova pasta criada com este pacote
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
```

Não substitua o `package.json` da raiz do backend. O frontend possui seu próprio `package.json`.

## Ordem para executar

Terminal 1 — backend, na raiz do projeto original:

```bash
pnpm install
pnpm start:dev
```

Terminal 2 — frontend:

```bash
cd frontend
pnpm install
pnpm dev
```

## Observações de contrato

- O cadastro de cliente exige `nome` e `telefone` com DDD, somente dígitos (10 ou 11).
- O cadastro de profissional exige `nome`.
- O cadastro de serviço exige `nome`, `preco` positivo e `duracaoMin` inteiro maior ou igual a 5.
- A criação de agendamento exige `clienteId`, `profissionalId`, `inicio` ISO e `servicoIds` (lista não vazia de IDs).
- O backend calcula o fim do atendimento e verifica conflito de horário.
- O cadastro de empresa exige `nome` e CNPJ com 12 letras/números seguidos de 2 dígitos, conforme o DTO atual. Telefone é opcional.

## Produção

Para publicar frontend e backend em domínios diferentes, configure `VITE_API_URL` com a URL pública da API e habilite CORS no NestJS para o domínio do frontend. O proxy do Vite existe apenas para desenvolvimento.
