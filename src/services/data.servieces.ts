import { Collection, Db, MongoClient } from 'mongodb';
import { config } from 'dotenv';
import User from '~/models/schemas/User.schema';
import RefreshToken from '~/models/schemas/RefreshToken.schema';
import Follower from '~/models/schemas/Follower.schema';
import Tweet from '~/models/schemas/Tweet.schema';
import HashTag from '~/models/schemas/HashTags.schemas';
import Bookmark from '~/models/schemas/Bookmark.schemas';
import Conversation from '~/models/schemas/Conversation.schema';

config();

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@twitter.8qtwdec.mongodb.net/`;

class DatabaseService {
  private client: MongoClient;
  private db: Db;

  constructor() {
    this.client = new MongoClient(uri);
    this.db = this.client.db(`${process.env.DB_NAME}`);
  }

  async connect() {
    try {
      await this.db.command({ ping: 1 });
      console.log('Pinged your deployment. You successfully connected to MongoDB!');
    } catch (error) {
      console.log('Error', error);
      return error;
    }
  }

  get users(): Collection<User> {
    return this.db.collection(`${process.env.DB_USERS_COLLECTION}`);
  }

  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(`${process.env.DB_REFRESH_TOKENS_COLLECTION}`);
  }

  get tweets(): Collection<Tweet> {
    return this.db.collection(`${process.env.DB_TWEETS_COLLECTION}`);
  }

  get hashTags(): Collection<HashTag> {
    return this.db.collection(`${process.env.DB_HASHTAGS_COLLECTION}`);
  }

  get bookmarks(): Collection<Bookmark> {
    return this.db.collection(`${process.env.DB_BOOKMARKS_COLLECTION}`);
  }

  get followers(): Collection<Follower> {
    return this.db.collection(`${process.env.DB_FOLLOWERS_COLLECTION}`);
  }

  get conversations(): Collection<Conversation> {
    return this.db.collection(process.env.DB_VIDEO_STATUS_CONVERSATION as string);
  }
}

const databaseService = new DatabaseService();
export default databaseService;
