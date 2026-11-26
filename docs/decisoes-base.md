# Decisões da base do sistema (parte da Nicoly)

Este documento explica as decisões da fundação do front-end, das empresas e dos serviços.
Itens marcados como **[PENDENTE]** precisam ser confirmados pelo grupo; não foram decididos por ele.

> Observação: o texto completo do desafio não está no ZIP. As respostas abaixo usam apenas o cenário
> informado (uma recepcionista que trabalha com duas barbearias) e o que está implementado no código.

---

## 1. Quem utiliza o sistema?

A recepcionista, que atende duas barbearias (duas empresas) e agenda clientes para os profissionais de cada uma.
Ela não é técnica, então o sistema precisa ser simples de usar.

## 2. Quais são as principais dificuldades da recepcionista?

Interpretação a partir do cenário (**[PENDENTE]** confirmar com o grupo):

- Trabalhar com duas barbearias e correr o risco de registrar algo na empresa errada.
- Atender rápido, com poucos passos e sem telas confusas.
- Entender o que deu errado quando algo falha.

Por isso o visual usa botões grandes, textos legíveis e um menu fixo e curto.

## 3. Como o sistema identifica a empresa atual?

1. Ao entrar, se não houver empresa escolhida, o usuário vai para a tela de seleção (`/empresas`).
2. A escolha (`id` e `nome`) é guardada pelo `EmpresaContext` no `localStorage`.
3. A camada `api.js` lê esse mesmo `id` e envia o cabeçalho `x-empresa-id` em todas as requisições, **exceto** nas rotas `/empresas`.
4. O back-end exige o cabeçalho (decorator `EmpresaId`) e usa esse valor em todas as consultas.

Fluxo: seleção da empresa → contexto/localStorage → `x-empresa-id` → API → serviços da empresa.

## 4. Como evitar registros na empresa errada?

- O nome da empresa atual fica sempre em destaque no cabeçalho.
- O back-end grava e busca sempre usando o `empresaId` do cabeçalho; um serviço de outra empresa responde 404 (`Serviço não encontrado`) para consulta, edição e exclusão.
- As telas do sistema só abrem se houver uma empresa selecionada.

Limite conhecido: não há login, então o back-end confia no cabeçalho enviado pelo navegador.

## 5. O que acontece quando a empresa é alterada?

- "Alterar empresa" (final do menu lateral) limpa a empresa atual e leva de volta à seleção.
- Ao escolher outra empresa, as telas carregam novamente os dados da nova empresa.
- Formulários abertos na troca são descartados.

## 6. Como o sistema informa que a API está indisponível?

A tela mostra "Não foi possível carregar os dados", a mensagem `Não foi possível conectar ao servidor`
e o botão **Tentar novamente**, evitando telas em branco.

## 7. Como informa quando a API demora?

Se a resposta passar de 10 segundos, a requisição é interrompida e aparece
`O servidor está demorando para responder`.

Atenção: em criação, edição ou exclusão, o servidor pode ter concluído a operação mesmo assim.
Por isso, antes de repetir a ação, é recomendável conferir a lista.

## 8. Como apresenta erros do back-end?

O `api.js` lê o campo `message` da resposta da API. Quando vier uma lista (erros de validação), os textos
são unidos com `; `. A mensagem é mostrada ao usuário: dentro do formulário (cadastro/edição) ou em aviso
na tela (exclusão). Não se esconde a mensagem do back-end.

## 9. Como protege o usuário contra exclusões acidentais?

- Toda exclusão pede confirmação (`ConfirmDialog`), com o nome do serviço e botão vermelho.
- O back-end impede excluir serviço vinculado a agendamento da mesma empresa (409) e não altera agendamentos existentes.
- O preço cobrado fica salvo em cada agendamento (`precoCobrado`); por isso, ao editar o preço de um serviço, o sistema avisa:
  "Agendamentos já marcados mantêm o preço antigo."

## 10. Quais funcionalidades foram descartadas e por quê?

| Funcionalidade | Motivo |
|---|---|
| Login e autenticação | Não fazem parte dos requisitos informados. |
| Cadastro, edição e desativação de empresas pela interface | A tela é apenas de seleção; empresas são gerenciadas pela API. **[PENDENTE]** confirmar com o grupo. |
| Limite de 2 casas decimais no preço (`@IsNumber({ maxDecimalPlaces: 2 })`) | Já estava comentado no código; foi mantido assim para não mudar regra de validação sem decisão do grupo. **[PENDENTE]** |
| Dashboard, agendamentos, clientes, profissionais e seed | São de responsabilidade de Adriana e Mhell; existem apenas placeholders para a navegação. |

---

## Pendências do grupo

1. Confirmar as dificuldades da recepcionista (item 2).
2. Decidir se empresas serão gerenciadas pela interface (item 10).
3. Decidir sobre o limite de casas decimais do preço (item 10).
4. Decidir se o `CORS` aberto (qualquer origem) é suficiente ou se deve ser restrito ao endereço do front-end em produção.
