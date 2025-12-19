// -------------------------
// Import packages
// -------------------------
var express = require('express');
var router = express.Router();

const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// -------------------------
// [GET] /analytics/calories/daily
// Query: user_id, date=YYYY-MM-DD
// Returns: totals for kcal, carbs, protein, fat for that day
// -------------------------
router.get('/calories/daily', async (req, res, next) => {
  try {
    const userId = parseInt(req.query.user_id);
    const dateStr = req.query.date; // YYYY-MM-DD

    if (!userId || !dateStr) {
      return res.status(400).json({ error: 'user_id and date are required (YYYY-MM-DD)' });
    }

    const start = new Date(dateStr + 'T00:00:00');
    const end = new Date(dateStr + 'T23:59:59');

    const meals = await prisma.meals.findMany({
      where: {
        user_id: userId,
        date: { gte: start, lte: end }
      },
      include: { meal_items: { include: { foods: true } } }
    });

    const totals = meals.reduce((acc, meal) => {
      for (const item of meal.meal_items) {
        const qty = item.quantity || 1;
        acc.kcal += (item.foods.kcal || 0) * qty;
        acc.carbs += (item.foods.carbs || 0) * qty;
        acc.protein += (item.foods.protein || 0) * qty;
        acc.fat += (item.foods.fat || 0) * qty;
      }
      return acc;
    }, { kcal: 0, carbs: 0, protein: 0, fat: 0 });

    res.json({ date: dateStr, user_id: userId, totals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------
// [GET] /analytics/calories/weekly
// Query: user_id, start=YYYY-MM-DD (7 days window)
// Returns: array of { date, totals }
// -------------------------
router.get('/calories/weekly', async (req, res, next) => {
  try {
    const userId = parseInt(req.query.user_id);
    const startStr = req.query.start; // YYYY-MM-DD
    if (!userId || !startStr) {
      return res.status(400).json({ error: 'user_id and start are required (YYYY-MM-DD)' });
    }

    const start = new Date(startStr + 'T00:00:00');
    const results = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start.getTime() + i * 86400000);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;

      const dayStart = new Date(dateStr + 'T00:00:00');
      const dayEnd = new Date(dateStr + 'T23:59:59');

      const meals = await prisma.meals.findMany({
        where: { user_id: userId, date: { gte: dayStart, lte: dayEnd } },
        include: { meal_items: { include: { foods: true } } }
      });

      const totals = meals.reduce((acc, meal) => {
        for (const item of meal.meal_items) {
          const qty = item.quantity || 1;
          acc.kcal += (item.foods.kcal || 0) * qty;
          acc.carbs += (item.foods.carbs || 0) * qty;
          acc.protein += (item.foods.protein || 0) * qty;
          acc.fat += (item.foods.fat || 0) * qty;
        }
        return acc;
      }, { kcal: 0, carbs: 0, protein: 0, fat: 0 });

      results.push({ date: dateStr, totals });
    }

    res.json({ user_id: userId, start: startStr, days: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------
// [GET] /analytics/workouts/1rm
// Query: user_id, exercise
// Returns: estimated 1RM
// -------------------------
router.get('/workouts/1rm', async (req, res, next) => {
  try {
    const userId = parseInt(req.query.user_id);
    const exercise = req.query.exercise;
    if (!userId || !exercise) {
      return res.status(400).json({ error: 'user_id and exercise are required' });
    }

    // eerst exercise vinden op naam
    const exerciseRecord = await prisma.exercises.findFirst({
      where: { name: exercise }
    });

    if (!exerciseRecord) {
      return res.status(400).json({ error: `Exercise "${exercise}" not found` });
    }

    // workouts ophalen met workout_exercises voor deze exercise
    const workouts = await prisma.workouts.findMany({
      where: { user_id: userId },
      include: {
        workout_exercises: {
          where: { exercise_id: exerciseRecord.exercise_id }
        }
      },
      orderBy: { date: 'desc' },
      take: 200
    });

    let best = null;
    for (const workout of workouts) {
      for (const we of workout.workout_exercises) {
        const reps = we.reps || 0;
        const weight = we.weight || 0;
        if (reps > 0 && weight > 0) {
          const oneRm = weight * (1 + reps / 30);
          if (!best || oneRm > best.oneRm) {
            best = { date: workout.date, weight, reps, oneRm };
          }
        }
      }
    }

    if (!best) {
      return res.json({ user_id: userId, exercise, message: 'No valid sets found to estimate 1RM' });
    }

    res.json({ user_id: userId, exercise, estimate: best });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
