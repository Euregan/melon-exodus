import type { NextApiRequest, NextApiResponse } from 'next'
import * as twitter from '../../lib/twitter'

const REDIRECT_URL = `${process.env.NEXT_PUBLIC_PROTOCOL}://${process.env.NEXT_PUBLIC_VERCEL_URL}`

const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  const { token, expires } = await twitter.auth(request.query.code as string)

  response.redirect(`${REDIRECT_URL}?token=${token}&expires=${expires}`)
}

export default handler
