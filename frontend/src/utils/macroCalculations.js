export function calculateProtein(weight) {
  // 0.8g to 1g per lb of body weight for muscle gain
  return Math.round(weight * 0.8);
}

export function calculateCarbs(weight, goal) {
  // Base calculation: 2g per lb of body weight
  const base = weight * 2;
  
  // Adjust based on goal
  if (goal?.toLowerCase().includes('lose weight')) {
    return Math.round(base * 0.8); // 20% reduction for weight loss
  }
  if (goal?.toLowerCase().includes('gain')) {
    return Math.round(base * 1.2); // 20% increase for muscle gain
  }
  return Math.round(base); // Maintenance
}

export function calculateFats(weight) {
  // 0.4g per lb of body weight
  return Math.round(weight * 0.4);
}

// Helper function to calculate daily calories
export function calculateDailyCalories(weight, height, age, gender, activityLevel, goal) {
  // Harris-Benedict Formula
  let bmr;
  if (gender.toLowerCase() === 'male') {
    bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }

  // Activity multiplier
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9
  };

  let tdee = bmr * (activityMultipliers[activityLevel] || 1.2);

  // Adjust based on goal
  if (goal?.toLowerCase().includes('lose')) {
    tdee -= 500; // 500 calorie deficit for weight loss
  } else if (goal?.toLowerCase().includes('gain')) {
    tdee += 500; // 500 calorie surplus for weight gain
  }

  return Math.round(tdee);
} 