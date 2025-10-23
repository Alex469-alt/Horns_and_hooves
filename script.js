// ============================================
// ОБЩИЕ ФУНКЦИИ
// ============================================

// Подключение к вебхуку n8n
const WEBHOOK_URL = 'https://alex87ai.ru/webhook/99133578-430a-4a2d-90df-3deda35f2b0d';

// Получение или создание sessionId
function getSessionId() {
  let sessionId = localStorage.getItem('chatSessionId');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('chatSessionId', sessionId);
  }
  return sessionId;
}

// Функция для отправки сообщения в вебхук
async function sendToWebhook(message, isUser = true, source = 'unknown') {
  try {
    const sessionId = getSessionId();
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'sendMessage',
        sessionId: sessionId,
        chatId: sessionId,
        message: message,
        query: message,
        isUser: isUser,
        timestamp: new Date().toISOString(),
        source: source
      })
    });
    
    if (response.ok) {
      const text = await response.text();
      console.log('Сырой ответ от вебхука:', text);
      
      // Если ответ пустой
      if (!text || text.trim() === '') {
        console.warn('Вебхук вернул пустой ответ');
        return null;
      }
      
      try {
        const data = JSON.parse(text);
        console.log('Распарсенный ответ от вебхука:', data);
        return data;
      } catch (e) {
        console.error('Ошибка парсинга JSON:', e);
        console.log('Возвращаем текст как output:', text);
        // Если это просто текст, оборачиваем его в объект
        return { output: text.trim() };
      }
    } else {
      console.error('Ошибка отправки в вебхук:', response.status);
      const errorText = await response.text();
      console.error('Текст ошибки:', errorText);
      return null;
    }
  } catch (error) {
    console.error('Ошибка подключения к вебхуку:', error);
    return null;
  }
}

// ============================================
// ВАЛИДАЦИЯ ФОРМЫ ЗАЯВКИ
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('lead-form');
  if (!form) return;
  
  const input = document.getElementById('lead-phone');
  const err = document.getElementById('phone-error');
  const field = form.querySelector('.field');

  // Проверка на минимум 7 цифр
  const isValidPhone = v => {
    const trimmed = v.trim();
    if (!trimmed) return false;
    const digits = trimmed.replace(/\D/g, '');
    return digits.length >= 7;
  };

  // Валидация при отправке
  form.addEventListener('submit', e => {
    const phoneValue = input.value.trim();
    
    if (!phoneValue) {
      e.preventDefault();
      field.classList.add('invalid');
      if (err) {
        err.textContent = 'Введите номер телефона';
        err.style.display = 'block';
      }
      input.focus();
      return false;
    }
    
    if (!isValidPhone(phoneValue)) {
      e.preventDefault();
      field.classList.add('invalid');
      if (err) {
        err.textContent = 'Введите корректно номер телефона (минимум 7 цифр)';
        err.style.display = 'block';
      }
      input.focus();
      return false;
    }
    
    input.value = phoneValue;
  });

  // Валидация в реальном времени
  input.addEventListener('input', () => {
    const phoneValue = input.value.trim();
    
    if (phoneValue && isValidPhone(phoneValue)) { 
      field.classList.remove('invalid'); 
      if (err) err.style.display = 'none'; 
    }
  });

  // Инициализация
  if (err) err.style.display = 'none';
});

// ============================================
// ИИ ВИДЖЕТ ДЛЯ INDEX.HTML
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Проверяем, что мы НЕ на странице ads.html
  const aiFormSection = document.getElementById('ai-form-section');
  if (aiFormSection) return; // Если есть ai-form-section, значит это ads.html - пропускаем
  
  const chatForm = document.getElementById('chat-form');
  if (!chatForm) return;

  const chatInput = document.getElementById('chat-text');
  const chatButton = document.getElementById('chat-send');
  const chatMessages = document.getElementById('chat-messages');
  const chatLauncher = document.querySelector('.chat-launcher-futuristic');
  const chatWindow = document.querySelector('.chat-window-futuristic');
  const chatClose = document.querySelector('.chat-close-futuristic');
  
  console.log('Виджет index.html инициализирован:', {
    chatLauncher,
    chatWindow,
    chatClose
  });

  // Функция для добавления сообщения в виджет
  function addChatMessage(content, isUser = false, typing = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `msg-futuristic ${isUser ? 'user' : 'bot'}`;
    
    const msgContent = document.createElement('div');
    msgContent.className = 'msg-content';
    messageDiv.appendChild(msgContent);
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    if (typing && !isUser) {
      // Эффект печати для ответов бота
      let index = 0;
      const typingSpeed = 30; // Скорость печати (мс на символ)
      
      const typeNextChar = () => {
        if (index < content.length) {
          msgContent.textContent += content[index];
          index++;
          chatMessages.scrollTop = chatMessages.scrollHeight;
          setTimeout(typeNextChar, typingSpeed);
        }
      };
      
      typeNextChar();
    } else {
      // Обычное добавление без эффекта печати
      msgContent.textContent = content;
    }
  }

  // Функция для показа индикатора печати
  function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'msg-futuristic bot typing-indicator';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
      <div class="msg-content">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Функция для удаления индикатора печати
  function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  // Обработка отправки сообщения
  chatForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Добавляем сообщение пользователя
    addChatMessage(message, true);
    chatInput.value = '';
    chatButton.disabled = true;
    chatButton.textContent = 'Отправка...';
    
    // Показываем индикатор печати
    showTypingIndicator();
    
    try {
      // Отправляем сообщение на вебхук
      const response = await sendToWebhook(message, true, 'index-chat-widget');
      
      // Удаляем индикатор печати
      removeTypingIndicator();
      
      console.log('Полный ответ от вебхука:', response);
      
      // Добавляем ответ от ИИ
      let botMessage = null;
      
      // Проверяем различные форматы ответа
      if (response) {
        if (typeof response === 'string') {
          botMessage = response;
        } else if (response.output) {
          botMessage = response.output;
        } else if (response.reply) {
          botMessage = response.reply;
        } else if (response.message) {
          botMessage = response.message;
        } else if (response.text) {
          botMessage = response.text;
        }
      }
      
      if (botMessage) {
        addChatMessage(botMessage, false, true); // true = эффект печати
      } else {
        console.warn('Не удалось извлечь ответ из:', response);
        addChatMessage('Спасибо за ваше сообщение! Наш специалист свяжется с вами в ближайшее время.', false, true);
      }
    } catch (error) {
      console.error('Ошибка:', error);
      removeTypingIndicator();
      addChatMessage('Произошла ошибка при отправке сообщения. Попробуйте еще раз.', false, true);
    } finally {
      chatButton.disabled = false;
      chatButton.textContent = 'Отправить';
    }
  });

  // Открытие/закрытие чата
  if (chatLauncher) {
    chatLauncher.addEventListener('click', () => {
      console.log('Клик по launcher виджета (index.html)');
      chatWindow.classList.toggle('active');
      console.log('Класс active (index):', chatWindow.classList.contains('active'));
    });
  } else {
    console.error('chatLauncher не найден на странице index.html');
  }

  if (chatClose) {
    chatClose.addEventListener('click', () => {
      console.log('Клик по close виджета (index.html)');
      chatWindow.classList.remove('active');
    });
  } else {
    console.warn('chatClose не найден на странице index.html');
  }
});

// ============================================
// INDEX.HTML - ИИ АССИСТЕНТ (АНЖЕЛА) В ДЕМО СЕКЦИИ
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Проверяем, что мы НЕ на странице ads.html
  const aiFormSection = document.getElementById('ai-form-section');
  if (aiFormSection) return; // Если есть ai-form-section, значит это ads.html - пропускаем
  
  const aiForm = document.getElementById('ai-form');
  if (!aiForm) return;

  const aiText = document.getElementById('ai-text');
  const aiSend = document.getElementById('ai-send');
  const aiMessages = document.getElementById('ai-messages');
  
  console.log('ИИ Ассистент (Анжела) инициализирован на index.html');

  // Функция для добавления сообщения
  function addAIMessage(content, isUser = false, typing = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-msg-futuristic ${isUser ? 'user' : 'bot'}`;
    
    if (typing && !isUser) {
      // Эффект печати для ответов бота
      messageDiv.textContent = '';
      aiMessages.appendChild(messageDiv);
      aiMessages.scrollTop = aiMessages.scrollHeight;
      
      let index = 0;
      const typingSpeed = 30; // Скорость печати (мс на символ)
      
      const typeNextChar = () => {
        if (index < content.length) {
          messageDiv.textContent += content[index];
          index++;
          aiMessages.scrollTop = aiMessages.scrollHeight;
          setTimeout(typeNextChar, typingSpeed);
        }
      };
      
      typeNextChar();
    } else {
      // Обычное добавление без эффекта печати
      messageDiv.textContent = content;
      aiMessages.appendChild(messageDiv);
      aiMessages.scrollTop = aiMessages.scrollHeight;
    }
  }

  // Функция для показа индикатора печати
  function showAITypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'ai-msg-futuristic bot typing-indicator';
    typingDiv.id = 'ai-typing-indicator';
    typingDiv.innerHTML = `
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    `;
    aiMessages.appendChild(typingDiv);
    aiMessages.scrollTop = aiMessages.scrollHeight;
  }

  // Функция для удаления индикатора печати
  function removeAITypingIndicator() {
    const typingIndicator = document.getElementById('ai-typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  // Обработка отправки формы
  aiForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const message = aiText.value.trim();
    if (!message) return;
    
    // Добавляем сообщение пользователя
    addAIMessage(message, true);
    aiText.value = '';
    aiSend.disabled = true;
    aiSend.textContent = 'Отправка...';
    
    // Показываем индикатор печати
    showAITypingIndicator();
    
    try {
      // Отправляем сообщение на вебхук
      const sessionId = getSessionId();
      
      const response = await fetch('https://alex87ai.ru/webhook/ae892d5f-98e7-4ff2-be54-26b98c9ff636', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sendMessage',
          sessionId: sessionId,
          chatId: sessionId,
          message: message,
          query: message,
          isUser: true,
          timestamp: new Date().toISOString(),
          source: 'index-ai-assistant'
        })
      });
      
      // Удаляем индикатор печати
      removeAITypingIndicator();
      
      if (response.ok) {
        const text = await response.text();
        console.log('Сырой ответ от вебхука (Анжела):', text);
        
        if (!text || text.trim() === '') {
          console.warn('Вебхук вернул пустой ответ');
          addAIMessage('Извините, не удалось получить ответ. Попробуйте еще раз.', false, true);
        } else {
          try {
            const data = JSON.parse(text);
            console.log('Распарсенный ответ от вебхука (Анжела):', data);
            
            // Извлекаем ответ
            let botMessage = null;
            if (typeof data === 'string') {
              botMessage = data;
            } else if (data.output) {
              botMessage = data.output;
            } else if (data.reply) {
              botMessage = data.reply;
            } else if (data.message) {
              botMessage = data.message;
            } else if (data.text) {
              botMessage = data.text;
            }
            
            if (botMessage) {
              addAIMessage(botMessage, false, true); // true = эффект печати
            } else {
              console.warn('Не удалось извлечь ответ из:', data);
              addAIMessage('Спасибо за ваш вопрос! Наш специалист свяжется с вами.', false, true);
            }
          } catch (e) {
            console.error('Ошибка парсинга JSON:', e);
            console.log('Возвращаем текст как есть:', text);
            addAIMessage(text.trim(), false, true);
          }
        }
      } else {
        console.error('Ошибка отправки в вебхук:', response.status);
        addAIMessage('Произошла ошибка. Попробуйте позже.', false, true);
      }
    } catch (error) {
      console.error('Ошибка:', error);
      removeAITypingIndicator();
      addAIMessage('Произошла ошибка при отправке сообщения. Попробуйте еще раз.', false, true);
    } finally {
      aiSend.disabled = false;
      aiSend.textContent = 'Отправить';
    }
  });
});

// ============================================
// ADS.HTML - ПЛАВНЫЙ СКРОЛЛ
// ============================================
function scrollToAIForm() {
  const aiFormSection = document.getElementById('ai-form-section');
  if (aiFormSection) {
    aiFormSection.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

// ============================================
// ADS.HTML - ИИ АССИСТЕНТ (АНЖЕЛА) В ДЕМО СЕКЦИИ
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Проверяем, что мы на странице ads.html
  const aiFormSection = document.getElementById('ai-form-section');
  if (!aiFormSection) return; // Если нет ai-form-section, значит это не ads.html
  
  const adsAiForm = document.getElementById('ads-ai-form');
  if (!adsAiForm) return;

  const adsAiText = document.getElementById('ads-ai-text');
  const adsAiSend = document.getElementById('ads-ai-send');
  const adsAiMessages = document.getElementById('ads-ai-messages');
  
  console.log('ИИ Ассистент (Анжела) инициализирован на ads.html');

  // Функция для добавления сообщения
  function addAdsAIMessage(content, isUser = false, typing = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-msg-futuristic ${isUser ? 'user' : 'bot'}`;
    
    if (typing && !isUser) {
      // Эффект печати для ответов бота
      messageDiv.textContent = '';
      adsAiMessages.appendChild(messageDiv);
      adsAiMessages.scrollTop = adsAiMessages.scrollHeight;
      
      let index = 0;
      const typingSpeed = 30; // Скорость печати (мс на символ)
      
      const typeNextChar = () => {
        if (index < content.length) {
          messageDiv.textContent += content[index];
          index++;
          adsAiMessages.scrollTop = adsAiMessages.scrollHeight;
          setTimeout(typeNextChar, typingSpeed);
        }
      };
      
      typeNextChar();
    } else {
      // Обычное добавление без эффекта печати
      messageDiv.textContent = content;
      adsAiMessages.appendChild(messageDiv);
      adsAiMessages.scrollTop = adsAiMessages.scrollHeight;
    }
  }

  // Функция для показа индикатора печати
  function showAdsAITypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'ai-msg-futuristic bot typing-indicator';
    typingDiv.id = 'ads-ai-typing-indicator';
    typingDiv.innerHTML = `
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    `;
    adsAiMessages.appendChild(typingDiv);
    adsAiMessages.scrollTop = adsAiMessages.scrollHeight;
  }

  // Функция для удаления индикатора печати
  function removeAdsAITypingIndicator() {
    const typingIndicator = document.getElementById('ads-ai-typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  // Обработка отправки формы
  adsAiForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const message = adsAiText.value.trim();
    if (!message) return;
    
    // Добавляем сообщение пользователя
    addAdsAIMessage(message, true);
    adsAiText.value = '';
    adsAiSend.disabled = true;
    adsAiSend.textContent = 'Отправка...';
    
    // Показываем индикатор печати
    showAdsAITypingIndicator();
    
    try {
      // Отправляем сообщение на вебхук
      const sessionId = getSessionId();
      
      const response = await fetch('https://alex87ai.ru/webhook/ae892d5f-98e7-4ff2-be54-26b98c9ff636', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sendMessage',
          sessionId: sessionId,
          chatId: sessionId,
          message: message,
          query: message,
          isUser: true,
          timestamp: new Date().toISOString(),
          source: 'ads-ai-assistant'
        })
      });
      
      // Удаляем индикатор печати
      removeAdsAITypingIndicator();
      
      if (response.ok) {
        const text = await response.text();
        console.log('Сырой ответ от вебхука (Анжела ads.html):', text);
        
        if (!text || text.trim() === '') {
          console.warn('Вебхук вернул пустой ответ');
          addAdsAIMessage('Извините, не удалось получить ответ. Попробуйте еще раз.', false, true);
        } else {
          try {
            const data = JSON.parse(text);
            console.log('Распарсенный ответ от вебхука (Анжела ads.html):', data);
            
            // Извлекаем ответ
            let botMessage = null;
            if (typeof data === 'string') {
              botMessage = data;
            } else if (data.output) {
              botMessage = data.output;
            } else if (data.reply) {
              botMessage = data.reply;
            } else if (data.message) {
              botMessage = data.message;
            } else if (data.text) {
              botMessage = data.text;
            }
            
            if (botMessage) {
              addAdsAIMessage(botMessage, false, true); // true = эффект печати
            } else {
              console.warn('Не удалось извлечь ответ из:', data);
              addAdsAIMessage('Спасибо за ваш вопрос! Наш специалист свяжется с вами.', false, true);
            }
          } catch (e) {
            console.error('Ошибка парсинга JSON:', e);
            console.log('Возвращаем текст как есть:', text);
            addAdsAIMessage(text.trim(), false, true);
          }
        }
      } else {
        console.error('Ошибка отправки в вебхук:', response.status);
        addAdsAIMessage('Произошла ошибка. Попробуйте позже.', false, true);
      }
    } catch (error) {
      console.error('Ошибка:', error);
      removeAdsAITypingIndicator();
      addAdsAIMessage('Произошла ошибка при отправке сообщения. Попробуйте еще раз.', false, true);
    } finally {
      adsAiSend.disabled = false;
      adsAiSend.textContent = 'Отправить';
    }
  });
});

// ============================================
// ADS.HTML - ИИ ВИДЖЕТ
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Проверяем, что мы на странице ads.html
  const aiFormSection = document.getElementById('ai-form-section');
  if (!aiFormSection) return; // Если нет ai-form-section, значит это не ads.html
  
  const widgetChatForm = document.getElementById('chat-form');
  const widgetChatMessages = document.getElementById('chat-messages');
  
  if (!widgetChatForm || !widgetChatMessages) return;

  const widgetChatText = document.getElementById('chat-text');
  const widgetChatSend = document.getElementById('chat-send');
  const widgetLauncher = document.querySelector('.chat-launcher-futuristic');
  const widgetWindow = document.querySelector('.chat-window-futuristic');
  const widgetClose = document.querySelector('.chat-close-futuristic');
  
  console.log('Виджет ads.html инициализирован:', {
    widgetLauncher,
    widgetWindow,
    widgetClose
  });

  // Функция для добавления сообщения в виджет
  function addWidgetMessage(content, isUser = false, typing = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `msg-futuristic ${isUser ? 'user' : 'bot'}`;
    
    const now = new Date();
    const time = now.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    const msgContent = document.createElement('div');
    msgContent.className = 'msg-content';
    
    const msgTime = document.createElement('div');
    msgTime.className = 'msg-time';
    msgTime.textContent = time;
    
    messageDiv.appendChild(msgContent);
    messageDiv.appendChild(msgTime);
    
    widgetChatMessages.appendChild(messageDiv);
    widgetChatMessages.scrollTop = widgetChatMessages.scrollHeight;
    
    if (typing && !isUser) {
      // Эффект печати для ответов бота
      let index = 0;
      const typingSpeed = 30; // Скорость печати (мс на символ)
      
      const typeNextChar = () => {
        if (index < content.length) {
          msgContent.textContent += content[index];
          index++;
          widgetChatMessages.scrollTop = widgetChatMessages.scrollHeight;
          setTimeout(typeNextChar, typingSpeed);
        }
      };
      
      typeNextChar();
    } else {
      // Обычное добавление без эффекта печати
      msgContent.textContent = content;
    }
  }

  // Функция для показа индикатора печати в виджете
  function showWidgetTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'msg-futuristic bot typing-indicator';
    typingDiv.id = 'widget-typing-indicator';
    typingDiv.innerHTML = `
      <div class="msg-content">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    `;
    widgetChatMessages.appendChild(typingDiv);
    widgetChatMessages.scrollTop = widgetChatMessages.scrollHeight;
  }

  // Функция для удаления индикатора печати в виджете
  function removeWidgetTypingIndicator() {
    const typingIndicator = document.getElementById('widget-typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  // Обработка отправки сообщения
  widgetChatForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const message = widgetChatText.value.trim();
    if (!message) return;
    
    // Добавляем сообщение пользователя
    addWidgetMessage(message, true);
    widgetChatText.value = '';
    widgetChatSend.disabled = true;
    widgetChatSend.textContent = 'Отправка...';
    
    // Показываем индикатор печати
    showWidgetTypingIndicator();
    
    try {
      // Отправляем сообщение на вебхук
      const response = await sendToWebhook(message, true, 'ads-chat-widget');
      
      // Удаляем индикатор печати
      removeWidgetTypingIndicator();
      
      console.log('Полный ответ от вебхука (ads.html):', response);
      
      // Добавляем ответ от ИИ
      let botMessage = null;
      
      // Проверяем различные форматы ответа
      if (response) {
        if (typeof response === 'string') {
          botMessage = response;
        } else if (response.output) {
          botMessage = response.output;
        } else if (response.reply) {
          botMessage = response.reply;
        } else if (response.message) {
          botMessage = response.message;
        } else if (response.text) {
          botMessage = response.text;
        }
      }
      
      if (botMessage) {
        addWidgetMessage(botMessage, false, true); // true = эффект печати
      } else {
        console.warn('Не удалось извлечь ответ из:', response);
        addWidgetMessage('Спасибо за ваше сообщение! Наш специалист свяжется с вами в ближайшее время.', false, true);
      }
    } catch (error) {
      console.error('Ошибка:', error);
      removeWidgetTypingIndicator();
      addWidgetMessage('Произошла ошибка при отправке сообщения. Попробуйте еще раз.', false, true);
    } finally {
      widgetChatSend.disabled = false;
      widgetChatSend.textContent = 'Отправить';
    }
  });

  // Открытие/закрытие чата
  if (widgetLauncher) {
    widgetLauncher.addEventListener('click', () => {
      console.log('Клик по launcher виджета (ads.html)');
      widgetWindow.classList.toggle('active');
      console.log('Класс active:', widgetWindow.classList.contains('active'));
    });
  } else {
    console.error('widgetLauncher не найден на странице ads.html');
  }

  if (widgetClose) {
    widgetClose.addEventListener('click', () => {
      console.log('Клик по close виджета (ads.html)');
      widgetWindow.classList.remove('active');
    });
  } else {
    console.warn('widgetClose не найден на странице ads.html');
  }
});

// ============================================
// FAQ - РАСКРЫТИЕ/СКРЫТИЕ ОТВЕТОВ
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const faqQuestions = document.querySelectorAll('.faq-question');
  
  faqQuestions.forEach(question => {
    question.addEventListener('click', function() {
      const faqItem = this.parentElement;
      const isActive = faqItem.classList.contains('active');
      
      // Закрываем все открытые FAQ
      document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
      });
      
      // Если текущий не был активен, открываем его
      if (!isActive) {
        faqItem.classList.add('active');
      }
    });
  });
});

// Модальное окно для формы телефона
document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('phone-modal');
  const phoneForm = document.getElementById('phone-form');
  const phoneInput = document.getElementById('phone-input');
  const phoneError = document.getElementById('phone-error');
  const modalClose = document.querySelector('.modal-close');
  const ctaButtons = document.querySelectorAll('.cta-button');

  // Открытие модального окна при клике на кнопку "Оставить заявку"
  const leaveRequestBtn = document.getElementById('leave-request-btn');
  if (leaveRequestBtn) {
    leaveRequestBtn.addEventListener('click', function() {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }
  
  // Также обрабатываем старые кнопки с классом cta-button (для совместимости)
  ctaButtons.forEach(button => {
    // Пропускаем кнопки с onclick или с ID leave-request-btn
    if (button.onclick || button.id === 'leave-request-btn') return;
    
    button.addEventListener('click', function() {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  // Закрытие модального окна
  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    phoneForm.reset();
    phoneError.textContent = '';
  }

  // Закрытие по клику на крестик
  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  // Закрытие по клику на оверлей
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Закрытие по нажатию Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  // Валидация номера телефона
  function validatePhone(phone) {
    // Удаляем все нецифровые символы
    const digits = phone.replace(/\D/g, '');
    
    // Проверяем, что осталось минимум 7 цифр
    if (digits.length < 7) {
      return {
        valid: false,
        message: 'Номер телефона должен содержать минимум 7 цифр'
      };
    }
    
    return {
      valid: true,
      message: ''
    };
  }

  // Валидация при вводе
  phoneInput.addEventListener('input', function() {
    const validation = validatePhone(this.value);
    if (!validation.valid && this.value.length > 0) {
      phoneError.textContent = validation.message;
      this.style.borderColor = 'rgba(255, 68, 68, 0.6)';
    } else {
      phoneError.textContent = '';
      this.style.borderColor = 'rgba(0, 255, 255, 0.3)';
    }
  });

  // Отправка формы
  phoneForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const phoneValue = phoneInput.value.trim();
    const validation = validatePhone(phoneValue);

    // Проверка валидности
    if (!validation.valid) {
      phoneError.textContent = validation.message;
      phoneInput.style.borderColor = 'rgba(255, 68, 68, 0.6)';
      phoneInput.focus();
      return;
    }

    // Блокируем кнопку отправки
    const submitButton = phoneForm.querySelector('.submit-button');
    submitButton.disabled = true;
    submitButton.textContent = 'Отправка...';

    try {
      // Отправка на вебхук n8n
      const response = await fetch('https://alex87ai.ru/webhook/8a0139fb-170d-4edd-8999-ddd4b8220117', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneValue,
          timestamp: new Date().toISOString(),
          source: 'Форма "Узнать больше"'
        })
      });

      if (response.ok) {
        // Успешная отправка - редирект на thank-you.html
        window.location.href = 'thank-you.html';
      } else {
        throw new Error('Ошибка отправки');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      phoneError.textContent = 'Произошла ошибка. Попробуйте позже.';
      submitButton.disabled = false;
      submitButton.textContent = 'Отправить заявку';
    }
  });
});
