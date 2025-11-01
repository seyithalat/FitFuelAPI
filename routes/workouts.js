// -------------------------
// Import packages
// -------------------------
var express = require('express');
var router = express.Router();

const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// -------------------------
// [GET] Workouts 
// return array of workouts
// -------------------------
router.get('/', async(req, res) => {
  try {
    const workouts = await prisma.workouts.findMany();
    res.json(workouts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

// -------------------------
// [POST] Workouts 
// return created row
// -------------------------
router.post('/', async(req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is missing. Make sure to send JSON data with Content-Type: application/json' });
    }
    
    const workout = await prisma.workouts.create({
      data: { 
        user_id: req.body.user_id,
        exercise: req.body.exercise,   // bijv. "Bench Press"
        sets: req.body.sets,           // bijv. 3
        reps: req.body.reps,           // bijv. 8
        weight: req.body.weight,       // bijv. 60
        date: req.body.date ? new Date(req.body.date) : undefined
      }
    });
    res.json(workout);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

// -------------------------
// [DELETE] Workouts 
// return deleted row
// -------------------------
router.delete('/:id', async(req, res) => {
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
router.put('/:id', async(req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is missing. Make sure to send JSON data with Content-Type: application/json' });
    }
    
    const workoutId = req.params.id;

    const updated = await prisma.workouts.update({
      where: { workout_id: parseInt(workoutId) },
      data: { 
        user_id: req.body.user_id,
        exercise: req.body.exercise,
        sets: req.body.sets,
        reps: req.body.reps,
        weight: req.body.weight,
        date: req.body.date ? new Date(req.body.date) : undefined
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

module.exports = router;
