import { Request } from 'express';
import databaseService from './data.servieces';
import Tweet from '~/models/schemas/Tweet.schema';
import { ObjectId, WithId } from 'mongodb';
import { TweetReqBody } from '~/models/requests/Tweet.request';
import { HashTag } from '~/models/schemas/HashTags.schemas';

class TweetService {
  async checkAndCreateHashtags(hashTags: string[]) {
    const hashTagsDocument = await Promise.all(
      hashTags.map((hashTag) => {
        return databaseService.hashTags.findOneAndUpdate(
          { name: hashTag },
          {
            $setOnInsert: new HashTag({ name: hashTag })
          },
          {
            upsert: true,
            returnDocument: 'after'
          }
        );
      })
    );
    return hashTagsDocument.map((hashTag) => new ObjectId(hashTag?._id));
  }

  async getTweet(tweet_id: string, user_id: string) {
    const result = await databaseService.tweets.findOne({
      _id: new ObjectId(tweet_id)
    });
    return result;
  }

  async createTweet(body: TweetReqBody, user_id: string) {
    const hashTags = await this.checkAndCreateHashtags(body.hashtags);
    const result = await databaseService.tweets.insertOne(
      new Tweet({
        audience: body.audience,
        content: body.content,
        hashtags: hashTags,
        medias: [],
        mentions: body.mentions,
        parent_id: body.parent_id,
        type: body.type,
        user_id: new ObjectId(user_id)
      })
    );
    const tweet = await databaseService.tweets.findOne({ _id: new ObjectId(result.insertedId) });
    return tweet;
  }
}

const tweetService = new TweetService();
export default tweetService;
