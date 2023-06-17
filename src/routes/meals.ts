/* eslint-disable camelcase */
import { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { knex } from '../database'
import { getBestSquenceOfMealsInDiet } from '../utils/get-best-sequence-of-meals-in-diet'

export async function mealsRoutes(app: FastifyInstance) {
  // Create new meal
  app.post('/', async (request, reply) => {
    const createMealBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      is_on_diet: z.enum(['yes', 'no']),
    })

    const { name, description, is_on_diet } = createMealBodySchema.parse(
      request.body,
    )

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.setCookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 14, // 2 weeks
      })
    }

    await knex('meals').insert({
      id: randomUUID(),
      name,
      description,
      is_on_diet,
      user_id: sessionId,
    })

    return reply.status(201).send()
  })

  // Edit an existign meal
  app.put('/:id', async (request, reply) => {
    const getMealParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const getMealSchema = z.object({
      name: z.string(),
      description: z.string(),
      is_on_diet: z.enum(['yes', 'no']),
    })

    const { id } = getMealParamsSchema.parse(request.params)

    const changes = getMealSchema.parse(request.body)

    const update = await knex('meals').where('id', id).update(changes)

    if (update) {
      return reply.status(202).send({ message: 'Record successfully edited' })
    } else {
      return reply.status(404).send({ message: 'Record not found' })
    }
  })

  // Delete a meal
  app.delete('/:id', async (request, reply) => {
    const getMealParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getMealParamsSchema.parse(request.params)

    const deleteMeal = await knex('meals').where('id', id).del()

    if (deleteMeal) {
      return reply.status(202).send({ message: 'Record successfully deleted' })
    } else {
      return reply.status(404).send({ message: 'Record not found' })
    }
  })

  // Meals from the user
  app.get('/', async (request, reply) => {
    const sessionId = request.cookies.sessionId

    const meals = await knex('meals').where('user_id', sessionId)

    if (meals) {
      return reply.status(200).send({ meals })
    } else {
      return reply.status(404).send({ message: 'Record not found' })
    }
  })

  // Get a specific meal
  app.get('/:id', async (request, reply) => {
    const getMealParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getMealParamsSchema.parse(request.params)

    const meal = await knex('meals').where('id', id)

    if (meal.length > 0) {
      return reply.status(200).send({ meal })
    } else {
      return reply.status(404).send({ message: 'Record not found' })
    }
  })

  // User metrics
  app.get('/metrics', async (request, reply) => {
    const sessionId = request.cookies.sessionId

    const meals = await knex('meals').where('user_id', sessionId)

    const totalMeals = meals.length
    const mealsInDiet = meals.filter((meal) => meal.is_on_diet === 'yes').length
    const mealsOffDiet = meals.length - mealsInDiet
    const bestSequence = getBestSquenceOfMealsInDiet(meals)

    return { totalMeals, mealsInDiet, mealsOffDiet, bestSequence }
  })
}
