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
