# PIX BaaS - Frontend

Aplicação frontend para Banking as a Service (BaaS) PIX em conformidade com BACEN.

## Stack Tecnológica

- **React 19** - Biblioteca JavaScript para construção de interfaces
- **TypeScript** - Tipagem estática para maior segurança
- **Vite** - Build tool rápido e moderno
- **TailwindCSS** - Framework CSS utilitário para estilização rápida
- **Supabase** - Backend-as-a-Service para autenticação e banco de dados
- **React Router** - Roteamento de páginas
- **Lucide React** - Biblioteca de ícones
- **Recharts** - Gráficos e visualizações de dados

## Funcionalidades

### Autenticação
- Login e registro com Supabase Auth
- Recuperação de senha por e-mail
- Sessão persistente com refresh automático de token
- Proteção de rotas autenticadas

### Gestão de Chaves PIX
- Cadastro de chaves CPF, E-mail, Telefone e Aleatória
- Validação de chaves conforme BACEN (Resolução DC/BACEN Nº 1/2020)
- Formatação automática de CPF e telefone
- Geração de chaves aleatórias UUID v4
- Ativação e desativação de chaves
- Visualização de saldo por chave

### Transações
- Envio de PIX instantâneo
- Busca de destinatário por chave PIX
- Validação de destinatário antes da transação
- Histórico completo de transações
- Filtros por status (concluídas, pendentes, falharam, canceladas)
- Visualização de detalhes da transação

### Monitoramento e Compliance
- Dashboard financeiro com saldo total
- Contadores de transações enviadas e recebidas
- Limites em conformidade com BACEN (Resolução 503/2025):
  - Limite diário: R$ 50.000,00
  - Limite por transação: R$ 15.000,00
  - Limite de frequência: 20 transações por dia
- Alertas de AML (Anti-Money Laundering)
- Verificação de KYC (Know Your Customer)

## Conformidade BACEN

A aplicação segue as diretrizes do Banco Central do Brasil:

### Resolução DC/BACEN Nº 1/2020
- Institui o arranjo de pagamentos PIX
- Aprova o regulamento do PIX
- Define tipos de chaves: CPF, E-mail, Telefone, Aleatória

### Resolução BCB Nº 503/2025
- Limite máximo de R$ 15.000,00 por transação
- Exceções ao limite para transações específicas
- Regras de validação e segurança

### Resolução Conjunta nº 16/2025
- Regulamenta modelos de parceria BaaS
- Define responsabilidades de parceiros
- Estabelece requisitos de transparência e segurança

### Normas de Segurança
- Validação de CPF com algoritmo oficial
- Formatação de telefone brasileiro (+55XX...)
- UUID v4 para chaves aleatórias
- Verificação de saldo antes da transação
- Monitoramento de transações para prevenção de fraudes

## Instalação

```bash
cd frontend
npm install
```

## Configuração

1. Copie o arquivo de exemplo de ambiente:
```bash
cp .env.example .env
```

2. Configure as variáveis de ambiente:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api
```

3. Configure o Supabase:
   - Crie um projeto em [supabase.com](https://supabase.com)
   - Ative o Email Auth
   - Crie as tabelas `pix_keys` e `transactions`

## Executar em Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

## Build para Produção

```bash
npm run build
```

Os arquivos otimizados estarão na pasta `dist`

## Estrutura do Projeto

```
frontend/
├── src/
│   ├── components/        # Componentes reutilizáveis
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   ├── contexts/          # Contexts React
│   │   └── AuthContext.tsx
│   ├── lib/              # Utilitários e serviços
│   │   ├── api.ts          # Camada de API
│   │   ├── supabase.ts     # Configuração Supabase
│   │   └── validators.ts    # Validações BACEN
│   ├── pages/            # Páginas da aplicação
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── PixKeys.tsx
│   │   ├── SendPix.tsx
│   │   └── Transactions.tsx
│   ├── App.tsx           # Componente principal com rotas
│   ├── index.css          # CSS global com Tailwind
│   └── main.tsx          # Ponto de entrada
├── public/               # Arquivos estáticos
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## Validações Implementadas

### CPF
- Validação de 11 dígitos
- Algoritmo de verificação oficial BACEN
- Detecção de CPFs com dígitos repetidos

### E-mail
- Validação de formato padrão
- Expressão regex completa

### Telefone
- Validação de código do país (+55)
- Validação de 11 dígitos após o código

### Chave Aleatória
- Validação de formato UUID v4
- Verificação de caracteres hexadecimal

### Valores Monetários
- Validação de valor positivo
- Verificação de limites BACEN
- Formatação para BRL (R$)

### Conta Bancária
- Validação de número de conta (5-12 dígitos)
- Validação de agência (3-5 dígitos)

## Rotas da Aplicação

### Públicas
- `/login` - Página de login
- `/register` - Página de registro

### Privadas (requer autenticação)
- `/dashboard` - Dashboard avançado com gráficos
- `/pix-keys` - Gestão de chaves PIX
- `/send-pix` - Enviar transação PIX
- `/transactions` - Histórico de transações
- `/pix-automatic` - PIX Automático
- `/pix-automatic/new` - Novo agendamento PIX Automático
- `/bank-settings` - Configurações de bancos e Open Finance

## Segurança

- Tokens JWT com refresh automático
- CSRF protection via cookies
- Headers de segurança HTTP
- Validação de entrada no lado do servidor
- Sanitização de dados
- HTTPS obrigatório em produção
- Atualizações em tempo real via Supabase Realtime
- Compartilhamento de dados via Open Finance (LGPD compliant)
- Criptografia de ponta a ponta em todas as transações
- Rastreabilidade completa de operações

## Funcionalidades Avançadas

- [x] Integração com Supabase Realtime para atualizações em tempo real
- [x] Suporte a PIX Automático
- [x] Webhooks para notificações de transação
- [x] Dashboard avançado com gráficos Recharts
- [x] Exportação de extrato em PDF/CSV
- [x] Suporte a múltiplos bancos
- [x] Integração com Open Finance Brasil

## Desenvolvimento Futuro

- [ ] Notificações push para transações
- [ ] Suporte a QR Code para PIX
- [ ] Integração com pagamentos QR Code dinâmicos
- [ ] Dashboard avançado com métricas financeiras (ROI, etc.)
- [ ] Exportação em Excel (XLSX)
- [ ] Suporte a contas conjuntas

## Licença

MIT

## Suporte

Para dúvidas sobre PIX e regulamentação BACEN:
- [Portal BACEN](https://www.bcb.gov.br/pix)
- [Resolução DC/BACEN Nº 1/2020](https://www.bcb.gov.br/normativos/detalhar/12647)
- [Regulamento BaaS](https://www.bcb.gov.br/normativos/baas)
