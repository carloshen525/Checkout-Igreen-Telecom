/**
 * iGreen Telecom - Checkout Inteligente de Portabilidade
 * Experiência em 2 Fases (Estilo App Fintech / Telecom)
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. CONFIGURAÇÕES GERAIS
  // =========================================================================
  // Altere para o WhatsApp oficial de atendimento (DDI 55 + DDD + Número)
  const WHATSAPP_PHONE = '553598754516';

  // =========================================================================
  // 2. INTEGRAÇÃO META ADS (META PIXEL ID: 1787930898999589)
  // =========================================================================
  let viewContentTracked = false;
  let initiateCheckoutTracked = false;

  function trackMetaEvent(eventName, params = {}) {
    if (typeof window.fbq === 'function') {
      try {
        window.fbq('track', eventName, params);
        console.log(`[Meta Pixel] Evento: ${eventName}`, params);
      } catch (e) {
        console.warn(`[Meta Pixel] Erro ao disparar ${eventName}:`, e);
      }
    }
  }

  // Disparo automático de ViewContent na visualização da oferta inicial
  function trackViewContent() {
    if (!viewContentTracked) {
      viewContentTracked = true;
      trackMetaEvent('ViewContent', {
        content_name: 'Portabilidade iGreen Telecom',
        content_category: 'Telecom'
      });
    }
  }

  // Disparo de InitiateCheckout ao clicar em "Começar minha portabilidade"
  function trackInitiateCheckout() {
    if (!initiateCheckoutTracked) {
      initiateCheckoutTracked = true;
      trackMetaEvent('InitiateCheckout', {
        content_name: 'Portabilidade iGreen Telecom'
      });
    }
  }

  // =========================================================================
  // 3. ESTADO DO FORMULÁRIO E DADOS
  // =========================================================================
  const formData = {
    numeroAtual: '',
    operadoraAtual: '',
    tipoChip: 'Chip Físico',
    nomeCompleto: '',
    email: '',
    cep: '',
    logradouro: '',
    numeroResidencial: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    cpf: ''
  };

  let currentStep = 1; // 1 to 6 or 'success'

  // Elementos do DOM
  const phaseOffer = document.getElementById('phaseOffer');
  const phaseCheckout = document.getElementById('phaseCheckout');
  const btnStartCheckout = document.getElementById('btnStartCheckout');
  const btnStepBack = document.getElementById('btnStepBack');
  const stepCounterText = document.getElementById('stepCounterText');
  const appProgressFill = document.getElementById('appProgressFill');

  // =========================================================================
  // 4. TRANSIÇÃO ENTRE FASE 1 (OFERTA) E FASE 2 (CHECKOUT APP)
  // =========================================================================
  function enterCheckoutPhase() {
    trackInitiateCheckout();

    // Anima saída da Fase 1
    phaseOffer.classList.add('is-hidden');

    // Ativa Fase 2 (Checkout App Fullscreen 100dvh)
    phaseCheckout.classList.add('is-visible');
    phaseCheckout.setAttribute('aria-hidden', 'false');

    // Inicia no passo 1 com foco imediato
    goToStep(1);
  }

  function returnToOfferPhase() {
    phaseCheckout.classList.remove('is-visible');
    phaseCheckout.setAttribute('aria-hidden', 'true');
    phaseOffer.classList.remove('is-hidden');
  }

  // =========================================================================
  // 5. MÁSCARAS DE ENTRADA (TELEFONE, CEP, CPF)
  // =========================================================================
  function maskPhone(val) {
    let digits = val.replace(/\D/g, '').substring(0, 11);
    if (digits.length > 10) {
      return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    } else if (digits.length > 6) {
      return digits.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
    } else if (digits.length > 2) {
      return digits.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
    } else if (digits.length > 0) {
      return digits.replace(/^(\d*)$/, '($1');
    }
    return '';
  }

  function maskCEP(val) {
    let digits = val.replace(/\D/g, '').substring(0, 8);
    return digits.replace(/^(\d{5})(\d{1,3})$/, '$1-$2');
  }

  function maskCPF(val) {
    let digits = val.replace(/\D/g, '').substring(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  function setupInputMasks() {
    const telInput = document.getElementById('numeroAtual');
    const cepInput = document.getElementById('cep');
    const cpfInput = document.getElementById('cpf');

    if (telInput) {
      telInput.addEventListener('input', (e) => {
        e.target.value = maskPhone(e.target.value);
        clearError('numeroAtual');
      });
    }

    if (cepInput) {
      cepInput.addEventListener('input', (e) => {
        e.target.value = maskCEP(e.target.value);
        clearError('cep');
        const digits = e.target.value.replace(/\D/g, '');
        if (digits.length === 8) {
          fetchViaCEP(digits);
        }
      });
    }

    if (cpfInput) {
      cpfInput.addEventListener('input', (e) => {
        e.target.value = maskCPF(e.target.value);
        clearError('cpf');
      });
    }

    // Limpeza de erros em outros inputs
    document.querySelectorAll('.app-input').forEach((input) => {
      input.addEventListener('input', () => {
        clearError(input.id);
      });
    });
  }

  // =========================================================================
  // 6. VALIDAÇÕES REAIS (CPF, TELEFONE, EMAIL)
  // =========================================================================
  function validateCPF(cpfStr) {
    const clean = cpfStr.replace(/\D/g, '');
    if (clean.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(clean)) return false;

    let sum = 0;
    let rest;
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(clean.substring(i - 1, i), 10) * (11 - i);
    }
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(clean.substring(9, 10), 10)) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(clean.substring(i - 1, i), 10) * (12 - i);
    }
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(clean.substring(10, 11), 10)) return false;

    return true;
  }

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).trim().toLowerCase());
  }

  function validatePhone(phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 11) return false;
    const ddd = parseInt(digits.substring(0, 2), 10);
    return ddd >= 11 && ddd <= 99;
  }

  function showError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const msgEl = document.getElementById(`err-${fieldId}`);
    if (input) input.classList.add('is-invalid');
    if (msgEl) {
      msgEl.textContent = message;
      msgEl.classList.add('visible');
    }
  }

  function clearError(fieldId) {
    const input = document.getElementById(fieldId);
    const msgEl = document.getElementById(`err-${fieldId}`);
    if (input) input.classList.remove('is-invalid');
    if (msgEl) {
      msgEl.textContent = '';
      msgEl.classList.remove('visible');
    }
  }

  // =========================================================================
  // 7. BUSCA AUTOMÁTICA DE CEP (VIACEP)
  // =========================================================================
  async function fetchViaCEP(cepDigits) {
    const spinner = document.getElementById('cepSpinner');
    const hint = document.getElementById('cepHint');
    const logradouroInput = document.getElementById('logradouro');
    const bairroInput = document.getElementById('bairro');
    const cidadeInput = document.getElementById('cidade');
    const ufInput = document.getElementById('uf');
    const numeroInput = document.getElementById('numeroResidencial');

    if (spinner) spinner.style.display = 'block';
    if (hint) hint.textContent = 'Localizando endereço...';

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await response.json();

      if (data.erro) {
        if (hint) hint.textContent = 'CEP não encontrado. Preencha os dados abaixo:';
        return;
      }

      if (logradouroInput && data.logradouro) {
        logradouroInput.value = data.logradouro;
        clearError('logradouro');
      }
      if (bairroInput && data.bairro) {
        bairroInput.value = data.bairro;
        clearError('bairro');
      }
      if (cidadeInput && data.localidade) {
        cidadeInput.value = data.localidade;
        clearError('cidade');
      }
      if (ufInput && data.uf) {
        ufInput.value = data.uf;
        clearError('uf');
      }

      if (hint) hint.textContent = 'Endereço encontrado! Agora informe o número da residência.';
      if (numeroInput) numeroInput.focus();

    } catch (err) {
      console.warn('Falha ao buscar CEP:', err);
      if (hint) hint.textContent = 'Preencha o endereço nos campos abaixo:';
    } finally {
      if (spinner) spinner.style.display = 'none';
    }
  }

  // =========================================================================
  // 8. CONTROLE DOS CHIPS E SELETORES
  // =========================================================================
  function setupInteractiveOptions() {
    // Chips de operadora rápida (Etapa 2)
    const chips = document.querySelectorAll('.chip-btn');
    const operadoraInput = document.getElementById('operadoraAtual');

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => c.classList.remove('selected'));
        chip.classList.add('selected');
        const carrier = chip.getAttribute('data-carrier');

        if (carrier === 'Outra') {
          operadoraInput.value = '';
          operadoraInput.focus();
        } else {
          operadoraInput.value = carrier;
        }
        clearError('operadoraAtual');
      });
    });

    operadoraInput.addEventListener('input', () => {
      const typed = operadoraInput.value.trim().toLowerCase();
      chips.forEach((c) => {
        if (c.getAttribute('data-carrier').toLowerCase() === typed) {
          c.classList.add('selected');
        } else {
          c.classList.remove('selected');
        }
      });
    });

    // Cards de opção de chip: eSIM vs Físico (Etapa 3)
    const radioCards = document.querySelectorAll('.card-radio-item');
    radioCards.forEach((card) => {
      const radio = card.querySelector('input[type="radio"]');
      card.addEventListener('click', () => {
        radioCards.forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        if (radio) {
          radio.checked = true;
          formData.tipoChip = radio.value;
        }
      });
    });
  }

  // =========================================================================
  // 9. VALIDAÇÃO INDIVIDUAL DE CADA ETAPA
  // =========================================================================
  function validateStep(stepNum) {
    let isValid = true;
    let fieldToFocus = null;

    if (stepNum === 1) {
      const input = document.getElementById('numeroAtual');
      if (!validatePhone(input.value)) {
        showError('numeroAtual', 'Informe um número com DDD válido (Ex: 11 99999-9999).');
        isValid = false;
        fieldToFocus = input;
      } else {
        formData.numeroAtual = input.value.trim();
      }
    }

    else if (stepNum === 2) {
      const input = document.getElementById('operadoraAtual');
      if (input.value.trim().length < 2) {
        showError('operadoraAtual', 'Informe o nome da sua operadora atual.');
        isValid = false;
        fieldToFocus = input;
      } else {
        formData.operadoraAtual = input.value.trim();
      }
    }

    else if (stepNum === 3) {
      const radio = document.querySelector('input[name="tipoChip"]:checked');
      if (radio) {
        formData.tipoChip = radio.value;
      }
    }

    else if (stepNum === 4) {
      const nomeInput = document.getElementById('nomeCompleto');
      const emailInput = document.getElementById('email');

      const parts = nomeInput.value.trim().split(/\s+/);
      if (parts.length < 2 || parts[1].length < 2) {
        showError('nomeCompleto', 'Informe seu nome e sobrenome completos.');
        isValid = false;
        if (!fieldToFocus) fieldToFocus = nomeInput;
      } else {
        formData.nomeCompleto = nomeInput.value.trim();
      }

      if (!validateEmail(emailInput.value)) {
        showError('email', 'Informe um endereço de e-mail válido.');
        isValid = false;
        if (!fieldToFocus) fieldToFocus = emailInput;
      } else {
        formData.email = emailInput.value.trim();
      }
    }

    else if (stepNum === 5) {
      const cepInput = document.getElementById('cep');
      const logradouroInput = document.getElementById('logradouro');
      const numeroInput = document.getElementById('numeroResidencial');
      const complementoInput = document.getElementById('complemento');
      const bairroInput = document.getElementById('bairro');
      const cidadeInput = document.getElementById('cidade');
      const ufInput = document.getElementById('uf');

      if (cepInput.value.replace(/\D/g, '').length !== 8) {
        showError('cep', 'Informe um CEP válido com 8 dígitos.');
        isValid = false;
        if (!fieldToFocus) fieldToFocus = cepInput;
      } else {
        formData.cep = cepInput.value.trim();
      }

      if (logradouroInput.value.trim().length < 3) {
        showError('logradouro', 'Informe a rua / logradouro.');
        isValid = false;
        if (!fieldToFocus) fieldToFocus = logradouroInput;
      } else {
        formData.logradouro = logradouroInput.value.trim();
      }

      if (numeroInput.value.trim().length === 0) {
        showError('numeroResidencial', 'Informe o número.');
        isValid = false;
        if (!fieldToFocus) fieldToFocus = numeroInput;
      } else {
        formData.numeroResidencial = numeroInput.value.trim();
      }

      if (bairroInput.value.trim().length < 2) {
        showError('bairro', 'Informe o bairro.');
        isValid = false;
        if (!fieldToFocus) fieldToFocus = bairroInput;
      } else {
        formData.bairro = bairroInput.value.trim();
      }

      if (cidadeInput.value.trim().length < 2) {
        showError('cidade', 'Informe a cidade.');
        isValid = false;
        if (!fieldToFocus) fieldToFocus = cidadeInput;
      } else {
        formData.cidade = cidadeInput.value.trim();
      }

      if (ufInput.value.trim().length < 2) {
        showError('uf', 'UF.');
        isValid = false;
        if (!fieldToFocus) fieldToFocus = ufInput;
      } else {
        formData.uf = ufInput.value.trim().toUpperCase();
      }

      formData.complemento = complementoInput ? complementoInput.value.trim() : '';
    }

    else if (stepNum === 6) {
      const cpfInput = document.getElementById('cpf');
      if (!validateCPF(cpfInput.value)) {
        showError('cpf', 'CPF inválido. Verifique os números digitados.');
        isValid = false;
        fieldToFocus = cpfInput;
      } else {
        formData.cpf = cpfInput.value.trim();
      }
    }

    if (!isValid && fieldToFocus) {
      fieldToFocus.focus();
    }

    return isValid;
  }

  // =========================================================================
  // 10. TRANSIÇÃO DE TELAS NO CHECKOUT (1 a 6 e TELA DE SUCESSO)
  // =========================================================================
  function goToStep(target) {
    const allSteps = document.querySelectorAll('.checkout-step');
    allSteps.forEach((s) => s.classList.remove('active'));

    if (target === 'success') {
      currentStep = 'success';
      const successStep = document.getElementById('appStepSuccess');
      if (successStep) successStep.classList.add('active');

      stepCounterText.textContent = 'Confirmação Final';
      appProgressFill.style.width = '100%';

      populateSummaryBox();
    } else {
      const num = parseInt(target, 10);
      currentStep = num;
      const targetStep = document.getElementById(`appStep${num}`);
      if (targetStep) targetStep.classList.add('active');

      // Atualiza contador e barra de progresso
      const progressPercentage = Math.round((num / 6) * 100);
      stepCounterText.textContent = `Etapa ${num} de 6`;
      appProgressFill.style.width = `${progressPercentage}%`;

      // Autofoco inteligente no primeiro input disponível
      setTimeout(() => {
        const input = targetStep.querySelector('input:not([type="radio"])');
        if (input) input.focus();
      }, 150);
    }
  }

  function populateSummaryBox() {
    const sumNumero = document.getElementById('sumNumero');
    const sumOperadora = document.getElementById('sumOperadora');
    const sumChip = document.getElementById('sumChip');
    const sumNome = document.getElementById('sumNome');
    const sumCpf = document.getElementById('sumCpf');
    const sumCidadeUf = document.getElementById('sumCidadeUf');

    if (sumNumero) sumNumero.textContent = formData.numeroAtual || '-';
    if (sumOperadora) sumOperadora.textContent = formData.operadoraAtual || '-';
    if (sumChip) sumChip.textContent = formData.tipoChip || '-';
    if (sumNome) sumNome.textContent = formData.nomeCompleto || '-';
    if (sumCpf) sumCpf.textContent = formData.cpf || '-';
    if (sumCidadeUf) sumCidadeUf.textContent = `${formData.cidade}/${formData.uf}` || '-';
  }

  // =========================================================================
  // 11. GESTÃO DOS BOTÕES DE NAVEGAÇÃO E TECLADO ENTER
  // =========================================================================
  function setupNavigationControls() {
    // Botão "Começar minha portabilidade" (Fase 1 -> Fase 2)
    if (btnStartCheckout) {
      btnStartCheckout.addEventListener('click', enterCheckoutPhase);
    }

    // Botões "Continuar" de cada etapa
    const continueButtons = document.querySelectorAll('.btn-step-continue');
    continueButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-step-target');
        const currentStepEl = btn.closest('.checkout-step');
        const stepNum = parseInt(currentStepEl.getAttribute('data-step'), 10);

        if (validateStep(stepNum)) {
          goToStep(target);
        }
      });
    });

    // Tecla Enter avança automaticamente no input ativo
    document.querySelectorAll('.app-input').forEach((input) => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const activeStep = input.closest('.checkout-step');
          if (activeStep) {
            const continueBtn = activeStep.querySelector('.btn-step-continue');
            if (continueBtn) continueBtn.click();
          }
        }
      });
    });

    // Botão "Voltar" do topo
    if (btnStepBack) {
      btnStepBack.addEventListener('click', () => {
        if (currentStep === 'success') {
          goToStep(6);
        } else if (currentStep === 1) {
          returnToOfferPhase();
        } else if (typeof currentStep === 'number' && currentStep > 1) {
          goToStep(currentStep - 1);
        }
      });
    }

    // Botão "Editar dados informados" na tela de sucesso
    const btnEditar = document.getElementById('btnEditarApp');
    if (btnEditar) {
      btnEditar.addEventListener('click', () => {
        goToStep(1);
      });
    }
  }

  // =========================================================================
  // 12. FINALIZAÇÃO NO WHATSAPP (EVENTO LEAD)
  // =========================================================================
  function setupWhatsAppTrigger() {
    const btnWhatsApp = document.getElementById('btnContinuarWhatsApp');
    if (!btnWhatsApp) return;

    btnWhatsApp.addEventListener('click', () => {
      // 1. Disparo do Evento LEAD no Meta Pixel (Evento Principal de Otimização)
      trackMetaEvent('Lead', {
        content_name: 'Solicitação Portabilidade iGreen Telecom'
      });

      // 2. Montagem do endereço completo
      const enderecoCompleto = `${formData.logradouro}, ${formData.numeroResidencial}${formData.complemento ? ' - ' + formData.complemento : ''} - ${formData.bairro}, ${formData.cidade} - ${formData.uf}`;

      // 3. Montagem da mensagem no formato exato solicitado:
      const textMessage = 
`Olá!

Quero realizar minha portabilidade para a iGreen Telecom.

Nome: ${formData.nomeCompleto}

CPF: ${formData.cpf}

Email: ${formData.email}

Endereço: ${enderecoCompleto}

CEP: ${formData.cep}

Número para portabilidade: ${formData.numeroAtual}

Operadora atual: ${formData.operadoraAtual}

Tipo de chip: ${formData.tipoChip}

Aguardo a confirmação para ativação.`;

      // 4. URL codificada e redirecionamento
      const encodedMsg = encodeURIComponent(textMessage);
      const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMsg}`;

      window.open(whatsappUrl, '_blank');
    });
  }

  // =========================================================================
  // 13. INICIALIZAÇÃO
  // =========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    trackViewContent();
    setupInputMasks();
    setupInteractiveOptions();
    setupNavigationControls();
    setupWhatsAppTrigger();
  });

})();
