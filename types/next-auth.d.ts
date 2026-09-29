import type { DefaultSession } from "next-auth";

/**
 * Augmentasi tipe untuk Auth.js v5.
 * Menambahkan field `role` pada user dan session, dan pada token JWT.
 */
declare module "next-auth" {
  interface User {
    role?: string;
  }

  interface Session {
    user: {
      id?: string;
      role?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
  }
}

// Token pada callback `session` bertipe dari @auth/core/jwt, bukan
// next-auth/jwt, jadi harus diaugmentasi juga di sini.
declare module "@auth/core/jwt" {
  interface JWT {
    role?: string;
  }
}

export {};
