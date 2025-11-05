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
router.get('/calories/daily', async (req, res) => {
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
      include: { mealitems: { include: { foods: true } } }
    });

    const totals = meals.reduce((acc, meal) => {
      for (const item of meal.mealitems) {
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
router.get('/calories/weekly', async (req, res) => {
  try {
    const userId = parseInt(req.query.user_id);
    const startStr = req.query.start; // YYYY-MM-DD
    if (!userId || !startStr) {
      return res.status(400).json({ error: 'user_id and start are required (YYYY-MM-DD)' });
    }

    const start = new Date(startStr + 'T00:00:00');
    const days = [...Array(7).keys()].map(i => new Date(start.getTime() + i * 86400000));

    const results = [];
    for (const d of days) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;

      const dayStart = new Date(dateStr + 'T00:00:00');
      const dayEnd = new Date(dateStr + 'T23:59:59');

      const meals = await prisma.meals.findMany({
        where: { user_id: userId, date: { gte: dayStart, lte: dayEnd } },
        include: { mealitems: { include: { foods: true } } }
      });

      const totals = meals.reduce((acc, meal) => {
        for (const item of meal.mealitems) {
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
// Returns: estimated 1RM using Epley formula = weight * (1 + reps/30)
// -------------------------
router.get('/workouts/1rm', async (req, res) => {
  try {
    const userId = parseInt(req.query.user_id);
    const exercise = req.query.exercise;
    if (!userId || !exercise) {
      return res.status(400).json({ error: 'user_id and exercise are required' });
    }

    const sets = await prisma.workouts.findMany({
      where: { user_id: userId, exercise },
      orderBy: { date: 'desc' },
      take: 200
    });

    let best = null;
    for (const s of sets) {
      const reps = s.reps || 0;
      const weight = s.weight || 0;
      if (reps > 0 && weight > 0) {
        const oneRm = weight * (1 + reps / 30);
        if (!best || oneRm > best.oneRm) {
          best = { date: s.date, weight, reps, oneRm };
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







