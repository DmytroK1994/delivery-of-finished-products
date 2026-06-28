export const $=s=>document.querySelector(s);
export const $$=s=>Array.from(document.querySelectorAll(s));
export function toast(msg){const el=document.createElement('div');el.textContent=msg;el.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#172033;color:white;padding:11px 14px;border-radius:14px;z-index:200;box-shadow:0 10px 30px rgba(0,0,0,.2);font-weight:800;max-width:90vw;text-align:center';document.body.appendChild(el);setTimeout(()=>el.remove(),2300)}
export function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
