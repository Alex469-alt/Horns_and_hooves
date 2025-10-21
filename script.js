(function(){
  const webhook = "https://alex87ai.ru/webhook/99133578-430a-4a2d-90df-3deda35f2b0d";

  // элементы
  const root = document.getElementById("chat-widget");
  const win  = root.querySelector(".chat-window");
  const btn  = root.querySelector(".chat-launcher");
  const close= root.querySelector(".chat-close");
  const form = document.getElementById("chat-form");
  const input= document.getElementById("chat-text");
  const list = document.getElementById("chat-messages");
  const sendBtn = document.getElementById("chat-send");

  // простая сессия
  const sidKey = "chat_sid";
  let sid = localStorage.getItem(sidKey);
  if(!sid){ sid = (crypto?.randomUUID?.() || String(Date.now())+Math.random().toString(16).slice(2)); localStorage.setItem(sidKey, sid); }

  // UI
  const open = ()=>{ win.classList.add("open"); input.focus(); };
  const closeWin = ()=> win.classList.remove("open");
  btn.addEventListener("click",()=> win.classList.contains("open") ? closeWin() : open());
  close.addEventListener("click", closeWin);

  // helpers
  const addMsg = (text, who="bot")=>{
    const div = document.createElement("div");
    div.className = `msg ${who}`;
    div.textContent = text;
    list.appendChild(div);
    list.scrollTop = list.scrollHeight;
    return div;
  };
  const typingOn = ()=> addMsg("Печатает…","system");
  const typingOff = (el)=> el && el.remove();

  // отправка
  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const text = input.value.trim();
    if(!text) return;

    addMsg(text,"user");
    input.value = "";
    input.focus();
    sendBtn.disabled = true;
    const t = typingOn();

    try{
      const payload = {
        sessionId: sid,
        message: text,
        page: location.href,
        userAgent: navigator.userAgent,
        ts: new Date().toISOString()
      };

      const res = await fetch(webhook, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(payload),
      });

      // поддержка и JSON, и обычного текста
      let replyText = "";
      const ct = res.headers.get("content-type") || "";
      if(ct.includes("application/json")){
        const data = await res.json();
        replyText = data.reply || data.message || JSON.stringify(data);
      }else{
        replyText = await res.text();
      }

      typingOff(t);
      addMsg(replyText || "Нет ответа от сервера.","bot");
    }catch(err){
      typingOff(t);
      addMsg("Ошибка соединения. Попробуйте позже.","bot");
      console.error(err);
    }finally{
      sendBtn.disabled = false;
    }
  });
})();

// === Валидация формы заявки ===
document.addEventListener('DOMContentLoaded', () => {
  const form  = document.getElementById('lead-form');
  if (!form) return;
  const input = document.getElementById('lead-phone');
  const err   = document.getElementById('phone-error');
  const field = form.querySelector('.field');
  const submitBtn = form.querySelector('.lead-btn');

  // Проверка на минимум 7 цифр
  const isValidPhone = v => {
    const trimmed = v.trim();
    if (!trimmed) return false;
    const digits = trimmed.replace(/\D/g, '');
    return digits.length >= 7;
  };

  // Обновление состояния кнопки (убираем блокировку)
  const updateSubmitButton = () => {
    // Кнопка всегда активна, валидация только при отправке
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

  // Валидация в реальном времени - убираем ошибку при вводе валидного номера
  input.addEventListener('input', () => {
    const phoneValue = input.value.trim();
    
    if (phoneValue && isValidPhone(phoneValue)) { 
      field.classList.remove('invalid'); 
      if (err) err.style.display = 'none'; 
    }
    updateSubmitButton();
  });

  // Инициализация - скрываем ошибку по умолчанию
  if (err) err.style.display = 'none';
  updateSubmitButton();
});

// === AI Demo: отправка в n8n и ответ в чат Perplexity ===
(function(){
  const webhook = "https://alex87ai.ru/webhook/ae892d5f-98e7-4ff2-be54-26b98c9ff636";
  const form = document.getElementById("ai-form");
  if (!form) return;

  const input = document.getElementById("ai-text");
  const send  = document.getElementById("ai-send");
  const box   = document.getElementById("ai-messages");

  const sidKey = "ai_demo_sid";
  let sid = localStorage.getItem(sidKey);
  if (!sid) { sid = (crypto?.randomUUID?.() || Date.now()+Math.random().toString(16)); localStorage.setItem(sidKey, sid); }

  const add = (text, who="bot")=>{
    const el = document.createElement("div");
    el.className = `ai-msg ${who}`;
    el.textContent = text;
    box.appendChild(el);
    box.scrollTop = box.scrollHeight;
    return el;
  };
  const typingOn = ()=>{ const el = document.createElement("div"); el.className="ai-msg system"; el.textContent="печатает…"; box.appendChild(el); box.scrollTop=box.scrollHeight; return el; };
  const typingOff = el => el && el.remove();

  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    add(text, "user");
    input.value = "";
    input.focus();
    send.disabled = true;
    const t = typingOn();

    try{
      const payload = {
        sessionId: sid,
        message: text,
        page: location.href,
        userAgent: navigator.userAgent,
        ts: new Date().toISOString()
      };

      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      let reply = "";
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const data = await res.json();
        reply = data.reply || data.message || JSON.stringify(data);
      } else {
        reply = await res.text();
      }
      typingOff(t);
      add(reply || "Нет ответа от сервера.");
    }catch(err){
      typingOff(t);
      add("Ошибка соединения. Проверьте интернет или CORS.");
      console.error(err);
    }finally{
      send.disabled = false;
    }
  });
})();
