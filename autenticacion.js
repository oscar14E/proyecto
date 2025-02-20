require('dotenv').config();
const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// 📌 Servir archivos estáticos (página principal accesible sin login)
app.use(express.static(path.join(__dirname, 'public')));

// 📌 Ruta para la página de login (no accesible directamente en public)
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// 📌 Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Conectado a la base de datos'))
  .catch(err => console.error('❌ Error de conexión a la base de datos', err));

// 📌 Esquema y modelo de usuario
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'estudiante', 'docente'], required: true }
});
const User = mongoose.model('User', userSchema);

// 📌 Endpoint de login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).send('❌ Credenciales incorrectas');
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).send('❌ Error en el login');
  }
});

// 📌 Ruta protegida después del login
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));  // Esta sería la página protegida después del login
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Servidor en http://localhost:${port}`);
});
