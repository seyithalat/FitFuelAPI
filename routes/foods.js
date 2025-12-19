// -------------------------
// Import packages
// -------------------------
var express = require('express');
var router = express.Router();

const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// -------------------------
// [GET] Foods 
// return array of foods
// -------------------------
router.get('/', async(req, res, next) => {
  try {
    const foods = await prisma.foods.findMany();
    res.json(foods);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

// -------------------------
// [POST] Foods 
// return created row
// -------------------------
router.post('/', async(req, res, next) => {
  try {
    const food = await prisma.foods.create({
      data: { 
        name: req.body.name,
        kcal: req.body.kcal != null ? parseInt(req.body.kcal) : undefined,
        carbs: req.body.carbs != null ? parseFloat(req.body.carbs) : undefined,
        protein: req.body.protein != null ? parseFloat(req.body.protein) : undefined,
        fat: req.body.fat != null ? parseFloat(req.body.fat) : undefined
      }
    });
    res.json(food);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

// -------------------------
// [DELETE] Foods 
// return deleted row
// -------------------------
router.delete('/:id', async(req, res, next) => {
  try {
    const foodId = req.params.id;

    const deleted = await prisma.foods.delete({
      where: { food_id: parseInt(foodId) }
    });

    res.send(deleted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

// -------------------------
// [PUT] Foods 
// return updated row
// -------------------------
router.put('/:id', async(req, res, next) => {
  try {
    const foodId = req.params.id;

    const updated = await prisma.foods.update({
      where: { food_id: parseInt(foodId) },
      data: {
        name: req.body.name,
        kcal: req.body.kcal != null ? parseInt(req.body.kcal) : undefined,
        carbs: req.body.carbs != null ? parseFloat(req.body.carbs) : undefined,
        protein: req.body.protein != null ? parseFloat(req.body.protein) : undefined,
        fat: req.body.fat != null ? parseFloat(req.body.fat) : undefined
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

module.exports = router;
