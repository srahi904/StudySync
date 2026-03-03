import { type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export interface RequestUser {
  id: string;
  name: string;
  email?: string | null;
  image?: string | null;
}

export async function getRequestUser(request: NextRequest): Promise<RequestUser | null> {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });

  if (!token?.id) {
    return null;
  }

  return {
    id: String(token.id),
    name: typeof token.name === 'string' ? token.name : 'User',
    email: typeof token.email === 'string' ? token.email : null,
    image: typeof token.picture === 'string' ? token.picture : null,
  };
}
