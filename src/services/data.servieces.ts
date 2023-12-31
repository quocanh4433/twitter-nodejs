import { Collection, Db, MongoClient } from 'mongodb';
import User from '~/models/schemas/User.schema';
import RefreshToken from '~/models/schemas/RefreshToken.schema';
import Follower from '~/models/schemas/Follower.schema';
import Tweet from '~/models/schemas/Tweet.schema';
import HashTag from '~/models/schemas/HashTags.schemas';
import Bookmark from '~/models/schemas/Bookmark.schemas';
import Conversation from '~/models/schemas/Conversation.schema';
import { envConfig } from '~/constants/config';

const uri = `mongodb+srv://${envConfig.dbUserName}:${envConfig.dbPassword}@twitter.8qtwdec.mongodb.net/`;

class DatabaseService {
  private client: MongoClient;
  private db: Db;

  constructor() {
    this.client = new MongoClient(uri);
    this.db = this.client.db(`${envConfig.dbName}`);
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
    return this.db.collection(`${envConfig.dbUsersCollection}`);
  }

  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(`${envConfig.dbRefreshTokensCollection}`);
  }

  get tweets(): Collection<Tweet> {
    return this.db.collection(`${envConfig.dbTweetsCollection}`);
  }

  get hashTags(): Collection<HashTag> {
    return this.db.collection(`${envConfig.dbHashTagsCollection}`);
  }

  get bookmarks(): Collection<Bookmark> {
    return this.db.collection(`${envConfig.dbBookmarkCollection}`);
  }

  get followers(): Collection<Follower> {
    return this.db.collection(`${envConfig.dbFollowersCollection}`);
  }

  get conversations(): Collection<Conversation> {
    return this.db.collection(envConfig.dbConversationCollection as string);
  }
}

const databaseService = new DatabaseService();
export default databaseService;
