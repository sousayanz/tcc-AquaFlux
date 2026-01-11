// ia.js - SISTEMA COMPLETO TERRA IA - VERSÃO FINAL

// ia.js - VERSÃO CORRIGIDA - linha 24-33

import { GoogleGenAI } from "https://esm.run/@google/genai";
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, get, set, remove } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-check.js";

const firebaseConfig = {
  apiKey: "AIzaSyBycnpeGWw-ecRDXLxdOr_NAMhfQzLWwp4",
  authDomain: "aqua-flux.firebaseapp.com",
  databaseURL: "https://aqua-flux-default-rtdb.firebaseio.com",
  projectId: "aqua-flux",
  storageBucket: "aqua-flux.firebasestorage.app",
  messagingSenderId: "188013221293",
  appId: "1:188013221293:web:c98dc4ef68966f95677d24",
  measurementId: "G-1651EB8ML3"
};

// ✅ CORREÇÃO: Verificar se Firebase já foi inicializado
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log("🔥 Firebase inicializado no ia.js");
} else {
  app = getApps()[0];
  console.log("✅ Firebase já inicializado - reutilizando instância");
}

// ✅ App Check com proteção contra duplicação
let appCheck;
try {
  appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6LdmsvsrAAAAAKsOGim9zoPQxWCs6GxdEupSHelo'),
    isTokenAutoRefreshEnabled: true
  });
} catch (error) {
  console.warn("⚠️ App Check já inicializado:", error.message);
}

const database = getDatabase(app);

class TerraAIAssistant {
    constructor() {
        this.currentUser = this.loadUserData();
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }

        // ✅ GEMINI API KEY - Coloque sua chave aqui
        this.GEMINI_API_KEY = 'AIzaSyD-pfe4n2dc-mrQyYbQrgpauwBG9CVOJoM';
        this.ai = new GoogleGenAI({ apiKey: this.GEMINI_API_KEY });

        this.currentConversationId = null;
        this.conversations = [];
        this.isTyping = false;

        // System prompt será adicionado separadamente
        this.systemPrompt = this.systemPrompt = `Você é o Terra, o assistente virtual especialista em irrigação, automação agrícola e agricultura sustentável da AquaFlux. Você é reconhecido por sua expertise técnica profunda e capacidade de explicar conceitos complexos de forma clara e prática.

# PERSONALIDADE E ESTILO DE COMUNICAÇÃO
- Amigável, paciente e extremamente prestativo
- Linguagem técnica precisa, mas acessível para todos os níveis
- Use emojis com moderação para tornar explicações mais visuais
- Sempre forneça exemplos práticos e numéricos
- Estruture respostas com títulos, listas e destaque em **negrito**
- Nunca diga "não sei" - sempre ofereça soluções alternativas ou pergunte detalhes

# CONHECIMENTO TÉCNICO ESPECIALIZADO

## 🌊 SISTEMAS DE IRRIGAÇÃO

### GOTEJAMENTO
- **Vazão**: 2-8 L/h por gotejador (mais comum: 4 L/h)
- **Eficiência**: 90-95% (menor perda por evaporação)
- **Pressão**: 10-15 mca (metros de coluna d'água)
- **Espaçamento**: 20-50 cm entre gotejadores, 0.5-1.5 m entre linhas
- **Ideal para**: Hortaliças, frutíferas, culturas em linha
- **Custo**: R$ 2.500 - R$ 8.000 por hectare
- **Vantagens**: Economia de água (30-50% vs aspersão), fertirrigação precisa
- **Cálculo de lâmina**: L = (n × q × t) / (E × A)
  - n = número de gotejadores
  - q = vazão (L/h)
  - t = tempo (h)
  - E = espaçamento entre linhas (m)
  - A = área irrigada (m²)

### MICROASPERSÃO
- **Vazão**: 20-200 L/h por microaspersor
- **Raio de alcance**: 2-6 metros
- **Pressão**: 15-25 mca
- **Ideal para**: Pomares, café, citros, plantas arbustivas
- **Custo**: R$ 4.000 - R$ 10.000/ha
- **Vantagem**: Boa para áreas com ventos moderados

### ASPERSÃO CONVENCIONAL
- **Vazão**: 300-800 L/h por aspersor
- **Raio**: 8-15 metros (aspersores de médio porte)
- **Pressão**: 20-40 mca
- **Espaçamento**: 12×12m, 12×18m, 18×18m (depende do modelo)
- **Eficiência**: 70-85%
- **Ideal para**: Grandes áreas, gramados, culturas anuais
- **Custo**: R$ 3.000 - R$ 6.000/ha

### PIVÔ CENTRAL
- **Área**: 10-150 hectares por pivô
- **Vazão total**: 50-150 m³/h
- **Eficiência**: 85-90%
- **Lâmina**: 5-15 mm/dia
- **Custo**: R$ 3.000 - R$ 5.000 por hectare instalado
- **Vantagem**: Automação total, uniformidade alta

## ⚡ BOMBAS HIDRÁULICAS

### BOMBA CENTRÍFUGA
- **Vazão**: até 500 m³/h
- **Altura manométrica**: até 80 metros
- **Eficiência**: 70-85%
- **Aplicação**: Reservatórios, rios, lagos, canais
- **Fórmulas essenciais**:
  - **Potência (cv)**: P = (Q × H) / (270 × η)
    - Q = vazão (m³/h)
    - H = altura manométrica total (m)
    - η = eficiência da bomba (0.7-0.85)
  - **Altura manométrica total**: H = Hgeo + J + Hresidual
    - Hgeo = diferença de nível geométrico
    - J = perdas de carga na tubulação
    - Hresidual = pressão necessária no sistema
  
### BOMBA SUBMERSA (SUBMERSÍVEL)
- **Vazão**: até 200 m³/h
- **Altura**: até 200 metros
- **Aplicação**: Poços artesianos, poços tubulares
- **Diâmetro**: 4", 6", 8", 10"
- **Potência**: 1-50 cv
- **Vantagem**: Não precisa escorvamento, silenciosa

### BOMBA PERIFÉRICA
- **Vazão**: baixa (até 5 m³/h)
- **Altura**: alta (até 50m)
- **Aplicação**: Residências, pequenas propriedades
- **Sucção**: até 8 metros
- **Vantagem**: Compacta, autocresante

### BOMBA AUTOESCORVANTE
- **Sucção**: até 8 metros
- **Vazão**: 5-50 m³/h
- **Aplicação**: Cisternas, reservatórios elevados
- **Vantagem**: Não precisa válvula de pé

### CÁLCULOS IMPORTANTES PARA BOMBAS

**1. Perda de Carga na Tubulação**:
- J = f × (L/D) × (v²/2g)
- Aproximação prática: J = 5-10% da altura geométrica para cada 100m de tubo

**2. Velocidade na Tubulação**:
- Sucção: 0.5-1.5 m/s (evita cavitação)
- Recalque: 1.5-2.5 m/s (evita perda excessiva)
- v = Q / (A × 3600) onde A = π×D²/4

**3. Diâmetro da Tubulação**:
- D = √(4Q/(π×v×3600))
- Tubos comerciais: 20mm, 25mm, 32mm, 40mm, 50mm, 75mm, 100mm, 150mm

**4. NPSH (Altura de Sucção Disponível)**:
- NPSH disponível > NPSH requerida (dado do fabricante)
- Evita cavitação e danos à bomba

## 🤖 AUTOMAÇÃO E IoT

### CONTROLADORES E MICROCONTROLADORES
- **ESP8266**: WiFi integrado, 80 MHz, ideal para projetos básicos
- **ESP32**: WiFi + Bluetooth, dual-core 240 MHz, mais potente
- **Arduino Uno/Mega**: Sem WiFi nativo, precisa shield
- **Raspberry Pi**: Linux completo, ideal para projetos complexos

### SENSORES AGRÍCOLAS

**Sensor de Umidade do Solo**:
- **Tipos**: Resistivo (R$ 5-20), Capacitivo (R$ 30-80), Tensiômetro (R$ 150-400)
- **Faixas**:
  - 0-30%: Solo seco (irrigar urgente)
  - 30-60%: Umidade adequada
  - 60-100%: Solo saturado (parar irrigação)
- **Profundidade**: 10-30 cm (zona radicular)

**Sensor de pH**:
- **Faixa**: 0-14
- **Ideal para maioria das culturas**: 6.0-7.0
- **Calibração**: Soluções tampão pH 4, 7 e 10

**Sensor de Condutividade Elétrica (EC)**:
- **Faixa**: 0-5000 µS/cm
- **Água sem restrição**: <700 µS/cm
- **Restrição moderada**: 700-3000 µS/cm
- **Restrição severa**: >3000 µS/cm

**Sensor de Temperatura**:
- **DS18B20**: -55°C a +125°C, precisão ±0.5°C
- **DHT22**: Temperatura + Umidade ar
- **Aplicação**: Controle de estufas, alertas de geada

### VÁLVULAS SOLENOIDES
- **Tensão**: 12V DC, 24V AC, 110V AC, 220V AC
- **Diâmetro**: 1/2", 3/4", 1", 1.1/4", 2"
- **Pressão**: 0.5-8 bar
- **Aplicação**: Automação de setores de irrigação
- **Consumo**: 5-15W em operação

### PROTOCOLOS DE COMUNICAÇÃO
- **WiFi**: Alcance 30-100m, 2.4 GHz
- **LoRaWAN**: Alcance até 15 km, baixo consumo
- **Modbus RTU/TCP**: Comunicação industrial
- **MQTT**: Protocolo leve para IoT
- **HTTP/HTTPS**: APIs REST para integração

## 🌱 AGRONOMIA E MANEJO

### NECESSIDADES HÍDRICAS (Coeficiente de Cultura - Kc)

**Hortaliças**:
- Alface: Kc = 0.7-1.0 (ciclo 60-80 dias)
- Tomate: Kc = 0.6-1.15 (ciclo 90-150 dias)
- Pimentão: Kc = 0.6-1.05 (ciclo 120-150 dias)
- Brócolis: Kc = 0.7-1.05 (ciclo 90-120 dias)

**Frutíferas**:
- Café: Kc = 0.9-1.0 (anual)
- Citros: Kc = 0.7-0.85 (anual)
- Banana: Kc = 0.9-1.1 (anual)
- Manga: Kc = 0.6-1.0 (varia com fase)

**Grãos**:
- Milho: Kc = 0.4-1.2 (ciclo 120-150 dias)
- Soja: Kc = 0.4-1.15 (ciclo 110-150 dias)
- Feijão: Kc = 0.4-1.05 (ciclo 75-100 dias)

### EVAPOTRANSPIRAÇÃO

**Fórmula de Penman-Monteith (ETo)**:
- ETo = evapotranspiração de referência (mm/dia)
- Fatores: Radiação solar, temperatura, umidade, vento
- Brasil: ETo médio = 3-6 mm/dia (varia por região)

**Evapotranspiração da Cultura (ETc)**:
- **ETc = ETo × Kc**
- Exemplo: ETo = 5 mm/dia, Kc tomate = 1.15
- ETc = 5 × 1.15 = 5.75 mm/dia

### LÂMINA DE IRRIGAÇÃO

**Fórmula básica**:
- **L = ETc × KL / Ea**
- L = lâmina bruta (mm)
- ETc = evapotranspiração da cultura (mm/dia)
- KL = fator de localização (gotejamento: 0.3-0.5, aspersão: 1.0)
- Ea = eficiência de aplicação (0.7-0.95)

**Exemplo prático**:
- Cultura: Tomate (Kc = 1.1)
- ETo: 5 mm/dia
- Sistema: Gotejamento (Ea = 0.9, KL = 0.4)
- ETc = 5 × 1.1 = 5.5 mm/dia
- L = 5.5 × 0.4 / 0.9 = 2.44 mm/dia

### FREQUÊNCIA DE IRRIGAÇÃO

**Textura do solo**:
- **Arenoso**: Irrigar diariamente (baixa retenção)
- **Médio**: Irrigar a cada 2-3 dias
- **Argiloso**: Irrigar a cada 4-7 dias (alta retenção)

**Capacidade de campo vs Ponto de murcha**:
- Capacidade de campo: -33 kPa (solo após drenagem)
- Ponto de murcha: -1500 kPa (planta murcha)
- Água disponível = Cap. campo - Pt. murcha

## 💰 ECONOMIA E EFICIÊNCIA

### CUSTOS OPERACIONAIS
- **Água**: R$ 2,50-5,00/m³ (varia por região)
- **Energia**: R$ 0,50-0,90/kWh (varia horário)
- **Manutenção**: 20-30% do investimento inicial (anual)

### ECONOMIA DE ENERGIA
- **Horário fora ponta**: 21h-18h (60% mais barato)
- **Bombas de alta eficiência**: Economia 15-30%
- **Inversores de frequência**: Redução até 40% consumo
- **Energia solar**: Payback 4-8 anos

### PAYBACK DE SISTEMAS
- **Gotejamento**: 2-4 anos (economia água + produtividade)
- **Automação**: 1-3 anos (redução mão de obra)
- **Energia solar**: 4-8 anos (redução conta luz)

### PRODUTIVIDADE vs ÁGUA
- **Tomate**: 8-12 kg/m³ água
- **Milho**: 1-2 kg/m³ água
- **Alface**: 15-25 kg/m³ água
- **Irrigação deficitária controlada**: Economia 20-30% água sem perda produtividade

## 🔧 DIMENSIONAMENTO PRÁTICO

### PASSO A PASSO: DIMENSIONAR SISTEMA GOTEJAMENTO

1. **Levantar dados**:
   - Área: 5.000 m² (0.5 ha)
   - Cultura: Tomate
   - Espaçamento: 1m entre linhas, 0.5m entre plantas
   - Vazão gotejador: 4 L/h
   - ETo: 5 mm/dia
   - Kc: 1.1

2. **Calcular necessidade hídrica**:
   - ETc = 5 × 1.1 = 5.5 mm/dia
   - Volume = 5.5 mm × 5.000 m² = 27.500 L/dia = 27.5 m³/dia

3. **Número de gotejadores**:
   - Linhas: 5.000 m² / 1m = 5.000 m de linha
   - Gotejadores: 5.000 m / 0.5 m = 10.000 gotejadores

4. **Tempo de irrigação**:
   - Vazão total: 10.000 × 4 L/h = 40.000 L/h = 40 m³/h
   - Tempo: 27.5 m³ / 40 m³/h = 0.69 h ≈ 41 minutos/dia

5. **Vazão da bomba**:
   - Q = 40 m³/h + 15% (margem) = 46 m³/h

6. **Altura manométrica**:
   - Desnível: 10 m
   - Perdas tubulação: 5 m
   - Pressão gotejador: 10 mca
   - Total: H = 10 + 5 + 10 = 25 mca

7. **Potência da bomba**:
   - P = (46 × 25) / (270 × 0.75) = 5.7 cv
   - Escolher bomba: 7.5 cv (comercial)

# FORMATO DAS RESPOSTAS

Sempre estruture assim:

1. **Resposta direta** (1-2 linhas respondendo objetivamente)
2. **Explicação técnica** com dados numéricos
3. **Exemplo prático** com cálculos
4. **Recomendações** específicas
5. **Pergunta para aprofundar** ou oferecer ajuda adicional

Use:
- **Negrito** para conceitos-chave
- Listas numeradas para passos
- Listas com marcadores para opções
- Emojis (💧⚡🌱📊🔧) para visual
- Fórmulas quando relevante
- Valores numéricos sempre que possível

# COMPORTAMENTO

✅ SEMPRE FAÇA:
- Dê números específicos, fórmulas e exemplos
- Explique o "porquê" das recomendações
- Ofereça múltiplas soluções quando aplicável
- Pergunte detalhes se a questão for vaga
- Cite custos aproximados quando relevante
- Considere sustentabilidade e economia

❌ NUNCA FAÇA:
- Diga apenas "não sei" - sempre ofereça algo útil
- Dê respostas vagas sem números
- Ignore o contexto da AquaFlux
- Responda sobre assuntos não relacionados à agricultura/irrigação
- Seja excessivamente técnico sem explicar

# EXEMPLOS DE INTERAÇÕES

**Usuário**: "Como calcular a vazão ideal?"
**Você**: "Para calcular a **vazão ideal** do seu sistema de irrigação, precisamos considerar alguns fatores:

💧 **Cálculo da Necessidade Hídrica:**
1. Evapotranspiração da cultura (ETc) = ETo × Kc
2. Volume necessário = Área × ETc
3. Vazão = Volume / Tempo de irrigação

📊 **Exemplo prático:**
- Área: 1 hectare (10.000 m²)
- Cultura: Tomate (Kc = 1.1)
- ETo: 5 mm/dia
- ETc = 5 × 1.1 = 5.5 mm/dia
- Volume: 10.000 m² × 0.0055 m = 55 m³/dia
- Se irrigar em 6 horas: Q = 55/6 = **9.2 m³/h**

Para dimensionar melhor, preciso saber:
- Qual a área você pretende irrigar?
- Qual cultura?
- Que tipo de sistema (gotejamento, aspersão)?

Posso ajudar com o dimensionamento completo! 🌱"

Responda SEMPRE em português brasileiro, de forma técnica mas acessível.`;

        this.init();
    }

    loadUserData() {
        try {
            const userData = localStorage.getItem('aquaflux-userdata');
            if (!userData) return null;
            
            const user = JSON.parse(userData);
            console.log('👤 Usuário carregado:', user);
            
            if (!user.email) {
                console.error('❌ Email não encontrado');
                return null;
            }
            
            if (!user.uid) {
                user.uid = user.email.replace(/[.@]/g, '_');
                console.log('⚠️ UID gerado:', user.uid);
            }
            
            return user;
        } catch (error) {
            console.error('❌ Erro ao carregar userData:', error);
            return null;
        }
    }

    async init() {
        console.log('🚀 Inicializando Terra IA...');
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupUI();
            });
        } else {
            this.setupUI();
        }
    }

    async setupUI() {
        this.setupEventListeners();
        this.showWelcome();
        await this.loadConversationsFromFirebase();
        this.updateConversationsList();
        console.log('✅ Terra IA pronto!');
    }
setupEventListeners() {
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) {
        sendBtn.onclick = () => this.sendMessage();
    }

    // Botão nova conversa do rodapé
    const newChatMobile = document.getElementById('newChatMobile');
    if (newChatMobile) {
        newChatMobile.onclick = () => this.startNewChat();
    }

    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.onkeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        };

        messageInput.oninput = (e) => {
            if (sendBtn) {
                sendBtn.disabled = !e.target.value.trim();
            }
        };
    }

    const topicBtns = document.querySelectorAll('.topic-btn');
    topicBtns.forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            const topic = btn.getAttribute('data-topic');
            if (topic && messageInput) {
                messageInput.value = topic;
                this.sendMessage();
            }
        };
    });

    // NÃO chamar mais addClearHistoryButton
}



    showWelcome() {
        const welcomeScreen = document.getElementById('welcomeScreen');
        const messagesContainer = document.getElementById('messagesContainer');
        
        if (welcomeScreen && messagesContainer) {
            welcomeScreen.style.display = 'flex';
            messagesContainer.style.display = 'none';
        }
    }

    async startNewChat() {
        console.log('📝 Iniciando nova conversa...');
        
        this.currentConversationId = null;
        this.showWelcome();
        
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        
        if (messageInput) messageInput.value = '';
        if (sendBtn) sendBtn.disabled = true;
        
        this.updateConversationsList();

        setTimeout(() => {
            const initialMessage = `Olá, ${this.currentUser.nome || 'Usuário'}! 👋

Sou o Terra, seu assistente especializado em **irrigação e agricultura sustentável** da AquaFlux.

Como posso ajudá-lo hoje? Posso orientar sobre:

💧 **Sistemas de irrigação e automação**
⚡ **Seleção e dimensionamento de bombas**
🌱 **Práticas de agricultura sustentável**
📊 **Sensores e tecnologias agrícolas**
💡 **Economia de água e energia**

Qual é sua dúvida ou projeto?`;
            
            this.createNewConversationWithMessage(initialMessage);
        }, 300);
    }

    async createNewConversationWithMessage(botMessage) {
        const conversationId = 'conv_' + Date.now();
        this.currentConversationId = conversationId;

        const newConversation = {
            id: conversationId,
            title: 'Nova conversa',
            messages: [{
                role: 'assistant',
                content: botMessage,
                timestamp: new Date().toISOString()
            }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.conversations.unshift(newConversation);
        await this.saveConversationToFirebase(newConversation);
        this.showConversation();
        this.updateConversationsList();
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');

        if (!messageInput) return;

        const message = messageInput.value.trim();
        if (!message || this.isTyping) return;

        if (!this.currentConversationId) {
            await this.createNewConversationFirst();
        }

        this.addMessage('user', message);
        messageInput.value = '';
        if (sendBtn) sendBtn.disabled = true;

        this.showTypingIndicator();

        try {
            const response = await this.callGeminiAPI(message);
            this.hideTypingIndicator();
            this.addMessage('assistant', response);
            await this.saveCurrentConversation();
        } catch (error) {
            console.error('❌ Erro:', error);
            this.hideTypingIndicator();
            
            let errorMsg = 'Desculpe, ocorreu um erro. ';
            if (error.message && error.message.includes('API key not valid')) {
                errorMsg += 'A chave API do Gemini está inválida. Por favor, gere uma nova chave em https://aistudio.google.com/app/apikey 🔑';
            } else if (error.message && error.message.includes('429')) {
                errorMsg += '⏰ Limite de requisições atingido. Aguarde 1 minuto e tente novamente.';
            } else {
                errorMsg += error.message;
            }
            
            this.addMessage('assistant', errorMsg);
        }
    }

    async callGeminiAPI(userMessage) {
        const conversation = this.conversations.find(c => c.id === this.currentConversationId);
        const messages = conversation ? conversation.messages.slice(-10) : [];

        let fullPrompt = this.systemPrompt + '\n\nConversa:\n';
        messages.forEach(msg => {
            if (msg.role === 'user') fullPrompt += `Usuário: ${msg.content}\n`;
            else if (msg.role === 'assistant') fullPrompt += `Terra: ${msg.content}\n`;
        });
        fullPrompt += `\nUsuário: ${userMessage}\nTerra:`;

        try {
            console.log('🤖 Chamando Gemini 2.5 Flash...');
            
            // ✅ MODELO GEMINI-2.5-FLASH
            const response = await this.ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: fullPrompt
            });
            
            const text = response.text;
            console.log('✅ Resposta recebida!');
            return text || "Desculpe, não consegui gerar uma resposta.";
        } catch (error) {
            console.error('❌ Erro Gemini:', error);
            throw error;
        }
    }

    async createNewConversationFirst() {
        const conversationId = 'conv_' + Date.now();
        this.currentConversationId = conversationId;

        const newConversation = {
            id: conversationId,
            title: 'Nova conversa',
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.conversations.unshift(newConversation);
        this.showConversation();
        this.updateConversationsList();
    }

    addMessage(role, content) {
        const conversation = this.conversations.find(c => c.id === this.currentConversationId);
        if (!conversation) return;

        const message = {
            role,
            content,
            timestamp: new Date().toISOString()
        };

        conversation.messages.push(message);
        conversation.updatedAt = new Date().toISOString();

        if (role === 'user' && conversation.messages.filter(m => m.role === 'user').length === 1) {
            conversation.title = content.length > 50 ? content.substring(0, 50) + '...' : content;
        }

        this.renderMessage(message);
        this.scrollToBottom();
        this.updateConversationsList();
    }

    renderMessage(message) {
        const messagesContainer = document.getElementById('messagesContainer');
        if (!messagesContainer) return;

        if (messagesContainer.style.display === 'none') {
            const welcomeScreen = document.getElementById('welcomeScreen');
            if (welcomeScreen) welcomeScreen.style.display = 'none';
            messagesContainer.style.display = 'block';
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.role}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = message.role === 'user' ? 
            (this.currentUser.nome?.charAt(0).toUpperCase() || 'U') : '🌱';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = this.formatMessage(message.content);

        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = new Date(message.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        contentDiv.appendChild(timeDiv);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(messageDiv);
    }

    formatMessage(content) {
        let formatted = content.replace(/\n/g, '<br>');
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return formatted;
    }

    showTypingIndicator() {
        this.isTyping = true;
        const messagesContainer = document.getElementById('messagesContainer');
        if (!messagesContainer) return;

        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant typing-indicator';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="message-avatar">🌱</div>
            <div class="message-content">
                <div class="typing-dots">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                </div>
            </div>
        `;

        messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.isTyping = false;
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) typingIndicator.remove();
    }

    scrollToBottom() {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            setTimeout(() => {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 100);
        }
    }

    showConversation() {
        const welcomeScreen = document.getElementById('welcomeScreen');
        const messagesContainer = document.getElementById('messagesContainer');

        if (welcomeScreen) welcomeScreen.style.display = 'none';
        if (messagesContainer) {
            messagesContainer.style.display = 'block';
            messagesContainer.innerHTML = '';
        }

        const conversation = this.conversations.find(c => c.id === this.currentConversationId);
        if (conversation && conversation.messages) {
            conversation.messages.forEach(msg => this.renderMessage(msg));
        }
    }

    async saveCurrentConversation() {
        const conversation = this.conversations.find(c => c.id === this.currentConversationId);
        if (conversation) {
            console.log('💾 Salvando conversa...');
            await this.saveConversationToFirebase(conversation);
        }
    }

    async saveConversationToFirebase(conversation) {
        if (!this.currentUser || !this.currentUser.uid) {
            console.error('❌ UID não encontrado');
            return;
        }

        try {
            const conversationRef = ref(database, `conversations/${this.currentUser.uid}/${conversation.id}`);
            await set(conversationRef, conversation);
            console.log('✅ Conversa salva:', conversation.id);
        } catch (error) {
            console.error('❌ Erro ao salvar conversa:', error);
        }
    }

    async loadConversationsFromFirebase() {
        if (!this.currentUser || !this.currentUser.uid) {
            console.error('❌ UID não encontrado');
            return;
        }

        try {
            console.log('📥 Carregando conversas...');
            const conversationsRef = ref(database, `conversations/${this.currentUser.uid}`);
            const snapshot = await get(conversationsRef);

            if (snapshot.exists()) {
                const data = snapshot.val();
                this.conversations = Object.values(data).sort((a, b) => 
                    new Date(b.updatedAt) - new Date(a.updatedAt)
                );
                console.log(`✅ ${this.conversations.length} conversas carregadas`);
            } else {
                console.log('ℹ️ Nenhuma conversa encontrada');
                this.conversations = [];
            }
        } catch (error) {
            console.error('❌ Erro ao carregar conversas:', error);
            this.conversations = [];
        }
    }
updateConversationsList() {
    const conversationsList = document.getElementById('conversationsList');
    if (!conversationsList) return;

    if (this.conversations.length === 0) {
        conversationsList.innerHTML = `<p style="color: #999; padding: 20px; text-align: center; font-size: 14px">Nenhuma conversa ainda</p>`;
        return;
    }

    conversationsList.innerHTML = '';
    
    this.conversations.forEach(conversation => {
        const conversationDiv = document.createElement('div');
        conversationDiv.className = `conversation-item ${conversation.id === this.currentConversationId ? 'active' : ''}`;
        
        conversationDiv.innerHTML = `
            <div class="conversation-content">
                <div class="conversation-title">${conversation.title}</div>
                <div class="conversation-preview">${new Date(conversation.updatedAt).toLocaleDateString('pt-BR')}</div>
            </div>
            <button class="delete-conversation-btn" data-conversation-id="${conversation.id}" title="Deletar conversa">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
            </button>
        `;
        
        // Click na conversa para abrir
        conversationDiv.querySelector('.conversation-content').onclick = () => {
            this.currentConversationId = conversation.id;
            this.showConversation();
            this.updateConversationsList();
        };
        
        // Click no botão de deletar
        const deleteBtn = conversationDiv.querySelector('.delete-conversation-btn');
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            this.deleteConversation(conversation.id);
        };
        
        conversationsList.appendChild(conversationDiv);
    });
}
async deleteConversation(conversationId) {
    if (!confirm('Tem certeza que deseja deletar esta conversa? Esta ação não pode ser desfeita.')) {
        return;
    }

    try {
        // Remover do Firebase
        if (this.currentUser && this.currentUser.uid) {
            const conversationRef = ref(database, `conversations/${this.currentUser.uid}/${conversationId}`);
            await remove(conversationRef);
        }

        // Remover do array local
        this.conversations = this.conversations.filter(c => c.id !== conversationId);

        // Se era a conversa ativa, resetar
        if (this.currentConversationId === conversationId) {
            this.currentConversationId = null;
            this.showWelcome();
        }

        this.updateConversationsList();
        
        // Feedback visual
        if (window.showToast) {
            window.showToast('Conversa deletada com sucesso!', 'success');
        }
    } catch (error) {
        console.error('Erro ao deletar conversa:', error);
        if (window.showToast) {
            window.showToast('Erro ao deletar conversa.', 'error');
        }
    }
}
}

// ========== TERRA IA - FUNCIONALIDADE CORRIGIDA ==========
document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const welcomeScreen = document.getElementById('welcomeScreen');
    const messagesContainer = document.getElementById('messagesContainer');
    const chatMessages = document.getElementById('chatMessages');
    const topicButtons = document.querySelectorAll('.topic-btn');

    let isSending = false; // Flag para evitar duplicação

    // Auto-resize textarea
    if (messageInput) {
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 160) + 'px';
            
            // Habilitar/desabilitar botão
            sendBtn.disabled = !this.value.trim();
        });

        // Enviar com Enter (Shift+Enter para quebra de linha)
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (messageInput.value.trim() && !isSending) {
                    sendMessage(messageInput.value.trim());
                }
            }
        });
    }

    // Click no botão de enviar
    if (sendBtn) {
        sendBtn.addEventListener('click', () => {
            if (messageInput.value.trim() && !isSending) {
                sendMessage(messageInput.value.trim());
            }
        });
    }

    // Click nos tópicos sugeridos
    topicButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const topic = btn.dataset.topic;
            if (topic && !isSending) {
                sendMessage(topic);
            }
        });
    });

    // Função para enviar mensagem (CORRIGIDA - SEM DUPLICAÇÃO)
    function sendMessage(message) {
        if (isSending) return; // Previne duplicação
        isSending = true;

        // Esconder welcome screen
        if (welcomeScreen) {
            welcomeScreen.style.display = 'none';
        }
        
        // Mostrar container de mensagens
        if (messagesContainer) {
            messagesContainer.style.display = 'flex';
        }

        // Adicionar mensagem do usuário
        addMessage(message, 'user');

        // Limpar input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        sendBtn.disabled = true;

        // Mostrar typing indicator
        showTypingIndicator();

        // Simular resposta da IA
        setTimeout(() => {
            hideTypingIndicator();
            addMessage(getAIResponse(message), 'assistant');
            isSending = false; // Libera para nova mensagem
        }, 1500);
    }

    // Adicionar mensagem ao chat
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        messageDiv.innerHTML = `
            <div class="message-avatar"></div>
            <div class="message-content">
                <p>${text}</p>
            </div>
        `;

        messagesContainer.appendChild(messageDiv);
        
        // Scroll suave para o final
        setTimeout(() => {
            chatMessages.scrollTo({
                top: chatMessages.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    }

    // Mostrar indicador de digitação
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typingIndicator';
        
        typingDiv.innerHTML = `
            <div class="message-avatar"></div>
            <div class="message-content">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;

        messagesContainer.appendChild(typingDiv);
        
        setTimeout(() => {
            chatMessages.scrollTo({
                top: chatMessages.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    }

    // Esconder indicador de digitação
    function hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // Respostas da IA
    function getAIResponse(userMessage) {
        const responses = {
            'vazão': 'Para calcular a vazão ideal do seu sistema de irrigação, você precisa considerar: <strong>1) Área a ser irrigada</strong>, <strong>2) Tipo de cultura</strong>, <strong>3) Clima da região</strong>.<br><br>A fórmula básica é:<br><strong>Vazão (L/h) = Área (m²) × Taxa de aplicação (mm/h) × 1000</strong>',
            'horário': 'O melhor horário para irrigar é durante o <strong>amanhecer (5h-7h)</strong> ou <strong>fim da tarde (17h-19h)</strong>.<br><br>Evite irrigar durante o meio-dia, pois isso aumenta a evaporação em até 40%.<br><br>💡 <em>No AquaFlux, você pode programar horários automáticos!</em>',
            'economizar': 'Para economizar água com irrigação inteligente:<br><br><strong>1. Use sensores de umidade do solo</strong> - monitore em tempo real<br><strong>2. Irrigue nos horários corretos</strong> - menos evaporação<br><strong>3. Ajuste a vazão</strong> - conforme necessidade da cultura<br><strong>4. Monitore vazamentos</strong> - desperdício zero<br><br>💧 <em>Com irrigação inteligente, você pode reduzir o consumo em até 30%!</em>',
            'sensores': 'Os sensores essenciais para um sistema IoT de irrigação são:<br><br><strong>1. Sensor de umidade do solo</strong><br>→ Monitoramento em tempo real da necessidade hídrica<br><br><strong>2. Sensor de chuva</strong><br>→ Evita irrigação desnecessária<br><br><strong>3. Sensor de vazão</strong><br>→ Controla consumo de água<br><br>🌱 <em>O AquaFlux integra todos esses dados automaticamente!</em>'
        };

        for (const [key, response] of Object.entries(responses)) {
            if (userMessage.toLowerCase().includes(key)) {
                return response;
            }
        }

        return `Entendo sua pergunta sobre <strong>"${message}"</strong>.<br><br>Como assistente especializado em irrigação do AquaFlux, posso ajudar com:<br><br>• Cálculo de vazão<br>• Horários de irrigação<br>• Economia de água<br>• Sensores IoT<br>• Configuração de bombas<br><br>Como posso ser mais específico? 🌿`;
    }
});


console.log('🌱 Terra IA carregando...');
new TerraAIAssistant();
