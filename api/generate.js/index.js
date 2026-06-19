export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada en el servidor.' });
  }

  try {
    const { objetivo, rol, tipo, formato, restricciones } = req.body;

    if (!objetivo || !objetivo.trim()) {
      return res.status(400).json({ error: 'El campo "objetivo" es obligatorio.' });
    }

    const metaPrompt = `Eres un experto en prompt engineering de nivel mundial. Tu misión es crear un SUPERPROMPT optimizado basándose en los inputs del usuario.

Un superprompt tiene estas características:
- Define claramente el rol de la IA
- Establece el contexto y objetivo con precisión
- Incluye instrucciones de comportamiento y restricciones
- Especifica el formato exacto de salida
- Usa técnicas avanzadas: chain-of-thought, few-shot si aplica, delimitadores claros
- Es específico, accionable y reutilizable
- Está escrito en español

INPUTS DEL USUARIO:
- Objetivo: ${objetivo}
- Rol deseado para la IA: ${rol || 'Define el más adecuado'}
- Tipo de prompt: ${tipo || 'instrucción de sistema'}
- Formato de salida preferido: ${formato || 'El más adecuado al objetivo'}
- Restricciones/Contexto extra: ${restricciones || 'Ninguno'}

INSTRUCCIONES:
Genera ÚNICAMENTE el superprompt final, listo para usar. No añadas explicaciones, introducciones ni comentarios. El output debe ser el prompt en sí, comenzando directamente con el contenido. Escríbelo en español.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1000,
        messages: [{ role: 'user', content: metaPrompt }]
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: errData.error?.message || `Error de la API de Anthropic (${response.status})`
      });
    }

    const data = await response.json();
    const text = data.content?.map(b => b.text || '').join('') || '';

    if (!text) {
      return res.status(500).json({ error: 'Respuesta vacía de la API.' });
    }

    return res.status(200).json({ text });

  } catch (err) {
    console.error('Error en /api/generate:', err);
    return res.status(500).json({ error: err.message || 'Error interno del servidor.' });
  }
}
