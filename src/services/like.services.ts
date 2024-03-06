import databaseService from './data.servieces';
import { ObjectId } from 'mongodb';
import { LIKE_MESSAGES } from '~/constants/messages';
import Like from '~/models/schemas/Like.schema';

class LikeService {
  async likeTweet(user_id: string, tweet_id: string) {
    await databaseService.likes.findOneAndUpdate(
      { user_id: new ObjectId(user_id) },
      {
        $setOnInsert: new Like({
          user_id: new ObjectId(user_id),
          tweet_id: new ObjectId(tweet_id)
        })
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    );
    return {
      message: LIKE_MESSAGES.LIKE_SUCCESSFULLY
    };
  }

  async unlikeTweet(user_id: string, tweet_id: string) {
    await databaseService.likes.findOneAndDelete({
      user_id: new ObjectId(user_id),
      tweet_id: new ObjectId(tweet_id)
    });
    return {
      message: LIKE_MESSAGES.UNLIKE_SUCCESSFULLY
    };
  }
}

const likeService = new LikeService();
export default likeService;
