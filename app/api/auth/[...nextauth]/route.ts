import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '../../../../lib/prisma';
import { verifyPassword } from '../../../../lib/auth';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email as string } });
        if (!user) return null;
        const valid = await verifyPassword(credentials.password as string, user.passwordHash);
        if (!valid) return null;
        return { id: user.id.toString(), email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret',
  session: { strategy: 'jwt' as const },
  pages: { signIn: '/login' },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
