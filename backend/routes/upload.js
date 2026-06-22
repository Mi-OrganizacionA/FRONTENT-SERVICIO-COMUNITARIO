const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken } = require('../middleware/auth');

// Configuración de Multer: ahora guardamos en memoria RAM para no escribir en disco
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes.'));
    }
  }
});

// Endpoint: POST /api/upload
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ninguna imagen.' });
    }
    
    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'La API Key de ImgBB no está configurada.' });
    }

    const base64Image = req.file.buffer.toString('base64');
    
    // Preparar el cuerpo de la petición para ImgBB
    const formData = new URLSearchParams();
    formData.append('image', base64Image);

    // Enviar la imagen a la API de ImgBB
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('Error de ImgBB:', data);
      return res.status(500).json({ error: 'Error al subir la imagen al servidor remoto (ImgBB).' });
    }

    // data.data.url contiene el enlace directo a la imagen en ImgBB
    const fileUrl = data.data.url;
    
    res.status(200).json({ url: fileUrl });
  } catch (error) {
    console.error('Error en /api/upload (ImgBB):', error);
    res.status(500).json({ error: 'Error interno del servidor al procesar la imagen.' });
  }
});

module.exports = router;
