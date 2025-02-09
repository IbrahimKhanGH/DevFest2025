// Utility functions to calculate daily nutritional needs
export function calculateDailyCalories(weight, height, age, gender, goal) {
  if (!weight || !height || !age || !gender) {
    console.log("Missing data:", { weight, height, age, gender, goal });
    return 0;
  }

  // Convert height from string format (e.g., "5'10") to inches
  let heightInCm;
  if (typeof height === 'string' && height.includes("'")) {
    const [feet, inches] = height.split("'");
    heightInCm = ((parseInt(feet) * 12) + parseInt(inches)) * 2.54;
  } else {
    heightInCm = height * 2.54; // Assume height is in inches if not in feet'inches format
  }

  // Convert weight to kg if in lbs
  const weightInKg = weight * 0.453592;
  
  // BMR using Mifflin-St Jeor Equation
  let bmr;
  if (gender?.toLowerCase() === 'male') {
    bmr = (10 * weightInKg) + (6.25 * heightInCm) - (5 * age) + 5;
  } else {
    bmr = (10 * weightInKg) + (6.25 * heightInCm) - (5 * age) - 161;
  }

  // Activity factor (using moderate activity as default)
  let tdee = bmr * 1.55;

  // Adjust based on goal
  switch(goal?.toLowerCase()) {
    case 'gain muscle':
    case 'gain more muscle':
      return Math.round(tdee + 300); // 300 calorie surplus
    case 'lose weight':
      return Math.round(tdee - 500); // 500 calorie deficit
    case 'eat healthier':
    case 'maintain':
    default:
      return Math.round(tdee); // Maintenance calories
  }
}

export function calculateMacroTargets(calories, goal, weight = 170) {
  if (!calories) return { protein: 0, carbs: 0, fats: 0 };
  
  // Convert weight to kg
  const weightInKg = weight * 0.453592;
  // Calculate protein at 1.5g per kg for all goals
  const proteinGrams = Math.round(weightInKg * 1.5);
  
  switch(goal?.toLowerCase()) {
    case 'gain muscle':
    case 'gain more muscle':
      return {
        protein: proteinGrams,
        carbs: Math.round((calories - (proteinGrams * 4) - ((calories * 0.25))) / 4), // Remaining after protein and fat
        fats: Math.round((calories * 0.25) / 9) // 25% of calories from fat
      };
    case 'lose weight':
      return {
        protein: proteinGrams,
        carbs: Math.round((calories - (proteinGrams * 4) - ((calories * 0.25))) / 4),
        fats: Math.round((calories * 0.25) / 9)
      };
    case 'eat healthier':
    default:
      return {
        protein: proteinGrams,
        carbs: Math.round((calories - (proteinGrams * 4) - ((calories * 0.25))) / 4),
        fats: Math.round((calories * 0.25) / 9)
      };
  }
}

function convertHeightToCm(height) {
  // Convert height string like "5'10" to cm
  const [feet, inches] = height.split("'");
  return ((parseInt(feet) * 12) + parseInt(inches)) * 2.54;
} 