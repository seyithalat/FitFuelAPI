// -------------------------
// Import packages
// -------------------------
var express = require('express');
var router = express.Router();

const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// Utility: pick N items from array evenly
function pickSome(array, n) {
  if (!Array.isArray(array) || array.length === 0) return [];
  const copy = [...array];
  const result = [];
  while (copy.length > 0 && result.length < n) {
    result.push(copy.shift());
  }
  return result;
}

// -------------------------
// [POST] /ai/workout-plan
// Body: { user_id?, liked_exercises?: [string], days_per_week?: number, goal?: string }
// Returns: plan split across days, simple periodization template
// -------------------------
router.post('/workout-plan', async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.body.days_per_week) || 3, 1), 6);
    const goal = (req.body.goal || 'balanced').toLowerCase();

    let liked = Array.isArray(req.body.liked_exercises) ? req.body.liked_exercises : [];
    if (liked.length === 0) {
      const all = await prisma.exercises.findMany({ take: 20 });
      liked = all.map(e => e.name);
    }

    // Split liked exercises across days
    const daysArr = Array.from({ length: days }, () => []);
    liked.forEach((ex, i) => { daysArr[i % days].push(ex); });

    const repScheme = goal === 'strength' ? { sets: 5, reps: 5 } : goal === 'endurance' ? { sets: 3, reps: 15 } : { sets: 4, reps: 8 };
    const plan = daysArr.map((list, idx) => ({
      day: idx + 1,
      exercises: list.map(name => ({ name, ...repScheme }))
    }));

    res.json({ goal, days_per_week: days, plan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------
// [POST] /ai/freestyle
// Body: { duration_minutes?: number, intensity?: 'low'|'medium'|'high' }
// Returns: mixed circuit from available exercises
// -------------------------
router.post('/freestyle', async (req, res) => {
  try {
    const intensity = (req.body.intensity || 'medium').toLowerCase();
    const duration = parseInt(req.body.duration_minutes) || 30;

    const all = await prisma.exercises.findMany({ take: 30 });
    const names = all.map(e => e.name);
    const blockSize = intensity === 'high' ? 6 : intensity === 'low' ? 4 : 5;
    const selection = pickSome(names, blockSize);

    const reps = intensity === 'high' ? 12 : intensity === 'low' ? 8 : 10;
    const rounds = Math.max(2, Math.round(duration / 10));

    const circuit = selection.map(name => ({ name, reps }));
    res.json({ intensity, duration_minutes: duration, rounds, circuit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------
// [POST] /ai/recipes
// Body: { target_kcal?: number, macros?: { protein, carbs, fat } }
// Simple heuristic composition from foods table avoiding overshoot
// -------------------------
router.post('/recipes', async (req, res) => {
  try {
    const targetKcal = parseInt(req.body.target_kcal) || 600;
    const foods = await prisma.foods.findMany({ take: 100 });

    // Greedy choose items until close to targetKcal
    const sorted = foods.sort((a, b) => a.kcal - b.kcal);
    const meal = [];
    let total = 0;
    for (const f of sorted) {
      if (total + f.kcal <= targetKcal) {
        meal.push({ name: f.name, quantity: 1, kcal: f.kcal, carbs: f.carbs, protein: f.protein, fat: f.fat });
        total += f.kcal;
      }
      if (total >= targetKcal * 0.9) break;
    }

    const totals = meal.reduce((acc, i) => {
      acc.kcal += i.kcal * i.quantity;
      acc.carbs += i.carbs * i.quantity;
      acc.protein += i.protein * i.quantity;
      acc.fat += i.fat * i.quantity;
      return acc;
    }, { kcal: 0, carbs: 0, protein: 0, fat: 0 });

    res.json({ target_kcal: targetKcal, items: meal, totals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


