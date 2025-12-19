// -------------------------
// Import packages
// -------------------------
var express = require('express');
var router = express.Router();

const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');   // zodat we de ingelogde user kunnen gebruiken

function pickSome(array, n) {
  if (!Array.isArray(array) || array.length === 0) return [];
  const copy = array.slice();
  const result = [];
  while (copy.length > 0 && result.length < n) {
    const index = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(index, 1)[0]);
  }
  return result;
}

async function getLikedExerciseNames(userId, bodyLikedArray) {
  if (Array.isArray(bodyLikedArray) && bodyLikedArray.length > 0) {
    return bodyLikedArray;
  }

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

  const all = await prisma.exercises.findMany({ take: 20 });
  return all.map(e => e.name);
}

// -------------------------
// [POST] /ai/workout-plan
// -------------------------
router.post('/workout-plan', auth, async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    let days = parseInt(req.body.days_per_week) || 3;
    if (days < 1) days = 1;
    if (days > 6) days = 6;
    const goal = (req.body.goal || 'balanced').toLowerCase();

    const allExercises = await prisma.exercises.findMany();
    
    if (allExercises.length === 0) {
      return res.status(400).json({ error: 'No exercises available' });
    }

    const likedNames = await getLikedExerciseNames(userId, req.body.liked_exercises);

    let exercisesPerDay = 3;
    if (goal === 'strength') {
      exercisesPerDay = 4;
    } else if (goal === 'endurance') {
      exercisesPerDay = 5;
    }

    let repScheme = { sets: 4, reps: 8 };
    if (goal === 'strength') {
      repScheme = { sets: 5, reps: 5 };
    } else if (goal === 'endurance') {
      repScheme = { sets: 3, reps: 15 };
    }

    const plan = [];
    const allExerciseNames = allExercises.map(e => e.name);
    const usedExercises = new Set();

    for (let dayIdx = 0; dayIdx < days; dayIdx++) {
      const dayExercises = [];
      
      const availableLiked = likedNames.filter(name => 
        allExerciseNames.includes(name) && !usedExercises.has(name)
      );
      
      if (availableLiked.length > 0 && dayIdx < availableLiked.length) {
        const likedToAdd = Math.min(1, availableLiked.length);
        const selectedLiked = pickSome(availableLiked, likedToAdd);
        selectedLiked.forEach(name => {
          dayExercises.push({
            name: name,
            sets: repScheme.sets,
            reps: repScheme.reps
          });
          usedExercises.add(name);
        });
      }

      const remaining = exercisesPerDay - dayExercises.length;
      const availableExercises = allExerciseNames.filter(name => !usedExercises.has(name));
      
      if (availableExercises.length > 0) {
        const selected = pickSome(availableExercises, Math.min(remaining, availableExercises.length));
        selected.forEach(name => {
          dayExercises.push({
            name: name,
            sets: repScheme.sets,
            reps: repScheme.reps
          });
          usedExercises.add(name);
        });
      }

      while (dayExercises.length < exercisesPerDay && allExerciseNames.length > 0) {
        const randomExercise = allExerciseNames[Math.floor(Math.random() * allExerciseNames.length)];
        dayExercises.push({
          name: randomExercise,
          sets: repScheme.sets,
          reps: repScheme.reps
        });
      }

      plan.push({ 
        day: dayIdx + 1, 
        exercises: dayExercises 
      });
    }

    res.json({
      user_id: userId,
      goal,
      days_per_week: days,
      plan
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------
// [POST] /ai/freestyle
// -------------------------
router.post('/freestyle', auth, async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    const intensity = (req.body.intensity || 'medium').toLowerCase();
    const duration = parseInt(req.body.duration_minutes) || 30;

    const allExercises = await prisma.exercises.findMany({ take: 50 });
    const allNames = [];
    for (let i = 0; i < allExercises.length; i++) {
      allNames.push(allExercises[i].name);
    }

    const likedNames = await getLikedExerciseNames(userId, req.body.liked_exercises);

    let candidates = [];
    for (let i = 0; i < likedNames.length; i++) {
      if (allNames.includes(likedNames[i])) {
        candidates.push(likedNames[i]);
      }
    }

    if (candidates.length < 3) {
      candidates = allNames;
    }

    let blockSize = 5;
    if (intensity === 'high') {
      blockSize = 6;
    } else if (intensity === 'low') {
      blockSize = 4;
    }

    const selection = pickSome(candidates, blockSize);

    let reps = 10;
    if (intensity === 'high') {
      reps = 12;
    } else if (intensity === 'low') {
      reps = 8;
    }

    let rounds = Math.round(duration / 10);
    if (rounds < 2) rounds = 2;

    const circuit = [];
    for (let i = 0; i < selection.length; i++) {
      circuit.push({ name: selection[i], reps: reps });
    }

    res.json({
      user_id: userId,
      intensity,
      duration_minutes: duration,
      rounds,
      circuit
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------
// [POST] /ai/recipes
// -------------------------
router.post('/recipes', async (req, res, next) => {
  try {
    const targetKcal = parseInt(req.body.target_kcal) || 600;
    const foods = await prisma.foods.findMany({ take: 100 });

    foods.sort((a, b) => a.kcal - b.kcal);
    const meal = [];
    let total = 0;

    for (let i = 0; i < foods.length; i++) {
      const f = foods[i];
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
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
