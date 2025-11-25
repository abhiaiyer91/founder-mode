import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { organization } from 'better-auth/plugins/organization'
import { username } from 'better-auth/plugins/username'
import { prisma } from '../lib/prisma.js'

const defaultSecret = 'better-auth-dev-secret-change-me'

const defaultRoles = [
  { role: 'owner', permissions: ['*'] },
  {
    role: 'admin',
    permissions: ['projects:read', 'projects:write', 'deployments:read', 'deployments:write'],
  },
  {
    role: 'member',
    permissions: ['projects:read', 'deployments:read'],
  },
]

export const auth = betterAuth({
  basePath: '/auth',
  secret: process.env.BETTER_AUTH_SECRET || defaultSecret,
  database: prismaAdapter(prisma, {
    provider: 'sqlite',
    usePlural: false,
  }),
  plugins: [
    organization({
      roles: defaultRoles,
      defaultRole: 'member',
    }),
    username({
      minUsernameLength: 3,
      maxUsernameLength: 30,
    }),
  ],
  emailAndPassword: {
    enabled: true,
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      // eslint-disable-next-line no-console
      console.info(`[better-auth] Verification link for ${user.email}: ${url}`)
    },
  },
  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',').map(origin => origin.trim()).filter(Boolean),
})
