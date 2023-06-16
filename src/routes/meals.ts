/* eslint-disable camelcase */
import { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { knex } from '../database'

export async function mealsRoutes(app: FastifyInstance) {
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
}
