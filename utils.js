const LOG_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxMtt6eP3JErCTukrkIjCl4u9yEJ5E5Aa19pYIewRRNlnhnvLXjLvi_PaPr2q7jb88Z/exec';

function logSessionEvent(email, tipo, zona) {
  const now = new Date();
  const fecha = now.toLocaleDateString('es-CO');    // ej. "29/04/2025"
  const hora  = now.toLocaleTimeString('es-CO');    // ej. "14:35:07"
  const dispositivo = navigator.userAgent;

  return fetch(LOG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
    body: JSON.stringify({ email, fecha, hora, tipo, dispositivo, zona })
  })
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
}
