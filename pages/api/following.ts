import type { NextApiRequest, NextApiResponse } from 'next'
import * as twitter from '../../lib/twitter'

const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  const { token } = request.cookies

  const users = await twitter.following(token)

  response.json(users)
}

export default handler
