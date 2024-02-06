import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient()

export async function checkIfUserIsLanParticipant(user) {
    const lanParticipant =
        await prisma.$queryRaw
            `select event_id,user_id,bezahlt,anwesend from event_teilnehmer 
                where user_id=${user.id} and event_id=${process.env.EVENT_ID} and bezahlt=1 and anwesend>\'0000-00-00 00:00:00\'`;

    return !!lanParticipant;
}

export async function findUserByEmail(email) {
    return await prisma.user.findFirst({
        where: {
            email: email
        }
    });
}