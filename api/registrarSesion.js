import fetch from 'node-fetch';

export default async function handler(req, res) {
  const googleScriptURL = 'https://script.google.com/macros/s/AKfycbxEfkYwFeN5NievK0916aA7sd-sIyFEpbtXOK4tnwzOHANpq7MW6WshYIZEuEp9fJRn/exec';

  const payload = {
    correo: "test@correo.com",
    fecha: "25/04/2025",
    hora: "14:00:00",
    tipo: "Inicio de Sesión"
  };

  try {
    const response = await fetch(googleScriptURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await response.text();

    return res.status(200).json({ success: true, response: text });
  } catch (error) {
    return res.status(500).json({ error: 'Error al probar el webhook', detalle: error.message });
  }
}
