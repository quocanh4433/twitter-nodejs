import { Request } from 'express';
import databaseService from './data.servieces';
import Tweet from '~/models/schemas/Tweet.schema';
import { ObjectId, WithId } from 'mongodb';
import { TweetReqBody } from '~/models/requests/Tweet.request';
import HashTag from '~/models/schemas/HashTags.schemas';
import { TweetAudience, TweetType } from '~/constants/enums';

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

  async increaseView(tweet_id: string, user_id?: string | null | undefined) {
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 };
    const result = await databaseService.tweets.findOneAndUpdate(
      {
        _id: new ObjectId(tweet_id)
      },
      {
        $inc: inc,
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          guest_views: 1,
          user_views: 1,
          updated_at: 1
        }
      }
    );
    return result as WithId<{
      guest_views: number;
      user_views: number;
      updated_at: Date;
    }>;
  }

  async getTweetChildren({
    tweet_id,
    tweet_type,
    limit,
    page,
    user_id
  }: {
    tweet_id: string;
    tweet_type: TweetType;
    limit: number;
    page: number;
    user_id: string | null | undefined;
  }) {
    const tweets = await databaseService.tweets
      .aggregate([
        {
          $match: {
            parent_id: new ObjectId(tweet_id),
            type: tweet_type
          }
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
          $skip: limit * (page - 1) // Cong thuc phan trang
        },
        {
          $limit: limit
        }
      ])
      .toArray();

    const ids = tweets.map((tweet) => tweet._id);
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 };
    const date = new Date();

    const [totalDocument] = await Promise.all([
      databaseService.tweets.countDocuments({
        parent_id: new ObjectId(tweet_id),
        type: tweet_type
      }),
      databaseService.tweets.updateMany(
        {
          _id: {
            $in: ids
          }
        },
        {
          $inc: inc,
          $set: {
            updated_at: date
          }
        }
      )
    ]);

    // Increase view forr children tweet
    tweets.forEach((tweet) => {
      tweet.updated_at = date;
      if (user_id) {
        tweet.user_views += 1;
      } else {
        tweet.guest_views += 1;
      }
    });

    // Calculation total page
    const totalPage = Math.ceil(totalDocument / limit);
    return { tweets, totalPage };
  }

  async getNewFeed({ user_id, page, limit }: { user_id: string; page: number; limit: number }) {
    const user_id_obj = new ObjectId(user_id);
    const date = new Date();

    /******/
    const followed_user_ids = await databaseService.followers
      .find(
        {
          user_id: new ObjectId(user_id)
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

    /******/
    const aggregation = [
      {
        $match: {
          user_id: {
            $in: ids
          }
        }
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
                  audience: TweetAudience.TwitterCircle
                },
                {
                  user_id: {
                    $eq: user_id_obj
                  }
                }
              ]
            }
          ]
        }
      }
    ];
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
              },
              views: {
                $add: ['$user_views', '$guest_views']
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
    const totalPage = Math.ceil(totalDocument.total / limit);
    return { tweets, totalPage };
  }
}

const tweetService = new TweetService();
export default tweetService;
