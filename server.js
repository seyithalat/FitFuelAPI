// import from node_modules
const express = require('express')

// blijkbaar bestaat er een functie express(), 
// ik ga dit toevoegen in de variable app
// en later settings aan toe voegen
const app = express()

// Middleware - must be before routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logger to debug Postman issues
app.use((req, res, next) => {
  try {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
  } catch (e) {}
  next();
});

app.get('/', (req, res) => {
  res.send('API is running ');
});

// Endpoints 
const usersRouter = require('./routes/users');
const foodsRouter = require('./routes/foods');
const exercisesRouter = require('./routes/exercises');
const workoutsRouter = require('./routes/workouts');
const mealsRouter = require('./routes/meals');
const analyticsRouter = require('./routes/analytics');
const preferencesRouter = require('./routes/preferences');
const aiRouter = require('./routes/ai');

app.use('/users', usersRouter);
app.use('/foods', foodsRouter);
app.use('/exercises', exercisesRouter);
app.use('/workouts', workoutsRouter);
app.use('/meals', mealsRouter);
app.use('/analytics', analyticsRouter);
app.use('/preferences', preferencesRouter);
app.use('/ai', aiRouter);

app.listen(3000)
module.exports = app;