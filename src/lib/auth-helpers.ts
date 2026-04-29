"use server";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

export const userSignIn = async ({
  username,
  passwordHash,
}: {
  username: string;
  passwordHash: string;
}) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        username: username,
        isActive: true,
      },
      include: {
        position: {
          include: {
            permissions: {
              where: {
                allowed: true,
              },
              include: {
                permission: true, 
              },
            },
          },
        },
      },
    });

    if (!user || !user.passwordHash) {
      // console.log("User not found or has no password.");
      return null;
    }

    const isPasswordMatch = await bcrypt.compare(
      passwordHash,
      user.passwordHash,
    );

    if (isPasswordMatch) {
      // console.log("✅ 5. Password Matched");
      const permissionKeys =
        user.position?.permissions?.map((pp) => pp.permission.permissionKey) ||
        [];

      const { passwordHash: dbPasswordHash, ...userWithoutPassword } = user;

      return {
        ...userWithoutPassword,
        id: user.id.toString(),
        email: user.email ?? "non@mail.co",
        image: user.avatarUrl ?? "/profile_temp.png",
        permissions: permissionKeys,
        positionName: user.position?.positionName || null,
      };
    }

    return null;
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
};
