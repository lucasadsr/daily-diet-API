import { Tables } from 'knex/types/tables'

export function getBestSquenceOfMealsInDiet(meals: Array<Tables['meals']>) {
  let currentSequence = 0
  let bestSequence = 0

  for (let i = 0; i < meals.length; i++) {
    if (meals[i].is_on_diet === 'yes') {
      currentSequence++
    } else {
      currentSequence = 0
    }

    if (currentSequence > bestSequence) {
      bestSequence = currentSequence
    }
    console.log(currentSequence)
  }

  return bestSequence
}
