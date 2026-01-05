// Convex Auth configuration
// This allows using better-auth with Convex as the database

export default {
  providers: [
    // Email/password authentication
    {
      domain: process.env.CONVEX_SITE_URL || 'http://localhost:3001',
      applicationID: 'founder-mode',
    },
  ],
};
