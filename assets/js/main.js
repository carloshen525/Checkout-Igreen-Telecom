/**
 * iGreen Telecom - Checkout Inteligente de Portabilidade
 * Experiência em 2 Fases (Estilo App Fintech / Telecom)
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. CONFIGURAÇÕES GERAIS
  // =========================================================================
  // WhatsApp oficial de atendimento (DDI 55 + DDD + Número: 35 9875-4516)
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
    email: ''
  };

  let currentStep = 1; // 1 a 4 ou 'success'

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
  // 5. MÁSCARA DE TELEFONE
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

  function setupInputMasks() {
    const telInput = document.getElementById('numeroAtual');

    if (telInput) {
      telInput.addEventListener('input', (e) => {
        e.target.value = maskPhone(e.target.value);
        clearError('numeroAtual');
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
  // 6. VALIDAÇÕES (TELEFONE, EMAIL)
  // =========================================================================
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
  // 7. CONTROLE DOS CHIPS E SELETORES
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

    if (operadoraInput) {
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
    }

    // Cards de opção de chip: Físico vs eSIM (Etapa 3)
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
  // 8. VALIDAÇÃO INDIVIDUAL DE CADA ETAPA (4 ETAPAS)
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

    if (!isValid && fieldToFocus) {
      fieldToFocus.focus();
    }

    return isValid;
  }

  // =========================================================================
  // 9. TRANSIÇÃO DE TELAS NO CHECKOUT (1 a 4 e TELA DE SUCESSO)
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

      // Atualiza contador e barra de progresso (4 etapas = 25%, 50%, 75%, 100%)
      const progressPercentage = Math.round((num / 4) * 100);
      stepCounterText.textContent = `Etapa ${num} de 4`;
      appProgressFill.style.width = `${progressPercentage}%`;

      // Autofoco inteligente no primeiro input disponível
      setTimeout(() => {
        const input = targetStep.querySelector('input:not([type="radio"])');
        if (input) input.focus();
      }, 150);
    }
  }

  function populateSummaryBox() {
    const sumNome = document.getElementById('sumNome');
    const sumEmail = document.getElementById('sumEmail');
    const sumNumero = document.getElementById('sumNumero');
    const sumOperadora = document.getElementById('sumOperadora');
    const sumChip = document.getElementById('sumChip');

    if (sumNome) sumNome.textContent = formData.nomeCompleto || '-';
    if (sumEmail) sumEmail.textContent = formData.email || '-';
    if (sumNumero) sumNumero.textContent = formData.numeroAtual || '-';
    if (sumOperadora) sumOperadora.textContent = formData.operadoraAtual || '-';
    if (sumChip) sumChip.textContent = formData.tipoChip || '-';
  }

  // =========================================================================
  // 10. GESTÃO DOS BOTÕES DE NAVEGAÇÃO E TECLADO ENTER
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
          goToStep(4);
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
  // 11. FINALIZAÇÃO NO WHATSAPP (EVENTO LEAD)
  // =========================================================================
  function setupWhatsAppTrigger() {
    const btnWhatsApp = document.getElementById('btnContinuarWhatsApp');
    if (!btnWhatsApp) return;

    btnWhatsApp.addEventListener('click', () => {
      // 1. Disparo do Evento LEAD no Meta Pixel
      trackMetaEvent('Lead', {
        content_name: 'Lead Portabilidade iGreen Telecom'
      });

      // 2. Montagem da mensagem formatada no padrão exato solicitado
      const textMessage = 
`Olá! Quero fazer minha portabilidade para a iGreen Telecom.

Nome: ${formData.nomeCompleto}
Email: ${formData.email}
Número para portabilidade: ${formData.numeroAtual}
Operadora atual: ${formData.operadoraAtual}
Tipo de chip escolhido: ${formData.tipoChip}

Gostaria de finalizar minha ativação.`;

      // 3. URL codificada e redirecionamento
      const encodedMsg = encodeURIComponent(textMessage);
      const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMsg}`;

      window.open(whatsappUrl, '_blank');
    });
  }

  // =========================================================================
  // 12. INICIALIZAÇÃO
  // =========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    trackViewContent();
    setupInputMasks();
    setupInteractiveOptions();
    setupNavigationControls();
    setupWhatsAppTrigger();
  });

})();
