// -------------------------
// Import packages
// -------------------------
var express = require('express');
var router = express.Router();

const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');
// -------------------------
// [GET] Workouts 
// return array of workouts
// -------------------------
router.get('/', async (req, res, next) => {
  try {
    const data = await prisma.workouts.findMany({
      include: {
        workout_exercises: {
          include: {
            exercises: true
          }
        }
      }
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// -------------------------
// [POST] Workouts 
// return created row
// -------------------------
router.post('/', auth, async (req, res, next) => {
  try {
    const exercise = await prisma.exercises.findFirst({
      where: { name: req.body.exercise }
    });

    if (!exercise) {
      return res.status(400).json({ error: `Exercise "${req.body.exercise}" not found` });
    }

    const workout = await prisma.workouts.create({
      data: {
        user_id: req.user.user_id,
        date: req.body.date ? new Date(req.body.date) : undefined,
        workout_exercises: {
          create: {
            exercise_id: exercise.exercise_id,
            sets: Number(req.body.sets),
            reps: Number(req.body.reps),
            weight: Number(req.body.weight)
          }
        }
      },
      include: {
        workout_exercises: {
          include: {
            exercises: true
          }
        }
      }
    });
    res.json(workout);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------
// [DELETE] Workouts 
// return deleted row
// -------------------------
router.delete('/:id', async(req, res, next) => {
  try {
    const workoutId = req.params.id;

    const deleted = await prisma.workouts.delete({
      where: { workout_id: parseInt(workoutId) }
    });

    res.send(deleted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

// -------------------------
// [PUT] Workouts 
// return updated row
// -------------------------
router.put('/:id', async(req, res, next) => {
  try {
    const workoutId = req.params.id;

    const updated = await prisma.workouts.update({
      where: { workout_id: parseInt(workoutId) },
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
