export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido' });
    }
  
    const { correo, fecha, hora, tipo } = req.body;
  
    const googleScriptURL = 'https://script.google.com/macros/s/AKfycbxEfkYwFeN5NievK0916aA7sd-sIyFEpbtXOK4tnwzOHANpq7MW6WshYIZEuEp9fJRn/exec';
  
    try {
      const response = await fetch(googleScriptURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, fecha, hora, tipo }),
      });
  
      if (response.ok) {
        return res.status(200).json({ success: true });
      } else {
        return res.status(500).json({ error: 'Error al reenviar a Google Apps Script' });
      }
    } catch (error) {
      return res.status(500).json({ error: 'Error en servidor intermedio', detalle: error.message });
    }
  }
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { correo, fecha, hora, tipo } = req.body;

  const googleScriptURL = 'https://script.google.com/macros/s/AKfycbxEfkYwFeN5NievK0916aA7sd-sIyFEpbtXOK4tnwzOHANpq7MW6WshYIZEuEp9fJRn/exec';

  try {
    const response = await fetch(googleScriptURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, fecha, hora, tipo }),
    });

    if (response.ok) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(500).json({ error: 'Error al reenviar a Google Apps Script' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Error en servidor intermedio', detalle: error.message });
  }
}
  