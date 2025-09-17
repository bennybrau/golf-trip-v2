import bcrypt from 'bcryptjs';
import { prisma } from './db';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  isAdmin: boolean;
}

export async function createUser(email: string, password: string, name: string, isAdmin: boolean = false, phone?: string) {
  const hashedPassword = await bcrypt.hash(password, 10);
  
  return prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      phone: phone || null,
      isAdmin,
    },
  });
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Return null if user doesn't exist
  if (!user) {
    return null;
  }

  // Check password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar || undefined,
    phone: user.phone || undefined,
    isAdmin: user.isAdmin,
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
    isAdmin: session.user.isAdmin,
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
    isAdmin: user.isAdmin,
  };
}

export async function createPasswordResetToken(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
      return null;
  }

  // Delete any existing reset tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id },
  });

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  return token;
}

export async function validatePasswordResetToken(token: string, deleteIfExpired: boolean = false): Promise<string | null> {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken) {
    return null;
  }

  if (resetToken.expiresAt < new Date()) {
    if (deleteIfExpired) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
    }
    return null;
  }

  return resetToken.userId;
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const userId = await validatePasswordResetToken(token, true);
  
  if (!userId) {
    return false;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  // Update password and delete the reset token
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetToken.delete({
      where: { token },
    }),
  ]);

  return true;
}