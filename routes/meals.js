// -------------------------
// Import packages
// -------------------------
var express = require('express');
var router = express.Router();

const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// -------------------------
// [GET] Meals 
// return array of meals (incl. items + foods + users)
// -------------------------
router.get('/', async(req, res) => {
  try {
    const meals = await prisma.meals.findMany({
      include: {
        mealitems: { include: { foods: true } },
        users: true
      }
    });
    res.json(meals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

// -------------------------
// [POST] Meals 
// return created row (with created items)
// body.items: [{ food_id, quantity }]
// -------------------------
router.post('/', async(req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is missing. Make sure to send JSON data with Content-Type: application/json' });
    }
    
    const items = Array.isArray(req.body.items) ? req.body.items : [];

    const meal = await prisma.meals.create({
      data: {
        user_id: req.body.user_id != null ? parseInt(req.body.user_id) : undefined,
        date: req.body.date ? new Date(req.body.date) : undefined,
        mealitems: {
          create: items.map(i => ({
            food_id: i.food_id != null ? parseInt(i.food_id) : undefined,
            quantity: i.quantity != null ? parseInt(i.quantity) : undefined
          }))
        }
      },
      include: {
        mealitems: { include: { foods: true } }
      }
    });

    res.json(meal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

// -------------------------
// [DELETE] Meals 
// return deleted row
// -------------------------
router.delete('/:id', async(req, res) => {
  try {
    const mealId = req.params.id;

    const deleted = await prisma.meals.delete({
      where: { meal_id: parseInt(mealId) }
    });

    res.send(deleted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

// -------------------------
// [PUT] Meals 
// return updated row (date only, items beheer je met aparte endpoints of opnieuw posten)
// -------------------------
router.put('/:id', async(req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is missing. Make sure to send JSON data with Content-Type: application/json' });
    }
    
    const mealId = req.params.id;

    const updated = await prisma.meals.update({
      where: { meal_id: parseInt(mealId) },
      data: {
        user_id: req.body.user_id != null ? parseInt(req.body.user_id) : undefined,
        date: req.body.date ? new Date(req.body.date) : undefined
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

module.exports = router;
