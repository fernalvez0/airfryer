const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const BASE_URL        = process.env.BASE_URL || 'https://airfryer.onrender.com';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Crear preferencia de pago con back_urls ──
app.post('/crear-pago', async (req, res) => {
  try {
    const { precio } = req.body;

    // Determinar precio y título según el estado del contador
    const value = precio === 'full' ? 25000 : 4900;
    const title = precio === 'full'
      ? 'Recetario Air Fryer – Precio regular'
      : 'Recetario Air Fryer – Precio de oferta';

    const preference = {
      items: [
        {
          title:      title,
          quantity:   1,
          unit_price: value,
          currency_id: 'ARS'
        }
      ],
      back_urls: {
        success: `${BASE_URL}/gracias`,
        failure: `${BASE_URL}/`,
        pending: `${BASE_URL}/`
      },
      auto_return: 'approved',
      statement_descriptor: 'Recetario Air Fryer',
      binary_mode: true  // solo aprobado o rechazado, sin pendiente
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
      },
      body: JSON.stringify(preference)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('MP error:', data);
      return res.status(500).json({ error: 'Error creando preferencia', detail: data });
    }

    // Devolver la URL de checkout de MP
    res.json({ url: data.init_point });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── Rutas para las páginas HTML ──
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/gracias', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'gracias.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
