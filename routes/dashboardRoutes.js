const express = require('express');
const path = require('path');
const verifyToken = require('../middleware/verifyToken'); // Importamos el middleware

const router = express.Router();

// Ruta del dashboard de administrador
router.get('/admin/dashboard', verifyToken, (req, res) => {
  if (req.user.role === 'admin') {
    return res.sendFile(path.join(__dirname, '..', 'views', 'admin', 'dashboard.html'));
  } else {
    return res.status(403).json({ error: 'Acceso no autorizado' });
  }
});

// Ruta del dashboard de estudiantes
router.get('/estudiantes/dashboard', verifyToken, (req, res) => {
  if (req.user.role === 'estudiante') {
    return res.sendFile(path.join(__dirname, '..', 'views', 'estudiantes', 'dashboard.html'));
  } else {
    return res.status(403).json({ error: 'Acceso no autorizado' });
  }
});

// Ruta del dashboard de profesores
router.get('/profesores/dashboard', verifyToken, (req, res) => {
  if (req.user.role === 'profesor') {
    return res.sendFile(path.join(__dirname, '..', 'views', 'profesores', 'dashboard.html'));
  } else {
    return res.status(403).json({ error: 'Acceso no autorizado' });
  }
});

module.exports = router;