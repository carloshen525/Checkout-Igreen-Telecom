/**
 * iGreen Telecom - Fluxo de Geração de Leads para Portabilidade
 * Modal de Tela Única com Validação Estrita e Envio ao WhatsApp
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. CONFIGURAÇÕES PRINCIPAIS (FACILMENTE EDITÁVEIS)
  // =========================================================================
  const WHATSAPP_NUMBER = '553598754516'; // Formato internacional DDI 55 + DDD + Número
  const META_PIXEL_ID = '1787930898999589';

  // =========================================================================
  // 2. INTEGRAÇÃO META ADS (META PIXEL)
  // =========================================================================
  let viewContentTracked = false;
  let leadTracked = false;
  let isSubmitting = false;

  function trackMetaEvent(eventName, params = {}) {
    if (typeof window.fbq === 'function') {
      try {
        window.fbq('track', eventName, params);
        console.log(`[Meta Pixel] Evento disparado: ${eventName}`, params);
      } catch (err) {
        console.warn(`[Meta Pixel] Falha ao disparar ${eventName}:`, err);
      }
    }
  }

  // Disparo de ViewContent na visualização da oferta
  function trackViewContent() {
    if (!viewContentTracked) {
      viewContentTracked = true;
      trackMetaEvent('ViewContent', {
        content_name: 'Portabilidade iGreen Telecom',
        content_category: 'Telecom'
      });
    }
  }

  // Disparo exclusivo do evento LEAD no clique do botão de WhatsApp (após validação completa)
  function trackLeadEvent() {
    if (!leadTracked) {
      leadTracked = true;
      trackMetaEvent('Lead');
    }
  }

  // =========================================================================
  // 3. ELEMENTOS DO DOM
  // =========================================================================
  const btnOpenLeadModal = document.getElementById('btnStartCheckout');
  const leadModalBackdrop = document.getElementById('leadModalBackdrop');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const leadForm = document.getElementById('leadPortabilidadeForm');
  const leadFeedbackState = document.getElementById('leadFeedbackState');

  const inputNome = document.getElementById('nomeCompleto');
  const inputNumero = document.getElementById('numeroAtual');
  const inputOperadora = document.getElementById('operadoraAtual');
  const inputCep = document.getElementById('cep');

  // =========================================================================
  // 4. CONTROLE DO MODAL (ABRIR / FECHAR)
  // =========================================================================
  function openModal() {
    if (!leadModalBackdrop) return;
    // O primeiro botão apenas abre o modal. NENHUM evento de Lead ou checkout é disparado aqui!

    leadModalBackdrop.classList.add('is-active');
    leadModalBackdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Autofoco no primeiro campo com pequeno delay para fluidez
    setTimeout(() => {
      if (inputNome) inputNome.focus();
    }, 200);
  }

  function closeModal() {
    if (!leadModalBackdrop) return;
    leadModalBackdrop.classList.remove('is-active');
    leadModalBackdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function setupModalEvents() {
    if (btnOpenLeadModal) {
      btnOpenLeadModal.addEventListener('click', openModal);
    }

    if (btnCloseModal) {
      btnCloseModal.addEventListener('click', closeModal);
    }

    // Fechar ao clicar no backdrop escuro (fora do card)
    if (leadModalBackdrop) {
      leadModalBackdrop.addEventListener('click', (e) => {
        if (e.target === leadModalBackdrop) {
          closeModal();
        }
      });
    }

    // Fechar com a tecla ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && leadModalBackdrop && leadModalBackdrop.classList.contains('is-active')) {
        closeModal();
      }
    });
  }

  // =========================================================================
  // 5. MÁSCARAS AUTOMÁTICAS (TELEFONE E CEP)
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
    if (digits.length > 5) {
      return digits.replace(/^(\d{5})(\d{1,3})$/, '$1-$2');
    }
    return digits;
  }

  function setupInputMasks() {
    if (inputNumero) {
      inputNumero.addEventListener('input', (e) => {
        e.target.value = maskPhone(e.target.value);
        clearFieldError('numeroAtual');
      });
    }

    if (inputCep) {
      inputCep.addEventListener('input', (e) => {
        e.target.value = maskCEP(e.target.value);
        clearFieldError('cep');
      });
    }

    if (inputNome) {
      inputNome.addEventListener('input', () => clearFieldError('nomeCompleto'));
    }

    if (inputOperadora) {
      inputOperadora.addEventListener('input', () => clearFieldError('operadoraAtual'));
    }
  }

  // =========================================================================
  // 6. QUICK CHIPS E CARDS DE SELEÇÃO DE CHIP
  // =========================================================================
  function setupFormInteractions() {
    // Chips de operadora rápida
    const chips = document.querySelectorAll('.modal-chip-btn');
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => c.classList.remove('selected'));
        chip.classList.add('selected');
        const carrier = chip.getAttribute('data-carrier');

        if (carrier === 'Outra') {
          inputOperadora.value = '';
          inputOperadora.focus();
        } else {
          inputOperadora.value = carrier;
        }
        clearFieldError('operadoraAtual');
      });
    });

    if (inputOperadora) {
      inputOperadora.addEventListener('input', () => {
        const typed = inputOperadora.value.trim().toLowerCase();
        chips.forEach((c) => {
          if (c.getAttribute('data-carrier').toLowerCase() === typed) {
            c.classList.add('selected');
          } else {
            c.classList.remove('selected');
          }
        });
      });
    }

    // Toggle cards: Chip Físico vs eSIM
    const chipCards = document.querySelectorAll('.modal-chip-card');
    chipCards.forEach((card) => {
      const radio = card.querySelector('input[type="radio"]');
      card.addEventListener('click', () => {
        chipCards.forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        if (radio) radio.checked = true;
        clearFieldError('tipoChip');
      });
    });
  }

  // =========================================================================
  // 7. VALIDAÇÃO DOS CAMPOS
  // =========================================================================
  function showFieldError(fieldId, message) {
    const fieldInput = document.getElementById(fieldId);
    const errEl = document.getElementById(`err-${fieldId}`);
    if (fieldInput) fieldInput.classList.add('is-invalid');
    if (errEl) {
      errEl.textContent = message;
      errEl.classList.add('visible');
    }
  }

  function clearFieldError(fieldId) {
    const fieldInput = document.getElementById(fieldId);
    const errEl = document.getElementById(`err-${fieldId}`);
    if (fieldInput) fieldInput.classList.remove('is-invalid');
    if (errEl) {
      errEl.textContent = '';
      errEl.classList.remove('visible');
    }
  }

  function validateLeadForm() {
    let isValid = true;
    let firstInvalidField = null;

    // 1. Nome completo
    const nomeVal = inputNome ? inputNome.value.trim() : '';
    const nomeParts = nomeVal.split(/\s+/);
    if (nomeParts.length < 2 || nomeParts[1].length < 2) {
      showFieldError('nomeCompleto', 'Informe seu nome e sobrenome completos.');
      isValid = false;
      if (!firstInvalidField) firstInvalidField = inputNome;
    } else {
      clearFieldError('nomeCompleto');
    }

    // 2. Número que deseja manter (com DDD)
    const telDigits = inputNumero ? inputNumero.value.replace(/\D/g, '') : '';
    if (telDigits.length < 10 || telDigits.length > 11) {
      showFieldError('numeroAtual', 'Informe um número com DDD válido (Ex: 11 99999-9999).');
      isValid = false;
      if (!firstInvalidField) firstInvalidField = inputNumero;
    } else {
      const ddd = parseInt(telDigits.substring(0, 2), 10);
      if (ddd < 11 || ddd > 99) {
        showFieldError('numeroAtual', 'DDD inválido. Verifique o número digitado.');
        isValid = false;
        if (!firstInvalidField) firstInvalidField = inputNumero;
      } else {
        clearFieldError('numeroAtual');
      }
    }

    // 3. Operadora atual
    const operadoraVal = inputOperadora ? inputOperadora.value.trim() : '';
    if (operadoraVal.length < 2) {
      showFieldError('operadoraAtual', 'Informe sua operadora atual.');
      isValid = false;
      if (!firstInvalidField) firstInvalidField = inputOperadora;
    } else {
      clearFieldError('operadoraAtual');
    }

    // 4. Tipo de chip
    const chipRadio = document.querySelector('input[name="tipoChip"]:checked');
    if (!chipRadio) {
      showFieldError('tipoChip', 'Selecione o tipo de chip desejado.');
      isValid = false;
    } else {
      clearFieldError('tipoChip');
    }

    // 5. CEP
    const cepDigits = inputCep ? inputCep.value.replace(/\D/g, '') : '';
    if (cepDigits.length !== 8) {
      showFieldError('cep', 'Informe um CEP válido com 8 dígitos.');
      isValid = false;
      if (!firstInvalidField) firstInvalidField = inputCep;
    } else {
      clearFieldError('cep');
    }

    if (!isValid && firstInvalidField) {
      firstInvalidField.focus();
    }

    return isValid;
  }

  // =========================================================================
  // 8. ENVIO DO FORMULÁRIO, DISPARO DO LEAD E REDIRECIONAMENTO AO WHATSAPP
  // =========================================================================
  function setupFormSubmission() {
    if (!leadForm) return;

    leadForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Proteção contra múltiplos cliques
      if (isSubmitting) return;

      // Validação de todos os campos
      const isFormValid = validateLeadForm();
      if (!isFormValid) {
        return; // NÃO dispara o Lead e NÃO prossegue se houver erro
      }

      isSubmitting = true;

      // 1. Disparo do Evento LEAD no Meta Pixel (somente após validação completa)
      trackLeadEvent();

      // 2. Coleta dos dados formatados
      const nomeFinal = inputNome.value.trim();
      const numeroFinal = inputNumero.value.trim();
      const operadoraFinal = inputOperadora.value.trim();
      const tipoChipFinal = document.querySelector('input[name="tipoChip"]:checked').value;
      const cepFinal = inputCep.value.trim();

      // 3. Montagem da mensagem no modelo exato solicitado
      const whatsappMessage = 
`Olá! Quero fazer minha portabilidade para a iGreen Telecom. 💚

*Dados da portabilidade:*

Nome: ${nomeFinal}
Número que quero manter: ${numeroFinal}
Operadora atual: ${operadoraFinal}
Tipo de chip: ${tipoChipFinal}
CEP: ${cepFinal}

Quero dar continuidade à minha portabilidade e receber os 11GB grátis.`;

      // 4. Exibição rápida do feedback visual após envio
      if (leadForm && leadFeedbackState) {
        leadForm.style.display = 'none';
        leadFeedbackState.style.display = 'flex';
      }

      // 5. Redirecionamento seguro para o WhatsApp
      const encodedMsg = encodeURIComponent(whatsappMessage);
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMsg}`;

      // Aguarda 600ms para o usuário visualizar o feedback de sucesso
      setTimeout(() => {
        window.location.href = whatsappUrl;
      }, 600);
    });
  }

  // =========================================================================
  // 9. INICIALIZAÇÃO
  // =========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    trackViewContent();
    setupModalEvents();
    setupInputMasks();
    setupFormInteractions();
    setupFormSubmission();
  });

})();
