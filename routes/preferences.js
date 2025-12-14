// -------------------------
// Import packages
// -------------------------
var express = require('express');
var router = express.Router();
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// -------------------------
// [GET] /preferences/:userId
// Returns preferences or empty defaults
// -------------------------
router.get('/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const row = await prisma.preferences.findFirst({ where: { user_id: userId } });
    if (!row) {
      return res.json({
        user_id: userId,
        preferences: {
          kcal_target: 2000,
          macros: { protein: 120, carbs: 200, fat: 70 },
          liked_exercises: [],
          disliked_foods: [],
          days_per_week: 3
        }
      });
    }

    // Parse liked_exercises and disliked_foods from strings to arrays
    const likedExercises = row.liked_exercises 
      ? row.liked_exercises.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    const dislikedFoods = row.disliked_foods
      ? row.disliked_foods.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    res.json({
      user_id: userId,
      preferences: {
        kcal_target: 2000, // Default since not in schema
        macros: { protein: 120, carbs: 200, fat: 70 }, // Default since not in schema
        liked_exercises: likedExercises,
        disliked_foods: dislikedFoods,
        days_per_week: 3 // Default since not in schema
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------
// [PUT] /preferences/:userId
// Body merges into existing preferences
// -------------------------
router.put('/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const liked = Array.isArray(req.body.liked_exercises) 
      ? req.body.liked_exercises.join(',') 
      : (req.body.liked_exercises || '');
    const disliked = Array.isArray(req.body.disliked_foods) 
      ? req.body.disliked_foods.join(',') 
      : (req.body.disliked_foods || '');

    // Check if preferences exist
    const existing = await prisma.preferences.findFirst({ where: { user_id: userId } });
    
    let saved;
    if (existing) {
      saved = await prisma.preferences.update({
        where: { preference_id: existing.preference_id },
        data: {
          liked_exercises: liked,
          disliked_foods: disliked
        }
      });
    } else {
      saved = await prisma.preferences.create({
        data: {
          user_id: userId,
          liked_exercises: liked,
          disliked_foods: disliked
        }
      });
    }

    // Parse back to arrays for response
    const likedExercises = saved.liked_exercises 
      ? saved.liked_exercises.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    const dislikedFoods = saved.disliked_foods
      ? saved.disliked_foods.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    res.json({
      user_id: userId,
      preferences: {
        kcal_target: 2000, // Default since not in schema
        macros: { protein: 120, carbs: 200, fat: 70 }, // Default since not in schema
        liked_exercises: likedExercises,
        disliked_foods: dislikedFoods,
        days_per_week: 3 // Default since not in schema
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
