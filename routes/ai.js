// -------------------------
// Import packages
// -------------------------
var express = require('express');
var router = express.Router();

const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');   // zodat we de ingelogde user kunnen gebruiken

// Utility: pick N random items from array
function pickSome(array, n) {
  if (!Array.isArray(array) || array.length === 0) return [];
  const copy = [...array];
  const result = [];
  while (copy.length > 0 && result.length < n) {
    const index = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(index, 1)[0]);
  }
  return result;
}

// Helper: haal liked_exercises op
// 1) uit body.liked_exercises (als meegegeven)
// 2) anders uit preferences tabel (liked_exercises, bv. "Bench Press,Squat")
// 3) anders fallback: alle oefeningen uit DB
async function getLikedExerciseNames(userId, bodyLikedArray) {
  // 1) body override
  if (Array.isArray(bodyLikedArray) && bodyLikedArray.length > 0) {
    return bodyLikedArray;
  }

  // 2) user preferences in DB
  if (userId) {
    const prefs = await prisma.preferences.findFirst({
      where: { user_id: userId }
    });

    if (prefs && prefs.liked_exercises) {
      const fromPrefs = prefs.liked_exercises
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      if (fromPrefs.length > 0) {
        return fromPrefs;
      }
    }
  }

  // 3) fallback: neem gewoon wat oefeningen uit exercises tabel
  const all = await prisma.exercises.findMany({ take: 20 });
  return all.map(e => e.name);
}

// -------------------------
// [POST] /ai/workout-plan
// Genereert een simpel weekschema
// Body: { liked_exercises?: [string], days_per_week?: number, goal?: string }
// Gebruikt user preferences als body leeg is.
// -------------------------
router.post('/workout-plan', auth, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const days = Math.min(Math.max(parseInt(req.body.days_per_week) || 3, 1), 6);
    const goal = (req.body.goal || 'balanced').toLowerCase();

    const likedNames = await getLikedExerciseNames(userId, req.body.liked_exercises);

    // verdeel oefeningen over dagen (rondje)
    const daysArr = Array.from({ length: days }, () => []);
    likedNames.forEach((ex, i) => {
      daysArr[i % days].push(ex);
    });

    const repScheme =
      goal === 'strength'
        ? { sets: 5, reps: 5 }
        : goal === 'endurance'
        ? { sets: 3, reps: 15 }
        : { sets: 4, reps: 8 }; // balanced

    const plan = daysArr.map((list, idx) => ({
      day: idx + 1,
      exercises: list.map(name => ({ name, ...repScheme }))
    }));

    res.json({
      user_id: userId,
      goal,
      days_per_week: days,
      plan
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// -------------------------
// [POST] /ai/freestyle
// Maakt een random circuit workout,
// maar probeert eerst de voorkeuren van de user te gebruiken.
// Body: { duration_minutes?: number, intensity?: 'low'|'medium'|'high' }
// -------------------------
router.post('/freestyle', auth, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const intensity = (req.body.intensity || 'medium').toLowerCase();
    const duration = parseInt(req.body.duration_minutes) || 30;

    // Haal alle oefeningen op
    const allExercises = await prisma.exercises.findMany({ take: 50 });
    const allNames = allExercises.map(e => e.name);

    // Probeer user preferences
    const likedNames = await getLikedExerciseNames(userId, req.body.liked_exercises);

    // Gebruik alleen likedNames die ook echt in de DB bestaan
    let candidates = likedNames.filter(n => allNames.includes(n));

    // Als dat te weinig is, mix met alle oefeningen
    if (candidates.length < 3) {
      candidates = allNames;
    }

    const blockSize =
      intensity === 'high' ? 6 :
      intensity === 'low' ? 4 : 5;

    const selection = pickSome(candidates, blockSize);

    const reps =
      intensity === 'high' ? 12 :
      intensity === 'low' ? 8 : 10;

    const rounds = Math.max(2, Math.round(duration / 10));

    const circuit = selection.map(name => ({ name, reps }));

    res.json({
      user_id: userId,
      intensity,
      duration_minutes: duration,
      rounds,
      circuit
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// -------------------------
// [POST] /ai/recipes
// 
// -------------------------
router.post('/recipes', async (req, res) => {
  try {
    const targetKcal = parseInt(req.body.target_kcal) || 600;
    const foods = await prisma.foods.findMany({ take: 100 });

    // Sorteer op kcal en kies greedy tot we dicht bij target zitten
    const sorted = foods.sort((a, b) => a.kcal - b.kcal);
    const meal = [];
    let total = 0;

    for (const f of sorted) {
      if (total + f.kcal <= targetKcal) {
        meal.push({
          name: f.name,
          quantity: 1,
          kcal: f.kcal,
          carbs: f.carbs,
          protein: f.protein,
          fat: f.fat
        });
        total += f.kcal;
      }
      if (total >= targetKcal * 0.9) break;
    }

    const totals = meal.reduce(
      (acc, i) => {
        acc.kcal += i.kcal * i.quantity;
        acc.carbs += i.carbs * i.quantity;
        acc.protein += i.protein * i.quantity;
        acc.fat += i.fat * i.quantity;
        return acc;
      },
      { kcal: 0, carbs: 0, protein: 0, fat: 0 }
    );

    res.json({ target_kcal: targetKcal, items: meal, totals });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
