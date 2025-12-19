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
router.get('/', async(req, res, next) => {
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
router.post('/', async(req, res, next) => {
  try {
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
router.delete('/:id', async(req, res, next) => {
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
// [PUT] Exercises (bulk update)
// Body: array of { exercise_id, name, primary_muscle }
// return array of updated rows
// -------------------------
router.put('/', async(req, res, next) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Body must be an array of exercises' });
    }

    const updatedExercises = [];

    for (let i = 0; i < req.body.length; i++) {
      const exercise = req.body[i];
      
      if (!exercise.exercise_id) {
        continue;
      }

      const updateData = {};
      if (exercise.name) updateData.name = exercise.name;
      if (exercise.primary_muscle) updateData.primary_muscle = exercise.primary_muscle;

      if (Object.keys(updateData).length > 0) {
        try {
          const updated = await prisma.exercises.update({
            where: { exercise_id: parseInt(exercise.exercise_id) },
            data: updateData
          });
          updatedExercises.push(updated);
        } catch (error) {
          if (error.code !== 'P2025') {
            throw error;
          }
        }
      }
    }

    res.json(updatedExercises);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

// -------------------------
// [PUT] Exercises 
// return updated row
// -------------------------
router.put('/:id', async(req, res, next) => {
  try {
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
