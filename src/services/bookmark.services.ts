import databaseService from './data.servieces';
import { ObjectId } from 'mongodb';
import { BOOKMARK_MESSAGES } from '~/constants/messages';
import { Bookmark } from '~/models/schemas/Bookmark.schemas';

class BookmarkService {
  async bookmark(user_id: string, tweet_id: string) {
    await databaseService.bookmarks.findOneAndUpdate(
      { user_id: new ObjectId(user_id) },
      {
        $setOnInsert: new Bookmark({
          user_id: new ObjectId(user_id),
          tweet_id: new ObjectId(tweet_id)
        })
      },
      {
        upsert: true
      }
    );
    return {
      message: BOOKMARK_MESSAGES.BOOKMARK_SUCCESSFULLY
    };
  }

  async unbookmark(user_id: string, tweet_id: string) {
    await databaseService.bookmarks.findOneAndDelete({
      user_id: new ObjectId(user_id),
      tweet_id: new ObjectId(tweet_id)
    });
    return {
      message: BOOKMARK_MESSAGES.UNBOOKMARK_SUCCESSFULLY
    };
  }
}

const bookmarkService = new BookmarkService();
export default bookmarkService;
