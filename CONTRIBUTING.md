# Contribuindo com o app mobile

Este projeto aceita contribuições em UX mobile, performance, acessibilidade, integração com API, mapas, notificações, build e documentação.

## Antes de abrir um PR

- Verifique se já existe issue ou PR relacionado
- Se a mudança alterar navegação, autenticação, mapas ou build nativo, descreva o impacto
- Prefira PRs pequenos e objetivos

## Como rodar localmente

1. Instale dependências:

```bash
npm install
```

2. Crie e configure o arquivo `.env`

3. Garanta que a API esteja acessível pelo dispositivo ou emulador

4. Rode o projeto:

```bash
npm run start
```

## Fluxo recomendado

1. Faça fork do repositório
2. Crie uma branch:

```bash
git checkout -b feat/melhoria-no-android
```

3. Implemente
4. Valide localmente
5. Abra o PR com contexto e passos para teste

## Checklist de validação

Antes de enviar:

```bash
npm run lint
npx tsc --noEmit
npx expo-doctor
```

Também valide manualmente:

- login, cadastro e navegação principal, se afetados
- mapa e consumo da API
- Android, iOS ou PWA, conforme a plataforma impactada
- build Android local se houver mudança nativa

## Padrões esperados

- Preserve a organização entre `app/`, `src/core/` e `src/features/`
- Evite duplicação de componentes ou lógica de acesso à API
- Não introduza dependências nativas sem necessidade clara
- Mantenha estados, mensagens e fluxos claros para o usuário
- Prefira correções incrementais em vez de refactors extensos sem contexto

## Quando atualizar documentação

Atualize o `README.md` se houver mudança em:

- setup Android, iOS ou PWA
- variáveis de ambiente
- comandos de execução
- fluxo de autenticação ou navegação
- integração com backend, mapas ou notificações

## O que ajuda bastante em um PR

- screenshots ou gravações curtas
- descrição do problema
- solução adotada
- riscos conhecidos
- passos exatos para testar
