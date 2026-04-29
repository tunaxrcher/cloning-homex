import NextAuth, { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      username: string;
      email: string;
      isActive: boolean;
      displayName: string | null;
      phone: string | null;
      address: string | null;
      note: string | null;
      avatarUrl: string | null;
      createdAt: Date;
      organizationId: number | null;
      positionId: number | null;
      permissions: string[];
      positionName: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    username: string;
    email: string;
    isActive: boolean;
    displayName: string | null;
    phone: string | null;
    address: string | null;
    note: string | null;
    avatarUrl: string | null;
    createdAt: Date;
    organizationId: number | null;
    positionId: number | null;
    permissions: string[];
    positionName: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username: string;
    email: string;
    isActive: boolean;
    displayName: string | null;
    phone: string | null;
    address: string | null;
    note: string | null;
    avatarUrl: string | null;
    createdAt: Date;
    organizationId: number | null;
    positionId: number | null;
    permissions: string[];
    positionName: string | null;
  }
}
