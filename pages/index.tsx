import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { GetServerSideProps } from 'next'
import * as twitter from '../lib/twitter'
import type { User } from '../lib/types'

const TWITTER_CLIENT_ID = process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_PROTOCOL}://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/auth`

interface Props {
  initialToken: string | null
  initialFollowing: Array<User> | null
}

const IndexPage = ({ initialToken, initialFollowing }: Props) => {
  const router = useRouter()

  const [token, setToken] = useState(initialToken)
  const [following, setFollowing] = useState(initialFollowing)

  useEffect(() => {
    if (router.query.token && router.query.expires) {
      document.cookie = `token=${router.query.token};max-age=${router.query.expires}`

      router.push('/')
    }
  }, [router.query.token, router.query.expires])

  useEffect(() => {
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('token='))
      ?.split('=')[1]

    if (token) {
      setToken(token)
    }
  }, [])

  useEffect(() => {
    if (token && !following) {
      fetch('/api/following')
        .then((response) => response.json())
        .then(setFollowing)
    }
  }, [token, following])

  return (
    <>
      {!token && (
        <a
          href={`https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${TWITTER_CLIENT_ID}&redirect_uri=${encodeURIComponent(
            REDIRECT_URI
          )}&scope=follows.read%20users.read%20tweet.read&state=state&code_challenge=challenge&code_challenge_method=plain`}
        >
          Connect
        </a>
      )}
      <pre>
        <code>{JSON.stringify(following, null, 2)}</code>
      </pre>
    </>
  )
}

export default IndexPage

export const getServerSideProps: GetServerSideProps<Props> = async (
  context
) => {
  const { token } = context.req.cookies
  const following = token ? await twitter.following(token) : null

  return {
    props: {
      initialToken: token,
      initialFollowing: following,
    },
  }
}
