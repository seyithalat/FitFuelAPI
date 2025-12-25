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
// Generate a balanced meal (not just random ingredients)
// -------------------------
router.post('/recipes', async (req, res, next) => {
  try {
    const targetKcal = parseInt(req.body.target_kcal) || 600;
    const allFoods = await prisma.foods.findMany({ take: 200 });

    if (allFoods.length === 0) {
      return res.status(400).json({ error: 'No foods available in database' });
    }

    // Categorize foods for balanced meal generation
    const proteins = allFoods.filter(f => f.protein > 10 && f.protein > f.carbs);
    const carbs = allFoods.filter(f => f.carbs > 15 && f.carbs > f.protein);
    const vegetables = allFoods.filter(f => f.kcal < 50 && f.carbs < 10);
    const fats = allFoods.filter(f => f.fat > 5 && f.kcal > 100);

    // Shuffle arrays for variety
    const shuffle = (arr) => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const shuffledProteins = shuffle(proteins);
    const shuffledCarbs = shuffle(carbs);
    const shuffledVegetables = shuffle(vegetables);
    const shuffledFats = shuffle(fats);

    const mealItems = [];
    const usedFoodIds = new Set(); // om duplicaten te voorkomen
    let totalKcal = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    
    // bereken totaal voor een food item
    const calcTotals = (food, quantity) => {
      return {
        kcal: (food.kcal * quantity / 100),
        carbs: (food.carbs * quantity / 100),
        protein: (food.protein * quantity / 100),
        fat: (food.fat * quantity / 100)
      };
    };

    // verdeel calorieën over verschillende componenten
    const proteinKcal = targetKcal * 0.35;
    const carbKcal = targetKcal * 0.40;
    const vegKcal = targetKcal * 0.15;
    const fatKcal = targetKcal * 0.10;

    // maak meal item object
    const makeMealItem = (food, quantityInGrams) => {
      const quantity = Math.max(1, Math.round(quantityInGrams));
      return {
        quantity: quantity,
        foods: {
          food_id: food.food_id,
          name: food.name,
          kcal: food.kcal,
          carbs: food.carbs,
          protein: food.protein,
          fat: food.fat
        }
      };
    };

    // voeg eiwit toe
    if (shuffledProteins.length > 0) {
      const protein = shuffledProteins.find(p => !usedFoodIds.has(p.food_id)) || shuffledProteins[0];
      if (protein && protein.kcal > 0 && protein.kcal >= 10 && protein.kcal <= 500) {
        const quantityGrams = (proteinKcal / protein.kcal) * 100;
        const quantity = Math.max(50, Math.min(300, quantityGrams));
        const item = makeMealItem(protein, quantity);
        mealItems.push(item);
        usedFoodIds.add(protein.food_id);
        const totals = calcTotals(protein, item.quantity);
        totalKcal += totals.kcal;
        totalProtein += totals.protein;
        totalCarbs += totals.carbs;
        totalFat += totals.fat;
      }
    }

    // voeg koolhydraten toe
    if (shuffledCarbs.length > 0 && totalKcal < targetKcal * 0.9) {
      const carb = shuffledCarbs.find(c => !usedFoodIds.has(c.food_id)) || shuffledCarbs[0];
      const remainingKcal = Math.min(carbKcal, targetKcal - totalKcal);
      if (carb && remainingKcal > 0 && carb.kcal > 0 && carb.kcal >= 50 && carb.kcal <= 400) {
        const quantityGrams = (remainingKcal / carb.kcal) * 100;
        const quantity = Math.max(30, Math.min(200, quantityGrams));
        const item = makeMealItem(carb, quantity);
        mealItems.push(item);
        usedFoodIds.add(carb.food_id);
        const totals = calcTotals(carb, item.quantity);
        totalKcal += totals.kcal;
        totalProtein += totals.protein;
        totalCarbs += totals.carbs;
        totalFat += totals.fat;
      }
    }

    // voeg groenten toe
    if (shuffledVegetables.length > 0 && totalKcal < targetKcal * 0.95) {
      const veg = shuffledVegetables.find(v => !usedFoodIds.has(v.food_id)) || shuffledVegetables[0];
      const remainingKcal = Math.min(vegKcal, targetKcal - totalKcal);
      if (veg && remainingKcal > 10 && veg.kcal > 0 && veg.kcal >= 5 && veg.kcal <= 50) {
        const quantityGrams = (remainingKcal / veg.kcal) * 100;
        const quantity = Math.max(50, Math.min(300, quantityGrams));
        const item = makeMealItem(veg, quantity);
        mealItems.push(item);
        usedFoodIds.add(veg.food_id);
        const totals = calcTotals(veg, item.quantity);
        totalKcal += totals.kcal;
        totalProtein += totals.protein;
        totalCarbs += totals.carbs;
        totalFat += totals.fat;
      }
    }

    // voeg vetten toe als nodig
    if (shuffledFats.length > 0 && totalKcal < targetKcal * 0.95) {
      const fat = shuffledFats.find(f => !usedFoodIds.has(f.food_id)) || shuffledFats[0];
      const remainingKcal = Math.min(fatKcal, targetKcal - totalKcal);
      if (fat && remainingKcal > 5 && fat.kcal > 0 && fat.kcal >= 200 && fat.kcal <= 900) {
        const quantityGrams = (remainingKcal / fat.kcal) * 100;
        const quantity = Math.max(10, Math.min(100, quantityGrams));
        const item = makeMealItem(fat, quantity);
        mealItems.push(item);
        usedFoodIds.add(fat.food_id);
        const totals = calcTotals(fat, item.quantity);
        totalKcal += totals.kcal;
        totalProtein += totals.protein;
        totalCarbs += totals.carbs;
        totalFat += totals.fat;
      }
    }

    // als nog niet genoeg calorieën, voeg meer items toe
    if (totalKcal < targetKcal * 0.9 && mealItems.length < 5) {
      const remaining = allFoods.filter(f => 
        !usedFoodIds.has(f.food_id) && 
        f.kcal > 0 && 
        f.kcal >= 10 && 
        f.kcal <= 500
      );
      const remainingKcal = targetKcal - totalKcal;
      
      for (const food of remaining) {
        if (totalKcal >= targetKcal * 0.95) break;
        
        const quantityGrams = (remainingKcal / food.kcal) * 100;
        const quantity = Math.max(30, Math.min(150, quantityGrams));
        const item = makeMealItem(food, quantity);
        mealItems.push(item);
        usedFoodIds.add(food.food_id);
        const totals = calcTotals(food, item.quantity);
        totalKcal += totals.kcal;
        totalProtein += totals.protein;
        totalCarbs += totals.carbs;
        totalFat += totals.fat;
        
        if (mealItems.length >= 5) break;
      }
    }

    // 6. Scale all items proportionally if we're too far from target (within 5-15% range)
    if (totalKcal > 0 && (totalKcal < targetKcal * 0.85 || totalKcal > targetKcal * 1.15)) {
      const scaleFactor = targetKcal / totalKcal;
      mealItems.forEach(item => {
        item.quantity = Math.round(item.quantity * scaleFactor);
      });
      // herbereken totalen
      totalKcal = 0;
      totalProtein = 0;
      totalCarbs = 0;
      totalFat = 0;
      mealItems.forEach(item => {
        const totals = calcTotals(item.foods, item.quantity);
        totalKcal += totals.kcal;
        totalProtein += totals.protein;
        totalCarbs += totals.carbs;
        totalFat += totals.fat;
      });
    }

    // bereken eindtotalen
    const totals = {
      kcal: Math.round(totalKcal * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      protein: Math.round(totalProtein * 10) / 10,
      fat: Math.round(totalFat * 10) / 10
    };

    // format voor frontend (kcal moet gedeeld worden door 100)
    const items = mealItems.map(item => {
      const quantity = Number(item.quantity) || 0;
      
      return {
        food_id: item.foods.food_id,
        name: item.foods.name,
        quantity: quantity,
        kcal: (Number(item.foods.kcal) || 0) / 100,
        carbs: (Number(item.foods.carbs) || 0) / 100,
        protein: (Number(item.foods.protein) || 0) / 100,
        fat: (Number(item.foods.fat) || 0) / 100,
        foods: {
          food_id: item.foods.food_id,
          name: item.foods.name,
          kcal: (Number(item.foods.kcal) || 0) / 100,
          carbs: (Number(item.foods.carbs) || 0) / 100,
          protein: (Number(item.foods.protein) || 0) / 100,
          fat: (Number(item.foods.fat) || 0) / 100
        }
      };
    });

    res.json({ 
      target_kcal: targetKcal, 
      items: items,
      meal_items: mealItems,
      totals,
      meal_name: `Balanced Meal (${mealItems.length} items)`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
