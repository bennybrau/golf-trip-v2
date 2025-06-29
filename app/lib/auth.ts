import bcrypt from 'bcryptjs';
import { prisma } from './db';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
}

export async function createUser(email: string, password: string, name: string) {
  const hashedPassword = await bcrypt.hash(password, 10);
  
  return prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  });
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  let user = await prisma.user.findUnique({
    where: { email },
  });

  // If user doesn't exist, create them (for demo purposes)
  if (!user) {
    const hashedPassword = await bcrypt.hash(password, 10);
    user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: email.split('@')[0], // Use email prefix as default name
      },
    });
  } else {
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar || undefined,
    phone: user.phone || undefined,
  };
}

export async function createSession(userId: string) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return token;
}

export async function getSessionUser(token: string): Promise<User | null> {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    avatar: session.user.avatar || undefined,
    phone: session.user.phone || undefined,
  };
}

export async function deleteSession(token: string) {
  await prisma.session.delete({ where: { token } });
}

export async function updateUser(id: string, updates: Partial<Omit<User, 'id' | 'email'>>) {
  const user = await prisma.user.update({
    where: { id },
    data: updates,
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar || undefined,
    phone: user.phone || undefined,
  };
}