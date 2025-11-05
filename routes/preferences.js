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
    const row = await prisma.userpreferences.findUnique({ where: { user_id: userId } });
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

    res.json({
      user_id: userId,
      preferences: {
        kcal_target: row.kcal_target,
        macros: { protein: row.protein_target, carbs: row.carbs_target, fat: row.fat_target },
        liked_exercises: row.liked_exercises || [],
        disliked_foods: row.disliked_foods || [],
        days_per_week: row.days_per_week ?? 3
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
    const kcal_target = req.body.kcal_target ?? 2000;
    const protein = req.body.macros?.protein ?? 120;
    const carbs = req.body.macros?.carbs ?? 200;
    const fat = req.body.macros?.fat ?? 70;
    const liked = Array.isArray(req.body.liked_exercises) ? req.body.liked_exercises : [];
    const disliked = Array.isArray(req.body.disliked_foods) ? req.body.disliked_foods : [];
    const days = req.body.days_per_week ?? 3;

    const saved = await prisma.userpreferences.upsert({
      where: { user_id: userId },
      update: {
        kcal_target,
        protein_target: protein,
        carbs_target: carbs,
        fat_target: fat,
        liked_exercises: liked,
        disliked_foods: disliked,
        days_per_week: days
      },
      create: {
        user_id: userId,
        kcal_target,
        protein_target: protein,
        carbs_target: carbs,
        fat_target: fat,
        liked_exercises: liked,
        disliked_foods: disliked,
        days_per_week: days
      }
    });

    res.json({
      user_id: userId,
      preferences: {
        kcal_target: saved.kcal_target,
        macros: { protein: saved.protein_target, carbs: saved.carbs_target, fat: saved.fat_target },
        liked_exercises: saved.liked_exercises || [],
        disliked_foods: saved.disliked_foods || [],
        days_per_week: saved.days_per_week ?? 3
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


