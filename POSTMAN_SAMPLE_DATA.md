# Postman Sample Data Guide for FitFuel API

Use these requests in Postman to populate your database with sample data.

**Base URL:** `http://localhost:3000`

---

## 1. USERS (Create Users First!)

### Request 1: Create User 1
- **Method:** POST
- **URL:** `http://localhost:3000/users`
- **Headers:** `Content-Type: application/json`
- **Body (JSON):**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Request 2: Create User 2
- **Method:** POST
- **URL:** `http://localhost:3000/users`
- **Body (JSON):**
```json
{
  "email": "sarah@example.com",
  "password": "password123"
}
```

### Request 3: Create User 3
- **Method:** POST
- **URL:** `http://localhost:3000/users`
- **Body (JSON):**
```json
{
  "email": "mike@example.com",
  "password": "password123"
}
```

**Note:** After creating users, login to get JWT tokens for authenticated requests:
- **POST** `http://localhost:3000/users/login`
- **Body:** `{ "email": "john@example.com", "password": "password123" }`
- **Save the token** for use in Authorization header: `Bearer <token>`

---

## 2. EXERCISES (No auth required)

### Request 1: Bench Press
- **Method:** POST
- **URL:** `http://localhost:3000/exercises`
- **Body (JSON):**
```json
{
  "name": "Bench Press",
  "primary_muscle": "Chest"
}
```

### Request 2: Squat
- **Method:** POST
- **URL:** `http://localhost:3000/exercises`
- **Body (JSON):**
```json
{
  "name": "Squat",
  "primary_muscle": "Legs"
}
```

### Request 3: Deadlift
- **Method:** POST
- **URL:** `http://localhost:3000/exercises`
- **Body (JSON):**
```json
{
  "name": "Deadlift",
  "primary_muscle": "Back"
}
```

### Request 4: Overhead Press
- **Method:** POST
- **URL:** `http://localhost:3000/exercises`
- **Body (JSON):**
```json
{
  "name": "Overhead Press",
  "primary_muscle": "Shoulders"
}
```

### Request 5: Barbell Row
- **Method:** POST
- **URL:** `http://localhost:3000/exercises`
- **Body (JSON):**
```json
{
  "name": "Barbell Row",
  "primary_muscle": "Back"
}
```

### Request 6: Pull-ups
- **Method:** POST
- **URL:** `http://localhost:3000/exercises`
- **Body (JSON):**
```json
{
  "name": "Pull-ups",
  "primary_muscle": "Back"
}
```

### Request 7: Bicep Curls
- **Method:** POST
- **URL:** `http://localhost:3000/exercises`
- **Body (JSON):**
```json
{
  "name": "Bicep Curls",
  "primary_muscle": "Arms"
}
```

### Request 8: Tricep Dips
- **Method:** POST
- **URL:** `http://localhost:3000/exercises`
- **Body (JSON):**
```json
{
  "name": "Tricep Dips",
  "primary_muscle": "Arms"
}
```

### Request 9: Leg Press
- **Method:** POST
- **URL:** `http://localhost:3000/exercises`
- **Body (JSON):**
```json
{
  "name": "Leg Press",
  "primary_muscle": "Legs"
}
```

### Request 10: Lunges
- **Method:** POST
- **URL:** `http://localhost:3000/exercises`
- **Body (JSON):**
```json
{
  "name": "Lunges",
  "primary_muscle": "Legs"
}
```

---

## 3. FOODS (No auth required)

### Request 1: Chicken Breast
- **Method:** POST
- **URL:** `http://localhost:3000/foods`
- **Body (JSON):**
```json
{
  "name": "Chicken Breast",
  "kcal": 165,
  "protein": 31.0,
  "carbs": 0.0,
  "fat": 3.6
}
```

### Request 2: Brown Rice
- **Method:** POST
- **URL:** `http://localhost:3000/foods`
- **Body (JSON):**
```json
{
  "name": "Brown Rice",
  "kcal": 111,
  "protein": 2.6,
  "carbs": 23.0,
  "fat": 0.9
}
```

### Request 3: Salmon
- **Method:** POST
- **URL:** `http://localhost:3000/foods`
- **Body (JSON):**
```json
{
  "name": "Salmon",
  "kcal": 206,
  "protein": 22.0,
  "carbs": 0.0,
  "fat": 12.0
}
```

### Request 4: Broccoli
- **Method:** POST
- **URL:** `http://localhost:3000/foods`
- **Body (JSON):**
```json
{
  "name": "Broccoli",
  "kcal": 34,
  "protein": 2.8,
  "carbs": 7.0,
  "fat": 0.4
}
```

### Request 5: Eggs
- **Method:** POST
- **URL:** `http://localhost:3000/foods`
- **Body (JSON):**
```json
{
  "name": "Eggs",
  "kcal": 155,
  "protein": 13.0,
  "carbs": 1.1,
  "fat": 11.0
}
```

### Request 6: Oatmeal
- **Method:** POST
- **URL:** `http://localhost:3000/foods`
- **Body (JSON):**
```json
{
  "name": "Oatmeal",
  "kcal": 68,
  "protein": 2.4,
  "carbs": 12.0,
  "fat": 1.4
}
```

### Request 7: Greek Yogurt
- **Method:** POST
- **URL:** `http://localhost:3000/foods`
- **Body (JSON):**
```json
{
  "name": "Greek Yogurt",
  "kcal": 59,
  "protein": 10.0,
  "carbs": 3.6,
  "fat": 0.4
}
```

### Request 8: Sweet Potato
- **Method:** POST
- **URL:** `http://localhost:3000/foods`
- **Body (JSON):**
```json
{
  "name": "Sweet Potato",
  "kcal": 86,
  "protein": 1.6,
  "carbs": 20.0,
  "fat": 0.1
}
```

### Request 9: Banana
- **Method:** POST
- **URL:** `http://localhost:3000/foods`
- **Body (JSON):**
```json
{
  "name": "Banana",
  "kcal": 89,
  "protein": 1.1,
  "carbs": 23.0,
  "fat": 0.3
}
```

### Request 10: Almonds
- **Method:** POST
- **URL:** `http://localhost:3000/foods`
- **Body (JSON):**
```json
{
  "name": "Almonds",
  "kcal": 579,
  "protein": 21.0,
  "carbs": 22.0,
  "fat": 50.0
}
```

### Request 11: Whole Wheat Bread
- **Method:** POST
- **URL:** `http://localhost:3000/foods`
- **Body (JSON):**
```json
{
  "name": "Whole Wheat Bread",
  "kcal": 247,
  "protein": 13.0,
  "carbs": 41.0,
  "fat": 4.2
}
```

### Request 12: Tuna
- **Method:** POST
- **URL:** `http://localhost:3000/foods`
- **Body (JSON):**
```json
{
  "name": "Tuna",
  "kcal": 144,
  "protein": 30.0,
  "carbs": 0.0,
  "fat": 1.0
}
```

---

## 4. WORKOUTS (Requires Auth Token)

**Important:** First login to get a JWT token, then add it to headers:
- **Header:** `Authorization: Bearer <your-token>`

### Request 1: Workout for User 1 (Today)
- **Method:** POST
- **URL:** `http://localhost:3000/workouts`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body (JSON):**
```json
{
  "exercise": "Bench Press",
  "sets": 4,
  "reps": 8,
  "weight": 80,
  "date": "2025-12-14T10:00:00Z"
}
```

### Request 2: Another Exercise for Same Workout
- **Method:** POST
- **URL:** `http://localhost:3000/workouts`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body (JSON):**
```json
{
  "exercise": "Squat",
  "sets": 3,
  "reps": 10,
  "weight": 100,
  "date": "2025-12-14T10:00:00Z"
}
```

### Request 3: Workout for Yesterday
- **Method:** POST
- **URL:** `http://localhost:3000/workouts`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body (JSON):**
```json
{
  "exercise": "Deadlift",
  "sets": 5,
  "reps": 5,
  "weight": 120,
  "date": "2025-12-13T10:00:00Z"
}
```

### Request 4: More Exercises
- **Method:** POST
- **URL:** `http://localhost:3000/workouts`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body (JSON):**
```json
{
  "exercise": "Overhead Press",
  "sets": 3,
  "reps": 8,
  "weight": 50,
  "date": "2025-12-12T10:00:00Z"
}
```

### Request 5: Another Workout
- **Method:** POST
- **URL:** `http://localhost:3000/workouts`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body (JSON):**
```json
{
  "exercise": "Pull-ups",
  "sets": 3,
  "reps": 10,
  "weight": 0,
  "date": "2025-12-11T10:00:00Z"
}
```

---

## 5. MEALS (Requires Auth Token)

### Request 1: Breakfast Meal
- **Method:** POST
- **URL:** `http://localhost:3000/meals`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body (JSON):**
```json
{
  "date": "2025-12-14T08:00:00Z",
  "items": [
    {
      "food_id": 5,
      "quantity": 2
    },
    {
      "food_id": 6,
      "quantity": 1
    },
    {
      "food_id": 9,
      "quantity": 1
    }
  ]
}
```

### Request 2: Lunch Meal
- **Method:** POST
- **URL:** `http://localhost:3000/meals`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body (JSON):**
```json
{
  "date": "2025-12-14T13:00:00Z",
  "items": [
    {
      "food_id": 1,
      "quantity": 1.5
    },
    {
      "food_id": 2,
      "quantity": 1
    },
    {
      "food_id": 4,
      "quantity": 1
    }
  ]
}
```

### Request 3: Dinner Meal
- **Method:** POST
- **URL:** `http://localhost:3000/meals`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body (JSON):**
```json
{
  "date": "2025-12-14T19:00:00Z",
  "items": [
    {
      "food_id": 3,
      "quantity": 1.5
    },
    {
      "food_id": 8,
      "quantity": 1
    },
    {
      "food_id": 4,
      "quantity": 1
    }
  ]
}
```

### Request 4: Snack Meal
- **Method:** POST
- **URL:** `http://localhost:3000/meals`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body (JSON):**
```json
{
  "date": "2025-12-14T15:00:00Z",
  "items": [
    {
      "food_id": 7,
      "quantity": 1
    },
    {
      "food_id": 10,
      "quantity": 0.5
    }
  ]
}
```

---

## 6. PREFERENCES (Requires Auth Token)

### Request 1: Set Preferences for User 1
- **Method:** PUT
- **URL:** `http://localhost:3000/preferences/1`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body (JSON):**
```json
{
  "liked_exercises": ["Bench Press", "Squat", "Deadlift"],
  "disliked_foods": ["Broccoli", "Spinach"]
}
```

### Request 2: Set Preferences for User 2
- **Method:** PUT
- **URL:** `http://localhost:3000/preferences/2`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body (JSON):**
```json
{
  "liked_exercises": ["Pull-ups", "Overhead Press", "Bicep Curls"],
  "disliked_foods": ["Tuna"]
}
```

---

## Quick Setup Order:

1. **Create Users** (3 users)
2. **Login** to get tokens for each user
3. **Create Exercises** (10 exercises)
4. **Create Foods** (12 foods)
5. **Create Workouts** (using tokens - 5 workouts)
6. **Create Meals** (using tokens - 4 meals)
7. **Set Preferences** (using tokens - 2 preferences)

---

## Tips:

- **Save tokens:** After logging in, save the JWT token for each user
- **Food IDs:** After creating foods, note the food_id values returned (they'll be 1, 2, 3, etc.)
- **User IDs:** After creating users, note the user_id values (usually 1, 2, 3)
- **Date format:** Use ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`

---

## Testing After Setup:

- **GET** `http://localhost:3000/users` - See all users
- **GET** `http://localhost:3000/exercises` - See all exercises
- **GET** `http://localhost:3000/foods` - See all foods
- **GET** `http://localhost:3000/workouts` - See all workouts
- **GET** `http://localhost:3000/meals` - See all meals
- **GET** `http://localhost:3000/preferences/1` - See user 1's preferences

