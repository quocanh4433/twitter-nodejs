import databaseService from './data.servieces';
import { ObjectId } from 'mongodb';
import { MediaType, MediaTypeQuery, TweetAudience, TweetType } from '~/constants/enums';

class SearchService {
  async search({
    limit,
    page,
    content,
    user_id,
    media_type,
    people_follow
  }: {
    limit: number;
    page: number;
    content: string;
    user_id: string;
    media_type?: MediaTypeQuery;
    people_follow?: string;
  }) {
    const date = new Date();
    const user_id_obj = new ObjectId(user_id);
    const $match: any = {
      $text: {
        $search: content
      }
    };

    /******/
    if (media_type) {
      if (media_type === MediaTypeQuery.Image) {
        $match['medias.type'] = MediaType.Image;
      }

      if (media_type === MediaTypeQuery.Video) {
        $match['medias.type'] = {
          $in: [MediaType.Video, MediaType.HLS]
        };
      }
    }

    if (people_follow && people_follow === '1') {
      const followed_user_ids = await databaseService.followers
        .find(
          {
            user_id: user_id_obj
          },
          {
            projection: {
              _id: 0,
              followed_user_id: 1
            }
          }
        )
        .toArray();
      const ids = followed_user_ids.map((item) => item.followed_user_id);
      ids.push(user_id_obj);
      $match['user_id'] = {
        $in: ids
      };
    }

    const aggregation = [
      {
        $match
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'author_by_user_id'
        }
      },
      {
        $unwind: {
          path: '$author_by_user_id'
        }
      },
      {
        $match: {
          $or: [
            {
              audience: TweetAudience.Everyone
            },
            {
              $and: [
                {
                  audience: 1
                },
                {
                  user_id: user_id_obj
                }
              ]
            },
            {
              $and: [
                {
                  audience: TweetAudience.TwitterCircle
                },
                {
                  'author_by_user_id.twitter_circle': {
                    $in: [user_id_obj]
                  }
                }
              ]
            }
          ]
        }
      }
    ];

    /******/
    const [tweets, [totalDocument]] = await Promise.all([
      databaseService.tweets
        .aggregate([
          ...aggregation,
          {
            $skip: limit * (page - 1)
          },
          {
            $limit: limit
          },
          {
            $lookup: {
              from: 'users',
              localField: 'mentions',
              foreignField: '_id',
              as: 'mentions'
            }
          },
          {
            $addFields: {
              mentions: {
                $map: {
                  input: '$mentions',
                  as: 'mention',
                  in: {
                    _id: '$$mention._id',
                    name: '$$mention.name',
                    username: '$$mention.username',
                    email: '$$mention.email'
                  }
                }
              }
            }
          },
          {
            $lookup: {
              from: 'bookmarks',
              localField: '_id',
              foreignField: 'tweet_id',
              as: 'bookmarks'
            }
          },
          {
            $lookup: {
              from: 'tweets',
              localField: '_id',
              foreignField: 'parent_id',
              as: 'tweet_children'
            }
          },
          {
            $addFields: {
              bookmarkscount: {
                $size: '$bookmarks'
              },
              retweet_count: {
                $size: {
                  $filter: {
                    input: '$tweet_children',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.type', TweetType.Retweet]
                    }
                  }
                }
              },
              comment_count: {
                $size: {
                  $filter: {
                    input: '$tweet_children',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.type', TweetType.Comment]
                    }
                  }
                }
              },
              quote_count: {
                $size: {
                  $filter: {
                    input: '$tweet_children',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.type', TweetType.QuoteTweet]
                    }
                  }
                }
              }
            }
          },
          {
            $project: {
              tweet_children: 0,
              author_by_user_id: {
                password: 0,
                email_verify_token: 0,
                forgot_password_token: 0,
                twitter_circle: 0,
                date_of_birth: 0
              }
            }
          }
        ])
        .toArray(),
      databaseService.tweets.aggregate([...aggregation, { $count: 'total' }]).toArray()
    ]);

    /******/
    const tweet_ids = tweets.map((item) => item._id);
    await databaseService.tweets.updateMany(
      {
        _id: {
          $in: tweet_ids
        }
      },
      {
        $inc: { user_views: 1 },
        $set: {
          updated_at: date
        }
      }
    );

    // Increase view forr children tweet
    tweets.forEach((tweet) => {
      tweet.updated_at = date;
      tweet.user_views += 1;
    });

    // Calculation total page
    const totalPage = Math.ceil(totalDocument?.total / limit) ?? 1;
    return { tweets, totalPage };
  }
}

const searchService = new SearchService();
export default searchService;
