// UserUtils.ts
import redis from "@/lib/redis";
import {getUserDateRemaining, incrAfterChat} from "@/lib/usage/usage";
import {DateRemaining} from "@/types/usage";


export default class UserUtils {
  static async getUserIdByToken(token: string) {
    const userId = await redis.get(token);
    return userId ? userId.toString() : null;
  }

  static async getUserDateRemaining(userId: string): Promise<DateRemaining> {
    try {
      const remainingInfo = await getUserDateRemaining({ userId });
      return remainingInfo;
    } catch (error) {
      console.error('Error getting user date remaining:', error);
      throw error;
    }
  }

  static async incrAfterChat({ userId, remainingInfo }: { userId: string; remainingInfo: DateRemaining }): Promise<void> {
    try {
      await incrAfterChat({ userId, remainingInfo });
    } catch (error) {
      console.error('Error incrementing after chat:', error);
      throw error;
    }
  }
}
