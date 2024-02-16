import Reward from "../domain/reward/Reward";
import {Prisma, PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();

export async function createCateringOrder(userId: number, reward: Reward) {
    try {
        const orderObject = await prisma.catering_order.create({
            data: {
                user_id: userId,
                final_price: 0.00,
                time_added: new Date(),
                status: 1
            }
        })
        const orderId = orderObject.id;
        await prisma.catering_order_part.create({
            data: {
                order_id: orderId,
                product_id: reward.shop_id,
                order_nr: "",
                name: `Sponsored by SPS: ${reward.name}`,
                price: 0.00,
                user_id: userId,
                time_added: new Date(),
                time_changed: new Date(),
                status: 2
            }
        })
    } catch (error) {
        console.error(error);
    }
}