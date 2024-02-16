import {PrismaClient} from "@prisma/client";
import Role from "../domain/roles/Role";
import {getUser} from "./tournament.service";

const prisma = new PrismaClient();

export async function findById(id: number) {
    const roleObject =
        await prisma.user_groups.findUnique({
            where: {
                id: id
            }
        })

    return Role.fromObject(roleObject);
}

export async function getUserOrga(userId: number) {
    const roles = [];

    return prisma.user_orga.findFirst({
            where: {
                user_id: userId
            }
        })
}

export async function isAuthorizedAdmin(userId: number) {
    const userOrga = await getUserOrga(userId);
    return !!userOrga && userOrga.rights > 1;
}