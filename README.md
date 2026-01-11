# 🌱 AquaFlux — Sistema Inteligente de Irrigação

AquaFlux é um sistema inteligente de irrigação que combina **IoT, Web e Inteligência Artificial** para automatizar, monitorar e otimizar o uso de água na agricultura, promovendo **eficiência hídrica, sustentabilidade e produtividade**.

O sistema permite que produtores acompanhem em tempo real as condições do solo e do ambiente, controlem bombas de irrigação remotamente e recebam recomendações baseadas em dados.

---

## 🚀 Objetivo

Desenvolver uma solução tecnológica capaz de:

- Reduzir o desperdício de água  
- Automatizar o processo de irrigação  
- Melhorar a produtividade agrícola  
- Fornecer dados em tempo real para tomada de decisão  

O AquaFlux foi desenvolvido como um **projeto acadêmico de IoT e sistemas web**, com foco em aplicações reais no agronegócio.

---

## 🧠 Funcionalidades

- 📊 Monitoramento da umidade do solo e do ar  
- ⚡ Acionamento automático de bombas de irrigação  
- 📅 Agendamento de irrigação  
- 📈 Relatórios de consumo de água  
- 🔔 Sistema de notificações  
- 🧠 Módulo de recomendações baseado em IA  
- 🌐 Acesso via navegador (web app)  

---

## 🏗️ Arquitetura Geral

O sistema é composto por três camadas principais:

Sensores e ESP8266 → Firebase → Aplicação Web → Usuário

yaml
Copiar código

- **ESP8266** coleta dados dos sensores  
- **Firebase** armazena e distribui os dados  
- **Web App** exibe informações e permite controle remoto  

---

## 🖥️ Interface Web

O painel web permite:

- Visualizar dados em tempo real  
- Ativar e desativar bombas  
- Configurar agendamentos  
- Acompanhar relatórios  
- Receber alertas e notificações  

A interface foi projetada para ser **simples, responsiva e intuitiva**.

---

## 🧩 Estrutura do Projeto

AquaFlux
│
├── Novo
│ ├── css
│ ├── javascript
│ ├── img
│ ├── index.html
│ ├── dashboard.html
│ ├── loading.html
│ ├── termos.html
│ └── terra.html
│
├── firebase.json
├── .firebaserc
└── README.md

yaml
Copiar código

---

## 🔥 Tecnologias Utilizadas

### Frontend
- HTML5  
- CSS3  
- JavaScript  

### Backend e Infraestrutura
- Firebase Realtime Database  
- Firebase Authentication  
- Firebase Hosting  

### Hardware
- ESP8266  
- Sensores de umidade do solo  
- Sensores ambientais  

---

## 🤖 Inteligência Artificial

O sistema inclui um módulo de análise que:

- Interpreta dados do solo e clima  
- Sugere ajustes de irrigação  
- Auxilia na tomada de decisão  

O objetivo é tornar a irrigação cada vez mais **precisa e adaptativa**.

---

## 🔐 Segurança

- Autenticação de usuários  
- Controle de acesso ao painel  
- Regras de banco de dados  
- Isolamento entre dispositivos  

O sistema foi projetado para garantir que apenas usuários autorizados possam controlar os dispositivos.

---

## 🌍 Impacto Ambiental

O AquaFlux contribui para:

- Redução do desperdício de água  
- Uso consciente dos recursos naturais  
- Agricultura mais sustentável  
- Menor impacto ambiental  

---

## 📌 Status do Projeto

🟢 Em desenvolvimento ativo  
🔵 Funcionalidades principais implementadas  
🟡 Melhorias contínuas em andamento  

---

## 👥 Equipe

Projeto desenvolvido por um grupo de estudantes com foco em **IoT, Web e Automação Agrícola**.

**Desenvolvedor principal:**  
Yan — Frontend, Firebase, Integração IoT e Arquitetura do Sistema  

---

## 🌐 Demonstração

Aplicação web disponível em:  
**https://aqua-flux.web.app**

*(Ambiente de demonstração)*

---

## 📜 Licença

Este projeto é de uso acadêmico e experimental.  
Entre em contato para uso comercial.
