// -------------------------
// Import packages
// -------------------------
var express = require('express');
var router = express.Router();

const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const auth = require('../middleware/auth');

// -------------------------
// [GET] Users 
// return array of users
// -------------------------
router.get('/', async(req, res, next) => {
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
router.post('/', async(req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const is_admin = req.body.is_admin === true;

    const exists = await prisma.users.findMany({
      where: { email }
    });

    if (exists.length > 0) {
      res.json({ "status": "user already in database" })
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await prisma.users.create({
        data: { email, password: hashedPassword, is_admin }
      });
      res.json(newUser);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

// -------------------------
// [DELETE] /users/me
// Delete own account (requires auth)
// Must be before /:id route to avoid conflicts
// -------------------------
router.delete('/me', auth, async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    const deleted = await prisma.users.delete({
      where: { user_id: userId }
    });

    res.json({ message: 'Account deleted successfully', user: deleted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

// -------------------------
// [DELETE] Users 
// return deleted row
// -------------------------
router.delete('/:id', async(req, res, next) => {
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
router.put('/:id', async(req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const email = req.body.email;
    const password = req.body.password;
    const is_admin = req.body.is_admin;

    const updateData = {};
    if (typeof email !== 'undefined') updateData.email = email;
    if (typeof password !== 'undefined') {
      updateData.password = await bcrypt.hash(password, 10);
    }
    if (typeof is_admin !== 'undefined') updateData.is_admin = is_admin;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const userExists = await prisma.users.findUnique({
      where: { user_id: userId }
    });

    if (!userExists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updated = await prisma.users.update({
      where: { user_id: userId },
      data: updateData
    });

    res.json(updated);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: error.message });
  }
})
// -------------------------
// [POST] Users login
// Body: { email, password }
// Return: { token }
// -------------------------
router.post('/login', async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await prisma.users.findFirst({
      where: {
        email: email
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const secret = process.env.JWT_SECRET || 'devsecret';
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, is_admin: user.is_admin },
      secret,
      { expiresIn: '7d' }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
