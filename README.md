# AquaFlux - Sistema Web IoT para Gestão Inteligente de Recursos Hídricos 🌱💧

> **TCC desenvolvido na ETEC Jardim Ângela**  
> Sistema completo de monitoramento e automação de irrigação com IoT, Arduino e Firebase

**Acesse:** [https://aqua-flux.web.app/index.html](https://aqua-flux.web.app/index.html)

## Sobre o Projeto

O **AquaFlux** é uma solução inovadora de IoT criada como Trabalho de Conclusão de Curso para a ETEC Jardim Ângela, com o objetivo de revolucionar o controle sobre o uso da água em propriedades rurais, empreendimentos comerciais e residências.

Unindo sensores inteligentes, hardware Arduino/ESP8266, inteligência de dados e automação em tempo real, o AquaFlux promove **eficiência**, **economia** e **sustentabilidade** em um sistema escalável que cresce junto com as necessidades do usuário.

### Objetivos do Projeto
- Reduzir **até 50%** o consumo de água através de irrigação inteligente
- Monitorar em tempo real o status de dispositivos IoT conectados
- Automatizar sistemas de irrigação baseados em dados ambientais e agendamentos
- Fornecer análises detalhadas de consumo, custos e eficiência
- Educar usuários sobre práticas sustentáveis através de IA especializada

***

## Funcionalidades Principais

### **Dashboard Inteligente (home.html)**
O painel principal oferece visão completa do sistema em tempo real:

- **Monitoramento de Dispositivos IoT**: Status online/offline de ESP8266/Arduino conectados
- **Dados Meteorológicos**: Integração com OpenWeatherMap API para previsão do tempo baseada na localização do usuário
- **Controle Manual de Bombas**: Liga/desliga dispositivos remotamente via Firebase Realtime Database
- **Alertas Inteligentes**: Notificações sobre dispositivos offline, manutenção necessária e anomalias
- **Dados Ambientais**: Temperatura, umidade, pressão atmosférica, velocidade do vento e previsão de chuva
- **Mensagens de Boas-Vindas Personalizadas**: Interface adaptada ao horário e nome do usuário

### **Sistema de Autenticação (login.html / cadastro.html)**

#### Cadastro de Usuários (cadastro.js)
Sistema robusto de registro com validações avançadas:

- **Tipos de Cadastro**: Pessoa Física (CPF) ou Jurídica (CNPJ)
- **Validações Implementadas**:
  - CPF: Validação matemática completa dos dígitos verificadores
  - CNPJ: Validação completa com cálculo de dígitos verificadores
  - E-mail: Validação de formato RFC 5322
  - Telefone: Suporte para formato brasileiro (11) 99999-9999
  - Senha Forte: Mínimo 6 caracteres com pelo menos 1 maiúscula, 1 número e 1 caractere especial
- **Máscaras Automáticas**: Formatação visual para CPF/CNPJ e telefone durante digitação
- **Prevenção de Duplicatas**: Verificação de e-mail e documento já cadastrados no Firebase

#### Login Seguro (login.js)
Sistema de autenticação exclusivo por CPF/CNPJ:

- **Login apenas com CPF/CNPJ**: Identificação única e segura
- **Validação de Formato**: Impede tentativas com documentos inválidos
- **Contador de Logins**: Rastreamento automático de acessos no Firebase
- **Registro de Último Acesso**: Atualização de timestamp a cada login
- **Persistência de Sessão**: Dados armazenados em localStorage com chave única `aquaflux_user_data`
- **Redirecionamento Inteligente**: Usuários já logados são enviados direto ao dashboard

### **Configuração de Bombas e Agendamentos (configBombas.html)**
Gerenciamento completo de dispositivos e automação:

#### Gerenciamento de Dispositivos
- **Cadastro de Dispositivos Arduino/ESP8266**: ID único, localização, vazão de água (L/min)
- **Configuração de Parâmetros**:
  - Umidade mínima do solo (threshold para ativação automática)
  - Fluxo de água do sistema (litros por minuto)
  - Modo automático: Liga/desliga baseado em sensores
- **Edição e Exclusão**: Interface intuitiva para gerenciar múltiplos dispositivos

#### Sistema de Agendamentos (pump-scheduler.js)
Motor de automação inteligente com funcionalidades avançadas:

- **Agendamentos Periódicos**:
  - Diário: Executa todos os dias em horário específico
  - Dias da Semana: Segunda a Domingo (seleção múltipla)
  - Datas Específicas: Agendamento para dias pontuais
- **Configurações de Tempo**:
  - Horário de início programável
  - Duração da irrigação em minutos
  - Repetição automática conforme padrão escolhido
- **Seleção de Dispositivos**: Vincule agendamentos a bombas específicas
- **Status Visual**: Interface mostra próxima execução, status ativo/inativo e histórico
- **Edição e Exclusão**: Modifique ou remova agendamentos a qualquer momento

### **Análise de Dados e Relatórios (dados.html)**
Painel analítico completo com métricas detalhadas:

#### Estatísticas em Tempo Real
- **Ativações do Mês**: Total de vezes que bombas foram acionadas
- **Ativações Hoje**: Contador diário com comparativo
- **Tempo de Operação**: Minutos hoje e horas na semana
- **Dispositivos Ativos**: Quantos dispositivos estão online
- **Eficiência do Sistema**: Percentual de uptime e taxa de sucesso

#### Análise de Consumo de Água
Sistema avançado de estimativa e custos:

- **Cálculo de Consumo**: Baseado em tempo de irrigação × vazão dos dispositivos (L/min)
- **Estimativa de Custos por Estado**: 
  - Base de dados de tarifas para SP (SABESP), RJ (CEDAE), MG (COPASA), RS (CORSAN), PR (SANEPAR), SC (CASAN), BA (EMBASA)
  - Cálculo automático baseado no endereço do usuário no Firebase
  - Tarifação progressiva: diferentes faixas de consumo (m³)
- **Breakdown Detalhado**: Visualização de custos por faixa de consumo
- **Separação por Tipo**: Irrigação automática vs. manual

#### Gráficos e Visualizações
- **Ativações por Período**: Linha do tempo de uso
- **Tempo de Irrigação Diário**: Comparativo automático vs. manual
- **Distribuição por Horário**: Heatmap de horários de maior uso
- **Eficiência Semanal**: Uptime e taxa de sucesso

#### Histórico Detalhado
Tabela com registro completo de todas as ativações:
- Data/hora exata
- Dispositivo utilizado
- Ação executada
- Duração da irrigação
- Consumo estimado
- Origem (manual/automático)
- Status da operação

### **Perfil do Usuário (infoUsuarios.html)**
Gerenciamento completo de conta e informações pessoais:

#### Dados Pessoais Editáveis
- **Informações Básicas**: Nome completo, nome de exibição, data de nascimento, gênero
- **Endereço Completo**: CEP, rua, número, complemento, bairro, cidade, estado
  - **Integração com ViaCEP**: Preenchimento automático ao digitar CEP válido
  - **Uso para Tarifação**: Estado utilizado para calcular custos de água regionais
- **Preferências de Notificações**: E-mail, SMS e alertas do sistema

#### Informações Protegidas (Somente Leitura)
- E-mail cadastrado
- Telefone
- CPF/CNPJ (com formatação visual)

#### Estatísticas da Conta
- **Total de Logins**: Contador desde o cadastro
- **Último Login**: Data e hora formatados
- **Tempo de Conta**: Dias desde o registro
- **Membro Desde**: Mês e ano do cadastro
- **Dispositivos Conectados**: Lista de Arduinos/ESP8266 vinculados

#### Gerenciamento de Dispositivos
- Visualização de ID, status (ativo/inativo) e última conexão
- Interface para adicionar novos dispositivos
- Exclusão de dispositivos inativos

### **Assistente IA - Terra (terra.html)**
Chatbot especializado em irrigação e agricultura sustentável:

#### Tecnologia
- **Motor de IA**: Google Gemini 2.5 Flash (SDK oficial @google/genai)
- **Contexto Especializado**: Prompt engineering com conhecimento técnico em:
  - Sistemas de irrigação (gotejamento, microaspersão, pivô central, aspersão)
  - Bombas hidráulicas (centrífugas, submersíveis, periféricas)
  - Automação e IoT (Arduino, ESP8266, sensores, protocolos)
  - Agricultura sustentável (evapotranspiração, coeficientes culturais)
  - Cálculos hidráulicos (vazão, perda de carga, altura manométrica)
  - Economia e eficiência (custos, payback, produtividade)
  - Análise de solo e água (pH, condutividade elétrica, nutrientes)
  - Dados climáticos (evapotranspiração, precipitação efetiva)

#### Funcionalidades
- **Conversas Persistentes**: Histórico salvo no Firebase Realtime Database
- **Múltiplas Conversas**: Crie e alterne entre diferentes tópicos
- **Tópicos Sugeridos**: Botões rápidos para perguntas comuns
- **Formatação Rica**: Negrito, listas, emojis e fórmulas técnicas
- **Histórico Sincronizado**: Acesse suas conversas de qualquer dispositivo
- **Limpeza de Histórico**: Exclua conversas antigas
- **Interface Responsiva**: Funciona em desktop e mobile

#### Exemplos de Uso
- "Como dimensionar uma bomba para irrigação de 2 hectares?"
- "Qual a melhor profundidade para sensor de umidade em tomates?"
- "Como calcular a evapotranspiração da minha cultura?"
- "Quais sensores usar para automação de irrigação?"

***

## Tecnologias Utilizadas

### Frontend
- **HTML5**: Estrutura semântica e acessível
- **CSS3**: Design responsivo, animações e transições
- **JavaScript ES6+**: Programação moderna com módulos, async/await e Promises

### Backend e Banco de Dados
- **Firebase Realtime Database**: Banco NoSQL em tempo real
  - Estrutura hierárquica para usuários, dispositivos e sensores
  - Sincronização automática entre clientes
  - Regras de segurança para proteção de dados
- **Firebase Hosting**: Hospedagem com CDN global e SSL

### IoT e Hardware
- **ESP8266**: Microcontrolador WiFi para comunicação IoT
- **Arduino**: Plataforma de prototipagem eletrônica
- **Sensores**: Umidade do solo, temperatura, pH (planejados)
- **Linguagem**: C++ para programação embarcada

### APIs Externas
- **OpenWeatherMap API**: Dados meteorológicos em tempo real
- **Google Gemini API**: Modelo de linguagem para assistente IA
- **ViaCEP API**: Busca automática de endereços por CEP

### Bibliotecas e SDKs
- **Firebase SDK 9.23.0**: Modular tree-shakeable SDK
- **@google/genai**: SDK oficial do Google Gemini
- **Chart.js** (planejado): Visualização de gráficos

***

## Estrutura de Arquivos Completa

```
📦 aqua-flux/
├── 📂 public/
│   ├── 📂 css/
│   │   ├── cadastro.css          # Estilos da página de cadastro
│   │   ├── configbombas.css      # Estilos do gerenciador de bombas
│   │   ├── dados.css             # Estilos da página de análises
│   │   ├── home.css              # Estilos do dashboard principal
│   │   ├── index.css             # Estilos da landing page
│   │   ├── login.css             # Estilos da página de login
│   │   └── user-info.css         # Estilos da página de perfil
│   │
│   ├── 📂 img/
│   │   └── [...]         
│   │
│   ├── 📂 javascript/
│   │   ├── cadastro.js           # Lógica de cadastro e validações
│   │   ├── dados.js              # Sistema de análise e relatórios
│   │   ├── home.js               # Dashboard e controle de dispositivos
│   │   ├── ia.js                 # Assistente IA Terra (Gemini)
│   │   ├── infouser.js           # Gerenciamento de perfil
│   │   ├── login.js              # Autenticação e sessão
│   │   └── pump-scheduler.js     # Agendamentos e automação
│   │
│   ├── 📄 index.html             # Landing page institucional
│   ├── 📄 cadastro.html          # Página de registro
│   ├── 📄 login.html             # Página de login
│   ├── 📄 home.html              # Dashboard principal
│   ├── 📄 configBombas.html      # Configuração de dispositivos
│   ├── 📄 dados.html             # Análises e relatórios
│   ├── 📄 infoUsuarios.html      # Perfil do usuário
│   └── 📄 terra.html             # Assistente IA
│
├── 📄 firebase.json              # Configuração do Firebase Hosting
├── 📄 .firebaserc               # Projeto Firebase vinculado
└── 📄 README.md                 # Este arquivo
```

***

## Estrutura do Banco de Dados Firebase

```
aqua-flux-default-rtdb/
├── users/
│   └── {userId}/                    # ID único baseado no e-mail
│       ├── nome: string
│       ├── email: string
│       ├── documento: string        # CPF/CNPJ sem formatação
│       ├── telefone: string
│       ├── senha: string            # ⚠️ Em produção, usar hash
│       ├── tipoCadastro: string     # "pessoal" | "profissional"
│       ├── dataCadastro: timestamp
│       ├── ultimoLogin: timestamp
│       ├── totalLogins: number
│       ├── ativo: boolean
│       ├── nomeExibicao: string
│       ├── dataNascimento: string
│       ├── genero: string
│       │
│       ├── endereco/
│       │   ├── cep: string
│       │   ├── rua: string
│       │   ├── numero: string
│       │   ├── complemento: string
│       │   ├── bairro: string
│       │   ├── cidade: string
│       │   └── estado: string       # Usado para cálculo de tarifas
│       │
│       ├── preferencias/
│       │   ├── emailNotifications: boolean
│       │   ├── smsNotifications: boolean
│       │   └── systemAlerts: boolean
│       │
│       ├── devices/                 # Dispositivos IoT
│       │   └── {deviceId}/
│       │       ├── arduinoId: string
│       │       ├── location: string
│       │       ├── waterFlow: number     # L/min
│       │       ├── moistureThreshold: number  # %
│       │       ├── autoMode: boolean
│       │       ├── isOnline: boolean
│       │       ├── lastSeen: timestamp
│       │       └── uptime: number
│       │
│       ├── schedules/               # Agendamentos
│       │   └── {scheduleId}/
│       │       ├── deviceId: string
│       │       ├── type: string          # "daily" | "weekly" | "specific"
│       │       ├── time: string          # "HH:MM"
│       │       ├── duration: number      # minutos
│       │       ├── daysOfWeek: array     # [0-6] para semanal
│       │       ├── specificDate: string  # para tipo específico
│       │       ├── active: boolean
│       │       └── createdAt: timestamp
│       │
│       ├── sensorData/              # Dados dos sensores
│       │   └── {timestamp}/
│       │       ├── temperature: number
│       │       ├── humidity: number
│       │       ├── soilMoisture: number
│       │       ├── waterLevel: number
│       │       └── deviceId: string
│       │
│       ├── pumpHistory/             # Histórico de acionamentos
│       │   └── {historyId}/
│       │       ├── deviceId: string
│       │       ├── state: boolean        # on/off
│       │       ├── timestamp: timestamp
│       │       ├── duration: number      # minutos
│       │       ├── origin: string        # "manual" | "automatic" | "scheduled"
│       │       └── waterUsage: number    # litros estimados
│       │
│       └── conversations/           # Histórico IA Terra
│           └── {conversationId}/
│               ├── title: string
│               ├── createdAt: timestamp
│               ├── updatedAt: timestamp
│               └── messages/
│                   └── {messageId}/
│                       ├── role: string      # "user" | "assistant"
│                       ├── content: string
│                       └── timestamp: timestamp
```

***

## Pré-requisitos para Uso

### Para Usuários Finais
- **Navegador Moderno**: Chrome, Firefox, Edge, Safari
- **Conexão com Internet**: Necessária para comunicação com Firebase
- **Cadastro Válido**: CPF/CNPJ real, e-mail e telefone válidos
- **Dispositivo Arduino/ESP8266** (opcional): Para monitoramento real (funciona em modo simulação)

### Para Desenvolvedores
- **Node.js 14+**: Para ferramentas de desenvolvimento
- **Firebase CLI**: `npm install -g firebase-tools`
- **Conta Firebase**: Projeto configurado no Firebase Console
- **Chaves API**:
  - Firebase (incluída no código)
  - OpenWeatherMap (gratuita em https://openweathermap.org/api)
  - Google Gemini (gratuita em https://aistudio.google.com/app/apikey)

***

## Como Executar o Projeto

### 1. Clone o Repositório
```bash
git clone https://github.com/seu-usuario/aquaflux.git
cd aquaflux
```

### 2. Configure as Chaves API

**OpenWeatherMap (home.js)**
```javascript
const WEATHER_API_KEY = "SUA_CHAVE_AQUI";
```

**Google Gemini (ia.js)**
```javascript
this.GEMINI_API_KEY = 'SUA_CHAVE_AQUI';
```

### 3. Inicie o Firebase Hosting (Local)
```bash
firebase login
firebase init hosting
firebase serve
```

Acesse: `https://firebase.google.com/?hl=pt-br`

### 4. Deploy para Produção
```bash
firebase deploy --only hosting
```

***

## Equipe de Desenvolvimento

| Nome             | Função                          |
|------------------|---------------------------------|
| **Andrey Dizioli** | Web Design                    | 
| **João Vitor**     | Design                        | 
| **Pedro Henrique** | Documentação                  | 
| **Vitor**          | Backend                       |
| **Yan**            | Backend                       | 

**Instituição**: ETEC Jardim Ângela  
**Curso**: Técnico em [Desenvolvimento de Sistemas]  
**Ano**: 2025

***

## Diferenciais do Projeto

### Técnicos
- **Arquitetura Moderna**: Firebase Realtime Database com sincronização em tempo real
- **Validações Robustas**: Algoritmos matemáticos para CPF/CNPJ, não apenas regex
- **IA Especializada**: Prompt engineering com contexto técnico para irrigação
- **Tarifação Regionalizada**: Base de dados de companhias de água de 7 estados brasileiros
- **Detecção Inteligente de Offline**: Sistema avançado para identificar dispositivos desconectados
- **Agendamentos Flexíveis**: Suporte para múltiplos padrões de recorrência

### Experiência do Usuário
- **Interface Intuitiva**: Design limpo e responsivo inspirado em SaaS modernos
- **Feedback Visual**: Notificações, animações e estados visuais claros
- **Acessibilidade**: Semântica HTML adequada e contraste de cores
- **Educação Integrada**: IA Terra ensina práticas sustentáveis
- **Dados Acionáveis**: Relatórios que geram insights práticos

### Sustentabilidade
- **Economia Real**: Potencial de redução de 50% no consumo de água
- **Consciência Ambiental**: Dashboards mostram impacto do uso consciente
- **Agricultura de Precisão**: Irrigação baseada em dados reais de sensores

***

## Roadmap - Melhorias Futuras

### Curto Prazo (v2.0)
- [ ] Implementar autenticação com hash (bcrypt) para senhas
- [ ] Adicionar gráficos interativos (Chart.js) em dados.html
- [ ] Modo escuro (dark mode)
- [ ] Exportação de relatórios em PDF
- [ ] Push notifications (Progressive Web App)

### Médio Prazo (v3.0)
- [ ] Aplicativo mobile nativo (React Native)
- [ ] Integração com mais sensores (pH, condutividade elétrica, NPK)
- [ ] Machine Learning para previsão de necessidade hídrica
- [ ] Módulo de gestão financeira (ROI, payback)
- [ ] Multi-idioma (inglês, espanhol)

### Longo Prazo (v4.0)
- [ ] Marketplace de sensores e dispositivos
- [ ] Integração com drones para mapeamento
- [ ] API pública para desenvolvedores
- [ ] Sistema de comunidade e compartilhamento de dados
- [ ] Certificação para agricultura orgânica

***

## Documentação Técnica Adicional

### Configuração do Firebase
```javascript
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};
```

### Fórmulas de Cálculo de Consumo
```javascript
// Consumo de água (litros)
consumo = tempoIrrigação (minutos) × vazãoDispositivo (L/min)

// Custo de água (regional)
custo = (consumo / 1000) × tarifaPorM³Estado + taxaBásica
```

### Fluxo de Autenticação
1. Usuário insere CPF/CNPJ e senha
2. Sistema valida formato do documento matematicamente
3. Busca no Firebase por documento correspondente
4. Verifica senha em texto plano (⚠️ melhorar em produção)
5. Atualiza contadores de login no Firebase
6. Salva sessão em localStorage com chave `aquaflux_user_data`
7. Redireciona para home.html

***

## ⚠️ Avisos Legais e Segurança

### Uso Educacional
Este sistema foi desenvolvido para **fins educacionais** como Trabalho de Conclusão de Curso, com potencial de evolução para projetos reais de gestão hídrica e agricultura inteligente.

### Considerações de Segurança
- **Senhas**: Atualmente armazenadas em texto plano. **Em produção, implementar hash (bcrypt, Argon2)**.
- **Firebase Rules**: Configurar regras de segurança adequadas para produção.
- **HTTPS**: Sempre use conexão segura (Firebase Hosting já fornece).
- **Validação Server-Side**: Em ambiente corporativo, validar dados também no backend.
- **Chaves API**: Nunca exponha chaves em repositórios públicos (usar variáveis de ambiente).

---

## 📞 Contato e Suporte

**Endereço da ETEC**  
Estrada da Baronesa, 1695 - Jardim Ângela  
São Paulo - SP, CEP: 04941-175

**E-mail do Projeto**: [tccaquaflux@gmail.com]  

***

## Licença

Este projeto está sob licença educacional. Para uso comercial, entre em contato com a equipe de desenvolvimento.

***

## Agradecimentos

- **ETEC Jardim Ângela**: Pelo suporte institucional e infraestrutura
- **Professor Quaiati**: Pela mentoria e direcionamento técnico
- **Google Cloud**: Pelas ferramentas Firebase e Gemini API
- **OpenWeatherMap**: Pelos dados meteorológicos
- **Comunidade Open Source**: Pelas bibliotecas e ferramentas utilizadas

***

## Estatísticas do Projeto

- **Linhas de Código**: ~15.000+ (JavaScript, HTML, CSS)
- **Arquivos**: 15 arquivos principais
- **Funcionalidades**: 8 módulos completos
- **Validações**: 12+ tipos de validação implementados
- **Integrações**: 4 APIs externas
- **Tempo de Desenvolvimento**: [1Ano]
- **Membros da Equipe**: 5 desenvolvedores

***

**AquaFlux: Transformando o futuro da agricultura com tecnologia, sustentabilidade e inovação.** 

***

*Última atualização: 17 de Outubro de 2025*
