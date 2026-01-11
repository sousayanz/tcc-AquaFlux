import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-check.js";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

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

window.addEventListener('DOMContentLoaded', () => {
  // ✅ DECLARAR TODAS AS VARIÁVEIS PRIMEIRO (antes de usar)
  const form = document.getElementById('cadastroForm');
  const msg = document.getElementById('msg');
  const submitBtn = document.getElementById('submitBtn');
  const acceptTerms = document.getElementById('acceptTerms');
  const tipoPessoal = document.getElementById('tipoPessoal');
  const tipoProfissional = document.getElementById('tipoProfissional');
  const documentoInput = document.getElementById('documento');

  // ✅ AGORA SIM podemos usar submitBtn
  // Controle de termos - inicia desabilitado e habilita ao aceitar
  if (submitBtn) {
    submitBtn.disabled = true;
  }

  if (acceptTerms) {
    acceptTerms.addEventListener('change', () => {
      submitBtn.disabled = !acceptTerms.checked;
    });
  }

  // Alternar tipo de cadastro
  if (tipoPessoal) {
    tipoPessoal.addEventListener('click', () => {
      tipoPessoal.classList.add('active');
      tipoProfissional.classList.remove('active');
      documentoInput.placeholder = 'Digite seu CPF';
    });
  }

  if (tipoProfissional) {
    tipoProfissional.addEventListener('click', () => {
      tipoProfissional.classList.add('active');
      tipoPessoal.classList.remove('active');
      documentoInput.placeholder = 'Digite seu CNPJ';
    });
  }

  // Máscara para CPF/CNPJ
  if (documentoInput) {
    documentoInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (tipoPessoal.classList.contains('active')) {
        if (value.length <= 11) {
          value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
          value = value.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
          value = value.replace(/(\d{3})(\d{3})/, '$1.$2');
        }
      } else {
        if (value.length <= 14) {
          value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
          value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, '$1.$2.$3/$4');
          value = value.replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3');
          value = value.replace(/(\d{2})(\d{3})/, '$1.$2');
        }
      }
      e.target.value = value;
    });
  }

  // Máscara para telefone
  const telefoneInput = document.getElementById('telefone');
  if (telefoneInput) {
    telefoneInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      value = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
      e.target.value = value;
    });
  }

  // Funções de validação
  function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
    let resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;
    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
    resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpf.charAt(10));
  }

  function validarCNPJ(cnpj) {
    cnpj = cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
    let t = cnpj.length - 2,
      d = cnpj.substring(t),
      d1 = parseInt(d.charAt(0)),
      d2 = parseInt(d.charAt(1));
    let calc = x => {
      let n = cnpj.substring(0, x),
        y = x - 7,
        s = 0;
      for (let i = x; i >= 1; i--) {
        s += parseInt(n.charAt(x - i)) * y--;
        if (y < 2) y = 9;
      }
      let r = 11 - (s % 11);
      return r > 9 ? 0 : r;
    };
    return calc(t) === d1 && calc(t + 1) === d2;
  }

  function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  function validarTelefone(numeros) {
    return numeros.length === 10 || numeros.length === 11;
  }

  function senhaForte(senha) {
    const regex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;
    return regex.test(senha);
  }

  // Evento de envio do formulário
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Verificar se os termos foram aceitos
      if (!acceptTerms || !acceptTerms.checked) {
        showNotification('Você precisa aceitar os Termos de Uso para continuar.', 'error');
        return;
      }

      const nome = document.getElementById('nome').value.trim();
      const documento = document.getElementById('documento').value.trim();
      const email = document.getElementById('email').value.trim();
      const telefone = document.getElementById('telefone').value.trim();
      const senha = document.getElementById('senha').value.trim();
      const tipoCadastro = tipoPessoal.classList.contains('active') ? 'pessoal' : 'profissional';

      // Validações básicas
      if (!nome || !documento || !email || !telefone || !senha) {
        showNotification('Preencha todos os campos!', 'error');
        return;
      }

      if (!validarEmail(email)) {
        showNotification('Formato de e-mail inválido!', 'error');
        return;
      }

      if (senha.length < 6) {
        showNotification('A senha deve ter pelo menos 6 caracteres!', 'error');
        return;
      }

      if (!senhaForte(senha)) {
        showNotification('A senha deve conter pelo menos 1 letra maiúscula, 1 número e 1 caractere especial!', 'error');
        return;
      }

      const docNumbers = documento.replace(/\D/g, '');
      const phoneNumbers = telefone.replace(/\D/g, '');

      // Validar CPF/CNPJ
      if (tipoCadastro === 'pessoal') {
        if (docNumbers.length !== 11) {
          showNotification('CPF deve conter 11 dígitos!', 'error');
          return;
        }
        if (!validarCPF(docNumbers)) {
          showNotification('CPF inválido!', 'error');
          return;
        }
      } else {
        if (docNumbers.length !== 14) {
          showNotification('CNPJ deve conter 14 dígitos!', 'error');
          return;
        }
        if (!validarCNPJ(docNumbers)) {
          showNotification('CNPJ inválido!', 'error');
          return;
        }
      }

      if (!validarTelefone(phoneNumbers)) {
        showNotification('Telefone inválido!', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Cadastrando...';

      try {
        // PASSO 1: Verificar CPF/CNPJ duplicado ANTES de criar usuário no Auth
        const allUsersRef = ref(database, 'users');
        const allUsersSnapshot = await get(allUsersRef);

        if (allUsersSnapshot.exists()) {
          const users = allUsersSnapshot.val();
          for (const key in users) {
            if (users[key].documento === docNumbers) {
              showNotification('CPF/CNPJ já cadastrado!', 'error');
              submitBtn.disabled = !acceptTerms.checked;
              submitBtn.innerHTML = 'Cadastrar';
              return;
            }
          }
        }

        // PASSO 2: Criar usuário no Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        const userUid = userCredential.user.uid;

        // PASSO 3: Enviar e-mail de verificação
        try {
          await sendEmailVerification(userCredential.user);
          console.log('E-mail de verificação enviado com sucesso');
        } catch (emailError) {
          console.error('Erro ao enviar e-mail de verificação:', emailError);
          showNotification('Conta criada, mas houve um problema ao enviar o e-mail de verificação. Tente reenviá-lo mais tarde.', 'warning');
        }

        // PASSO 4: Salvar dados extras no Realtime Database
        await set(ref(database, 'users/' + userUid), {
          nome,
          documento: docNumbers,
          email,
          telefone: phoneNumbers,
          tipoCadastro,
          dataCadastro: new Date().toISOString(),
          ativo: true
        });

        showNotification('Cadastro realizado com sucesso! Enviamos um e-mail de verificação.', 'success');

        // Mostrar overlay com instruções
        const overlay = document.getElementById('emailVerifyOverlay');
        const goToLoginBtn = document.getElementById('goToLoginBtn');

        if (overlay) {
          overlay.style.display = 'flex';
        }

        if (goToLoginBtn) {
          goToLoginBtn.onclick = () => {
            window.location.href = 'login.html';
          };
        }

      } catch (error) {
        console.error('Erro ao cadastrar:', error);

        // Mensagens de erro mais específicas
        let errorMessage = 'Erro ao cadastrar: ';
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'Este e-mail já está cadastrado!';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'E-mail inválido!';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'Senha muito fraca!';
        } else if (error.code === 'auth/network-request-failed') {
          errorMessage = 'Erro de conexão. Verifique sua internet.';
        } else {
          errorMessage += error.message;
        }

        showNotification(errorMessage, 'error');
      } finally {
        submitBtn.disabled = !acceptTerms.checked;
        submitBtn.innerHTML = 'Cadastrar';
      }
    });
  }

  function showNotification(text, type) {
    const msg = document.getElementById('msg');
    if (msg) {
        msg.textContent = text;
        msg.className = `msg ${type}`;
        msg.style.display = 'block';
        setTimeout(() => {
            msg.style.display = 'none';
        }, 5000);
    }
}

});

/*/<script>
// Coloque em um arquivo js comum, ex: transition.js, e chame em todas as páginas

function showWaveTransition(reverse, callback) {
  const el = document.getElementById('waveTransition');
  el.style.display = 'block';
  el.classList.remove('show','reverse');
  setTimeout(() => {
    el.classList.add(reverse ? 'reverse' : 'show');
    setTimeout(() => { callback && callback(); }, 780);
  }, 10);
}

document.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', e => {
    if (link.target === '_blank' || !link.href || link.href[0] === '#') return;
    e.preventDefault();
    // Decide direção: se indo para login.html, use 'reverse', se indo para cadastro.html, use 'show'
    const reverse = link.href.includes('login.html');
    showWaveTransition(reverse, () => window.location.href = link.href);
  });
});

window.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('visible');

  // Máscara para documento (movido para dentro do DOMContentLoaded)
  const docInput = document.getElementById('documento');
  if (docInput) {
    docInput.addEventListener('input', function(e) {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 11) {
        v = v.slice(0, 11);
      }

      if (v.length > 9) {
        v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
      } else if (v.length > 6) {
        v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
      } else if (v.length > 3) {
        v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
      }

      e.target.value = v;
    });
  }
});



document.getElementById('documento').addEventListener('input', function(e) {
  let v = e.target.value.replace(/\D/g, ''); // remove tudo que não for número
  if (v.length > 11) {
    v = v.slice(0, 11);
  }
  
  if (v.length > 9) {
    v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
  } else if (v.length > 6) {
    v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
  } else if (v.length > 3) {
    v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
  }
  
  e.target.value = v;
});






</script>/*/