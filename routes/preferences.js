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
router.get('/:userId', async (req, res, next) => {
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
          days_per_week: 3,
          diet_type: 'balanced'
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
        kcal_target: row.kcal_target || 2000,
        macros: { 
          protein: row.protein_target || 120, 
          carbs: row.carbs_target || 200, 
          fat: row.fat_target || 70 
        },
        liked_exercises: likedExercises,
        disliked_foods: dislikedFoods,
        days_per_week: row.days_per_week || 3,
        diet_type: row.diet_type || 'balanced'
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
router.put('/:userId', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    const liked = Array.isArray(req.body.liked_exercises) 
      ? req.body.liked_exercises.join(',') 
      : (req.body.liked_exercises || '');
    const disliked = Array.isArray(req.body.disliked_foods) 
      ? req.body.disliked_foods.join(',') 
      : (req.body.disliked_foods || '');

    const user = await prisma.users.findFirst({ where: { user_id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existing = await prisma.preferences.findFirst({ where: { user_id: userId } });
    
    const updateData = {
      liked_exercises: liked,
      disliked_foods: disliked,
      kcal_target: req.body.kcal_target != null ? parseInt(req.body.kcal_target) : undefined,
      protein_target: req.body.macros?.protein != null ? parseFloat(req.body.macros.protein) : undefined,
      carbs_target: req.body.macros?.carbs != null ? parseFloat(req.body.macros.carbs) : undefined,
      fat_target: req.body.macros?.fat != null ? parseFloat(req.body.macros.fat) : undefined,
      days_per_week: req.body.days_per_week != null ? parseInt(req.body.days_per_week) : undefined,
      diet_type: req.body.diet_type || undefined
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    let saved;
    if (existing) {
      saved = await prisma.preferences.update({
        where: { preference_id: existing.preference_id },
        data: updateData
      });
    } else {
      saved = await prisma.preferences.create({
        data: {
          user_id: userId,
          ...updateData
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
        kcal_target: saved.kcal_target || 2000,
        macros: { 
          protein: saved.protein_target || 120, 
          carbs: saved.carbs_target || 200, 
          fat: saved.fat_target || 70 
        },
        liked_exercises: likedExercises,
        disliked_foods: dislikedFoods,
        days_per_week: saved.days_per_week || 3,
        diet_type: saved.diet_type || 'balanced'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
