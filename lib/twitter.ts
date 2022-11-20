import type { User } from './types'

const REDIRECT_URI = `${process.env.NEXT_PUBLIC_PROTOCOL}://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/auth`

export const following = async (token: string) => {
  const users: Array<User> = []
  const params = {
    max_results: 1000,
    'user.fields': 'description,id,name,url,username',
  }

  const { data: user } = await (
    await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  ).json()

  const url = `https://api.twitter.com/2/users/${user.id}/following`

  let hasNextPage = true
  let nextToken = null
  while (hasNextPage) {
    const resp: any = await getPage(url, token, params, nextToken)

    if (
      resp &&
      resp.meta &&
      resp.meta.result_count &&
      resp.meta.result_count > 0
    ) {
      if (resp.data) {
        users.push.apply(users, resp.data)
      }
      if (resp.meta.next_token) {
        nextToken = resp.meta.next_token
      } else {
        hasNextPage = false
      }
    } else {
      hasNextPage = false
    }
  }

  return users
}

const getPage = async (
  url: string,
  token: string,
  params: Record<string, string | number>,
  nextToken?: string
) => {
  if (nextToken) {
    params.pagination_token = nextToken
  }

  try {
    const resp = await fetch(
      `${url}?${Object.entries(params)
        .map(([key, value]) => `${key}=${value}`)
        .join('&')}`,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'v2FollowingJS',
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (resp.status !== 200) {
      console.error(resp.status, resp.statusText, await resp.json())
      throw resp.body
    }

    return resp.json()
  } catch (error) {
    console.error('Request failed:', error)
    throw error
  }
}

interface Auth {
  type: string
  expires: number
  token: string
  scope: string
}

export const auth = async (code: string): Promise<Auth> => {
  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: Object.entries({
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI,
      code_verifier: 'challenge',
    })
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join('&'),
  })

  const { token_type, expires_in, access_token, scope } = await response.json()

  return { type: token_type, expires: expires_in, token: access_token, scope }
}
