// -------------------------
// Import packages
// -------------------------
var express = require('express');
var router = express.Router();

const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const auth = require('../middleware/auth'); 
// -------------------------
// [GET] Meals 
// return array of meals (incl. items + foods + users)
// -------------------------
router.get('/', async(req, res, next) => {
  try {
    const data = await prisma.meals.findMany({
      include: {
        meal_items: { include: { foods: true } },
        users: true
      },
      orderBy: { date: 'desc' }
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

// -------------------------
// [POST] Meals 
// return created row (with created items)
// body.items: [{ food_id, quantity }]
// -------------------------
router.post('/', auth, async (req, res, next) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];

    const mealData = {
      user_id: req.user.user_id,                       
      date: req.body.date ? new Date(req.body.date) : undefined
    };

    if (items.length > 0) {
      mealData.meal_items = {
        create: items.map(i => ({
          food_id: i.food_id,
          quantity: parseFloat(i.quantity) || 100
        }))
      };
    }

    const meal = await prisma.meals.create({
      data: mealData,
      include: {
        meal_items: {
          include: { foods: true }
        }
      }
    });

    res.json(meal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------
// [DELETE] Meal Item
// Deze route moet VOOR /:id staan anders werkt het niet goed
// -------------------------
router.delete('/:mealId/items/:itemId', auth, async (req, res, next) => {
  try {
    const mealId = parseInt(req.params.mealId);
    const itemId = parseInt(req.params.itemId);

    // First verify the meal belongs to the user
    const meal = await prisma.meals.findUnique({
      where: { meal_id: mealId },
      include: { meal_items: true }
    });

    if (!meal) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    if (meal.user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Not authorized to delete this meal item' });
    }

    // Verify the item belongs to this meal
    const item = meal.meal_items.find(item => item.meal_item_id === itemId);
    if (!item) {
      return res.status(404).json({ error: 'Meal item not found' });
    }

    // Delete the meal item
    const deleted = await prisma.meal_items.delete({
      where: { meal_item_id: itemId }
    });

    res.json(deleted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------
// [DELETE] Meals 
// return deleted row
// -------------------------
router.delete('/:id', async(req, res, next) => {
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
// -------------------------
router.put('/:id', async (req, res, next) => {
  try {
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
});

module.exports = router;
