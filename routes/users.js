// -------------------------
// Import packages
// -------------------------
var express = require('express');
var router = express.Router();

const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

// -------------------------
// [GET] Users 
// return array of users
// -------------------------
router.get('/', async(req, res) => {
  try {
    const users = await prisma.users.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

// -------------------------
// [POST] Users 
// return created row
// -------------------------
router.post('/', async(req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is missing. Make sure to send JSON data with Content-Type: application/json' });
    }
    
    const email = req.body.email;
    const password = req.body.password;

    const exists = await prisma.users.findMany({
      where: { email }
    });

    if (exists.length > 0) {
      res.json({ "status": "user already in database" })
    } else {
      const newUser = await prisma.users.create({
        data: { email, password }
      });
      res.json(newUser);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

// -------------------------
// [DELETE] Users 
// return deleted row
// -------------------------
router.delete('/:id', async(req, res) => {
  try {
    const userId = req.params.id;

    const deleted = await prisma.users.delete({
      where: { user_id: parseInt(userId) }
    });

    res.send(deleted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

// -------------------------
// [PUT] Users 
// return updated row
// -------------------------
router.put('/:id', async(req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is missing. Make sure to send JSON data with Content-Type: application/json' });
    }
    
    const userId = req.params.id;
    const email = req.body.email;
    const password = req.body.password;

    const updated = await prisma.users.update({
      where: { user_id: parseInt(userId) },
      data: { email, password }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})
// -------------------------
// [POST] Users login
// Body: { email, password }
// Return: { token }
// -------------------------
router.post('/login', async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = await prisma.users.findFirst({
    where: {
      email: email,
      password: password    // plain text, zelfde als je huidige registratie
    }
  });

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const secret = process.env.JWT_SECRET || 'devsecret';
  const token = jwt.sign(
    { user_id: user.user_id, email: user.email },
    secret,
    { expiresIn: '7d' }
  );

  res.json({ token });
});

module.exports = router;
 