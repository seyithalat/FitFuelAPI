// -------------------------
// Import packages
// -------------------------
var express = require('express');
var router = express.Router();

const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// -------------------------
// [GET] Exercises 
// return array of exercises
// -------------------------
router.get('/', async(req, res) => {
  try {
    const exercises = await prisma.exercises.findMany();
    res.json(exercises);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

// -------------------------
// [POST] Exercises 
// return created row
// -------------------------
router.post('/', async(req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is missing. Make sure to send JSON data with Content-Type: application/json' });
    }
    
    const exercise = await prisma.exercises.create({
      data: {
        name: req.body.name,
        primary_muscle: req.body.primary_muscle
      }
    });
    res.json(exercise);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

// -------------------------
// [DELETE] Exercises 
// return deleted row
// -------------------------
router.delete('/:id', async(req, res) => {
  try {
    const exerciseId = req.params.id;

    const deleted = await prisma.exercises.delete({
      where: { exercise_id: parseInt(exerciseId) }
    });

    res.send(deleted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

// -------------------------
// [PUT] Exercises 
// return updated row
// -------------------------
router.put('/:id', async(req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is missing. Make sure to send JSON data with Content-Type: application/json' });
    }
    
    const exerciseId = req.params.id;

    const updated = await prisma.exercises.update({
      where: { exercise_id: parseInt(exerciseId) },
      data: {
        name: req.body.name,
        primary_muscle: req.body.primary_muscle
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

module.exports = router;
