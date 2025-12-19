// -------------------------
// Import packages
// -------------------------
var express = require('express');
var router = express.Router();

const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/admin');

// -------------------------
// [GET] /admin/users
// Get all users with stats
// -------------------------
router.get('/users', adminAuth, async (req, res, next) => {
  try {
    const search = req.query.search || '';
    const users = await prisma.users.findMany({
      include: {
        _count: {
          select: {
            workouts: true,
            meals: true
          }
        }
      },
      orderBy: {
        user_id: 'asc'
      }
    });

    let filtered = users;
    if (search) {
      filtered = users.filter(u => 
        u.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    const result = filtered.map(user => ({
      user_id: user.user_id,
      email: user.email,
      is_admin: user.is_admin,
      workout_count: user._count.workouts,
      meal_count: user._count.meals
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------
// [PUT] /admin/users/:id
// -------------------------
router.put('/users/:id', adminAuth, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const updateData = {};

    if (req.body.email !== undefined) updateData.email = req.body.email;
    if (req.body.password !== undefined) updateData.password = req.body.password;
    if (req.body.is_admin !== undefined) updateData.is_admin = req.body.is_admin;

    const updated = await prisma.users.update({
      where: { user_id: userId },
      data: updateData
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------
// [DELETE] /admin/users/:id
// -------------------------
router.delete('/users/:id', adminAuth, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    const deleted = await prisma.users.delete({
      where: { user_id: userId }
    });

    res.json(deleted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------
// [GET] /admin/workouts
// -------------------------
router.get('/workouts', adminAuth, async (req, res, next) => {
  try {
    const workouts = await prisma.workouts.findMany({
      include: {
        users: true,
        workout_exercises: {
          include: {
            exercises: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    res.json(workouts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------
// [DELETE] /admin/workouts/:id
// -------------------------
router.delete('/workouts/:id', adminAuth, async (req, res, next) => {
  try {
    const workoutId = parseInt(req.params.id);

    const deleted = await prisma.workouts.delete({
      where: { workout_id: workoutId }
    });

    res.json(deleted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------
// [GET] /admin/meals
// -------------------------
router.get('/meals', adminAuth, async (req, res, next) => {
  try {
    const meals = await prisma.meals.findMany({
      include: {
        users: true,
        meal_items: {
          include: {
            foods: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    res.json(meals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------
// [DELETE] /admin/meals/:id
// -------------------------
router.delete('/meals/:id', adminAuth, async (req, res, next) => {
  try {
    const mealId = parseInt(req.params.id);

    const deleted = await prisma.meals.delete({
      where: { meal_id: mealId }
    });

    res.json(deleted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------
// [GET] /admin/stats
// -------------------------
router.get('/stats', adminAuth, async (req, res, next) => {
  try {
    const totalUsers = await prisma.users.count();
    const totalWorkouts = await prisma.workouts.count();
    const totalMeals = await prisma.meals.count();
    const totalExercises = await prisma.exercises.count();
    const totalFoods = await prisma.foods.count();

    const mostUsedExercises = await prisma.workout_exercises.groupBy({
      by: ['exercise_id'],
      _count: {
        workout_exercise_id: true
      },
      orderBy: {
        _count: {
          workout_exercise_id: 'desc'
        }
      },
      take: 5
    });

    const exerciseIds = mostUsedExercises.map(e => e.exercise_id);
    const exercises = await prisma.exercises.findMany({
      where: { exercise_id: { in: exerciseIds } }
    });

    const exerciseMap = {};
    exercises.forEach(e => {
      exerciseMap[e.exercise_id] = e.name;
    });

    const mostUsedFoods = await prisma.meal_items.groupBy({
      by: ['food_id'],
      _count: {
        meal_item_id: true
      },
      orderBy: {
        _count: {
          meal_item_id: 'desc'
        }
      },
      take: 5
    });

    const foodIds = mostUsedFoods.map(f => f.food_id);
    const foods = await prisma.foods.findMany({
      where: { food_id: { in: foodIds } }
    });

    const foodMap = {};
    foods.forEach(f => {
      foodMap[f.food_id] = f.name;
    });

    const topExercises = mostUsedExercises.map(e => ({
      exercise_id: e.exercise_id,
      name: exerciseMap[e.exercise_id],
      count: e._count.workout_exercise_id
    }));

    const topFoods = mostUsedFoods.map(f => ({
      food_id: f.food_id,
      name: foodMap[f.food_id],
      count: f._count.meal_item_id
    }));

    const allUsers = await prisma.users.findMany({
      include: {
        _count: {
          select: {
            workouts: true,
            meals: true
          }
        }
      }
    });

    allUsers.sort((a, b) => {
      const totalA = a._count.workouts + a._count.meals;
      const totalB = b._count.workouts + b._count.meals;
      return totalB - totalA;
    });

    const mostActiveUsers = allUsers.slice(0, 5);

    const activeUsers = mostActiveUsers.map(u => ({
      user_id: u.user_id,
      email: u.email,
      workout_count: u._count.workouts,
      meal_count: u._count.meals
    }));

    res.json({
      totals: {
        users: totalUsers,
        workouts: totalWorkouts,
        meals: totalMeals,
        exercises: totalExercises,
        foods: totalFoods
      },
      most_used_exercises: topExercises,
      most_used_foods: topFoods,
      most_active_users: activeUsers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------
// [POST] /admin/exercises
// -------------------------
router.post('/exercises', adminAuth, async (req, res, next) => {
  try {
    const exercise = await prisma.exercises.create({
      data: {
        name: req.body.name,
        primary_muscle: req.body.primary_muscle
      }
    });
    res.json(exercise);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------
// [PUT] /admin/exercises/:id
// -------------------------
router.put('/exercises/:id', adminAuth, async (req, res, next) => {
  try {
    const exerciseId = parseInt(req.params.id);
    const updateData = {};

    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.primary_muscle !== undefined) updateData.primary_muscle = req.body.primary_muscle;

    const updated = await prisma.exercises.update({
      where: { exercise_id: exerciseId },
      data: updateData
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------
// [DELETE] /admin/exercises/:id
// -------------------------
router.delete('/exercises/:id', adminAuth, async (req, res, next) => {
  try {
    const exerciseId = parseInt(req.params.id);

    const deleted = await prisma.exercises.delete({
      where: { exercise_id: exerciseId }
    });

    res.json(deleted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------
// [POST] /admin/foods
// -------------------------
router.post('/foods', adminAuth, async (req, res, next) => {
  try {
    const food = await prisma.foods.create({
      data: {
        name: req.body.name,
        kcal: req.body.kcal != null ? parseInt(req.body.kcal) : undefined,
        carbs: req.body.carbs != null ? parseFloat(req.body.carbs) : undefined,
        protein: req.body.protein != null ? parseFloat(req.body.protein) : undefined,
        fat: req.body.fat != null ? parseFloat(req.body.fat) : undefined
      }
    });
    res.json(food);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------
// [PUT] /admin/foods/:id
// -------------------------
router.put('/foods/:id', adminAuth, async (req, res, next) => {
  try {
    const foodId = parseInt(req.params.id);
    const updateData = {};

    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.kcal !== undefined) updateData.kcal = parseInt(req.body.kcal);
    if (req.body.carbs !== undefined) updateData.carbs = parseFloat(req.body.carbs);
    if (req.body.protein !== undefined) updateData.protein = parseFloat(req.body.protein);
    if (req.body.fat !== undefined) updateData.fat = parseFloat(req.body.fat);

    const updated = await prisma.foods.update({
      where: { food_id: foodId },
      data: updateData
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------
// [DELETE] /admin/foods/:id
// -------------------------
router.delete('/foods/:id', adminAuth, async (req, res, next) => {
  try {
    const foodId = parseInt(req.params.id);

    const deleted = await prisma.foods.delete({
      where: { food_id: foodId }
    });

    res.json(deleted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

