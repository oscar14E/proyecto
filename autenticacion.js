require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'views')));

// Conectar a la base de datos
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Conectado a la base de datos'))
  .catch(err => console.error('Error de conexión a la base de datos', err));

// Esquema y modelo de usuario
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'estudiante', 'docente'], required: true }
});
const User = mongoose.model('User', userSchema);

// Endpoint de registro
app.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send('Usuario ya registrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, role });
    await user.save();
    res.status(201).send('Usuario registrado');
  } catch (error) {
    res.status(500).send('Error en el registro');
  }
});

// Endpoint de login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).send('Credenciales incorrectas');
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).send('Error en el login');
  }
});

// Recuperación de contraseña
app.post('/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).send('Usuario no encontrado');
      }
  
      // Generar un token con expiración de 15 minutos
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
  
      // Configurar el transporte de correo
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS,
        },
      });
  
      // Configurar el correo
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: user.email,
        subject: 'Recuperación de contraseña',
        html: `
          <p>Hola,</p>
          <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
          <a href="http://localhost:3000/reset-password/${token}">Restablecer contraseña</a>
          <p>Este enlace expirará en 15 minutos.</p>
        `,
      };
  
      // Enviar el correo
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return res.status(500).send('Error al enviar el correo');
        }
        res.send('Correo de recuperación enviado');
      });
    } catch (error) {
      res.status(500).send('Error en la recuperación de contraseña');
    }
  });

// Endpoint para restablecer la contraseña
app.post('/reset-password/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;
  
      // Verificar el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).send('Usuario no encontrado');
      }
  
      // Hashear la nueva contraseña y guardarla
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      await user.save();
  
      res.send('Contraseña restablecida con éxito');
    } catch (error) {
      res.status(500).send('Error al restablecer la contraseña');
    }
  });

// Middleware para verificar token
function authenticateToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Ruta para servir el login.html
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Ruta para servir el reset-password.html
app.get('/reset-password/:token', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'reset-password.html'));
});

app.listen(3000, () => {
  console.log('Servidor escuchando en el puerto 3000');
});