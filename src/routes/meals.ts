/* eslint-disable camelcase */
import { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { knex } from '../database'

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
    // Code
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
}
