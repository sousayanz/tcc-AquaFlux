

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-check.js";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";


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


const app = initializeApp(firebaseConfig);
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6LdmsvsrAAAAAKsOGim9zoPQxWCs6GxdEupSHelo'),
  isTokenAutoRefreshEnabled: true
});


const database = getDatabase(app);
const auth = getAuth(app);


// Aguardar DOM carregar
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const msg = document.getElementById('msg');
  const submitBtn = document.getElementById('submitBtn');
  
  // ELEMENTOS DO MODAL DE RECUPERAÇÃO
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const resetPasswordModal = document.getElementById('resetPasswordModal');
  const closeModal = document.getElementById('closeModal');
  const resetPasswordForm = document.getElementById('resetPasswordForm');
  const resetMsg = document.getElementById('resetMsg');
  const resetBtn = document.getElementById('resetBtn');
  const instructions = document.getElementById('instructions');


  // ABRIR MODAL DE RECUPERAÇÃO
  if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener('click', (e) => {
          e.preventDefault();
          resetPasswordModal.classList.add('active');
          document.getElementById('resetEmail').value = '';
          resetMsg.style.display = 'none';
          instructions.classList.remove('show');
      });
  }


  // FECHAR MODAL
  if (closeModal) {
      closeModal.addEventListener('click', () => {
          resetPasswordModal.classList.remove('active');
      });
  }


  // FECHAR MODAL CLICANDO FORA
  if (resetPasswordModal) {
      resetPasswordModal.addEventListener('click', (e) => {
          if (e.target === resetPasswordModal) {
              resetPasswordModal.classList.remove('active');
          }
      });
  }


  // RECUPERAÇÃO DE SENHA
  if (resetPasswordForm) {
      resetPasswordForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const email = document.getElementById('resetEmail').value.trim();


          if (!email) {
              showResetMessage('Por favor, digite seu e-mail!', 'error');
              return;
          }


          // Validação básica de e-mail
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
              showResetMessage('Por favor, digite um e-mail válido!', 'error');
              return;
          }


          resetBtn.disabled = true;
          resetBtn.innerHTML = 'Enviando...';
          instructions.classList.remove('show');


          try {
              // Enviar e-mail de recuperação via Firebase Auth
              await sendPasswordResetEmail(auth, email);
              
              console.log('E-mail de recuperação enviado para:', email);
              
              showResetMessage('E-mail de recuperação enviado com sucesso!', 'success');
              
              // Mostrar instruções
              setTimeout(() => {
                  instructions.classList.add('show');
              }, 500);


          } catch (error) {
              console.error('Erro ao enviar e-mail de recuperação:', error);
              
              let errorMsg = 'Erro ao enviar e-mail. Tente novamente.';
              
              if (error.code === 'auth/user-not-found') {
                  errorMsg = 'E-mail não cadastrado no sistema.';
              } else if (error.code === 'auth/invalid-email') {
                  errorMsg = 'E-mail inválido.';
              } else if (error.code === 'auth/too-many-requests') {
                  errorMsg = 'Muitas tentativas. Aguarde alguns minutos.';
              } else if (error.code === 'auth/network-request-failed') {
                  errorMsg = 'Erro de conexão. Verifique sua internet.';
              }
              
              showResetMessage(errorMsg, 'error');
          } finally {
              resetBtn.disabled = false;
              resetBtn.innerHTML = 'Enviar Link de Recuperação';
          }
      });
  }


  // FUNÇÃO PARA MOSTRAR MENSAGENS NO MODAL
  function showResetMessage(text, type) {
      resetMsg.innerHTML = `<div class="msg-${type}">${text}</div>`;
      resetMsg.style.display = 'block';
      
      setTimeout(() => {
          if (type === 'error') {
              resetMsg.style.display = 'none';
          }
      }, 5000);
  }


  // VERIFICAR SE JÁ ESTÁ LOGADO - usar chave 'aquaflux_user_data'
  const currentUser = localStorage.getItem('aquaflux-userdata');
  if (currentUser) {
    try {
      const userData = JSON.parse(currentUser);
      if (userData && userData.nome && userData.email) {
        console.log('Usuário já logado, redirecionando...');
        redirectToHome();
        return;
      }
    } catch (error) {
      // Se houver erro ao parsear, limpar dados corrompidos
      localStorage.removeItem('aquaflux-userdata');
    }
  }


  form.addEventListener('submit', async (e) => {
    e.preventDefault();


    const usuario = document.getElementById('usuario').value.trim();
    const senha = document.getElementById('senha').value.trim();


    if (!usuario || !senha) {
      showNotification('Preencha todos os campos!', 'error');
      return;
    }


    // VALIDAÇÃO: APENAS CPF OU CNPJ
    const cleanInputDocumento = usuario.replace(/\D/g, '');
    if (cleanInputDocumento.length !== 11 && cleanInputDocumento.length !== 14) {
      showNotification('Digite um CPF (11 dígitos) ou CNPJ (14 dígitos) válido!', 'error');
      return;
    }


    // Validar formato básico para evitar sequências iguais
    if (/^(\d)\1+$/.test(cleanInputDocumento)) {
      showNotification('CPF/CNPJ inválido! Não é possível ter todos os dígitos iguais.', 'error');
      return;
    }


    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Entrando...';


    try {
      console.log('Iniciando processo de login (busca por CPF/CNPJ)...');


      const allUsersRef = ref(database, 'users');
      const snapshot = await get(allUsersRef);


      if (!snapshot.exists()) {
        showNotification('Nenhum usuário encontrado no sistema!', 'error');
        return;
      }


      const users = snapshot.val();
      let userFound = null;
      let userId = null;
      let emailFound = null;


      console.log('Buscando usuário por CPF/CNPJ...');


      // BUSCAR APENAS POR CPF OU CNPJ
      for (const key in users) {
        const user = users[key];
        const cleanDocumento = user.documento ? user.documento.replace(/\D/g, '') : '';


        if (cleanDocumento === cleanInputDocumento && cleanInputDocumento.length > 0) {
          userFound = user;
          userId = key; // aqui é o UID salvo no cadastro
          emailFound = user.email;
          console.log('Usuário encontrado:', user.nome, 'UID:', userId);
          break;
        }
      }


      if (!userFound || !emailFound) {
        showNotification('CPF/CNPJ não encontrado no sistema!', 'error');
        return;
      }


      // Autenticar com Firebase Auth usando o e-mail vinculado e a senha digitada
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, emailFound, senha);
      } catch (authError) {
        console.error('Erro de autenticação do Firebase Auth:', authError);


        let errorMsg = 'Senha incorreta.';
        if (authError.code === 'auth/wrong-password') {
          errorMsg = 'Senha incorreta.';
        } else if (authError.code === 'auth/too-many-requests') {
          errorMsg = 'Muitas tentativas. Aguarde alguns minutos.';
        } else if (authError.code === 'auth/network-request-failed') {
          errorMsg = 'Erro de conexão. Verifique sua internet.';
        }


        showNotification(errorMsg, 'error');
        return;
      }


      // BLOQUEAR LOGIN SE E-MAIL NÃO VERIFICADO
      if (!userCredential.user.emailVerified) {
        showNotification('Você precisa verificar seu e-mail antes de fazer login! Verifique sua caixa de entrada e spam.', 'error');
        // Deslogar o usuário
        await auth.signOut();
        return;
      }


      if (!userFound.ativo) {
        showNotification('Conta desativada. Entre em contato com o suporte.', 'error');
        return;
      }


      // ATUALIZAR CONTADOR DE LOGIN NO FIREBASE ANTES DE SALVAR LOCALMENTE
      const userRef = ref(database, 'users/' + userId);
      const currentLogins = userFound.totalLogins || 0;
      await update(userRef, {
        totalLogins: currentLogins + 1,
        ultimoLogin: new Date().toISOString()
      });


      console.log('Login bem-sucedido! Contador atualizado:', currentLogins + 1);
      showNotification('Login realizado com sucesso! Redirecionando...', 'success');


      // SALVAR COM CHAVE ÚNICA E CONSISTENTE
      const userData = {
        nome: userFound.nome,
        email: emailFound,
        documento: userFound.documento,
        telefone: userFound.telefone,
        tipoCadastro: userFound.tipoCadastro,
        userId: userId, // UID do Auth usado como chave em /users
        loginTime: new Date().toISOString(),
        isLoggedIn: true
      };


 localStorage.setItem('aquaflux-userdata', JSON.stringify(userData));
console.log('✅ Sessão salva com chave aquaflux-userdata:', userData);



      setTimeout(() => {
        redirectToHome();
      }, 1000);


    } catch (error) {
      console.error('Erro no login:', error);
      showNotification('Erro ao fazer login: ' + error.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Entrar';
    }
  });


  function showNotification(text, type) {
    msg.innerHTML = `<div class="alert ${type}">${text}</div>`;
    if (type === 'error') {
      setTimeout(() => {
        msg.innerHTML = '';
      }, 5000);
    }
  }


  function redirectToHome() {
    console.log('Redirecionando para dashboard.html...');
    window.location.href = 'dashboard.html';
  }
});
