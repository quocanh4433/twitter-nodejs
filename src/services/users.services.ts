import { User } from '~/models/schemas/User.schema';
import databaseService from './data.servieces';
import { RegisterReqBody, UpdateMeReqBody } from '~/models/requests/User.request';
import { hashPassword } from '~/utils/crypto';
import { signToken } from '~/utils/jwt';
import { TokenType, UserVerifyStatus } from '~/constants/enums';
import RefreshToken from '~/models/schemas/RefreshToken.schema';
import { ObjectId } from 'mongodb';
import { config } from 'dotenv';
import { USERS_MESSAGES } from '~/constants/messages';
import HTTP_STATUS from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Error';
import Follower from '~/models/schemas/Follower.schema';

config();

class UsersService {
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken, verify },
      options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN },
      privateKey: process.env.JWT_ACCESS_TOKEN_SECRET as string
    });
  }

  private signRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.RefreshToken, verify },
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN },
      privateKey: process.env.JWT_REFRESH_TOKEN_SECRET as string
    });
  }

  private signAccessAndRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })]);
  }

  private signVerifyEmailToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.EmailVerifyToken, verify },
      options: { expiresIn: process.env.VERIFY_EMIAL_TOKEN_EXPIRES_IN },
      privateKey: process.env.JWT_VERIFY_EMAIL_SECRET as string
    });
  }

  private signForgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.ForgotPasswordToken, verify },
      options: { expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN },
      privateKey: process.env.JWT_FORGOT_PASSWORD_SECRET as string
    });
  }

  private projecttionSchema = {
    password: 0,
    email_verify_token: 0,
    forgot_password_token: 0,
    verify: 0,
    created_at: 0,
    updated_at: 0
  };

  async regiser(payload: RegisterReqBody) {
    const user_id = new ObjectId();
    const verify = UserVerifyStatus.Unverified;
    const email_verify_token = await this.signVerifyEmailToken({
      user_id: user_id.toString(),
      verify
    });
    await databaseService.users.insertOne(
      new User({
        ...payload,
        username: `user${user_id.toString()}`,
        _id: user_id,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password),
        email_verify_token
      })
    );

    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({ user_id: user_id.toString(), verify });
    databaseService.refreshTokens.insertOne(new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token }));
    return {
      access_token,
      refresh_token
    };
  }

  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({ user_id, verify });
    databaseService.refreshTokens.insertOne(new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token }));
    return {
      access_token,
      refresh_token
    };
  }

  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token });
    return {
      message: USERS_MESSAGES.LOGOUT_SUCCESS
    };
  }

  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email });
    return Boolean(user);
  }

  async verifyEmail(user_id: string) {
    const [token] = await Promise.all([
      this.signAccessAndRefreshToken({ user_id, verify: UserVerifyStatus.Verified }),
      databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
        {
          $set: {
            email_verify_token: '',
            verify: UserVerifyStatus.Verified,
            // Tạo giá trị cập nhật
            // updated_at: new Date()

            // MongoDB cập nhật giá trị
            updated_at: '$$NOW'
          }
        }
      ])
    ]);
    const [access_token, refresh_token] = token;
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token })
    );
    return {
      access_token,
      refresh_token
    };
  }

  async resendVerifyEmail(user_id: string) {
    const email_verify_token = await this.signVerifyEmailToken({ user_id, verify: UserVerifyStatus.Unverified });
    // Resend verify email
    console.log('Resend verify email success: ', email_verify_token);

    // Update verify_email_token
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          email_verify_token
        },
        $currentDate: {
          update_at: true
        }
      }
    );

    return {
      message: USERS_MESSAGES.RESEND_VERIFY_EMAIL_SUCCESS
    };
  }

  async forgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const forgot_password_token = await this.signForgotPasswordToken({ user_id, verify });
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password_token
        },
        $currentDate: {
          updated_at: true
        }
      }
    );

    // Send email attach link "https:/twitter.com/forgot-pasword?token=...."
    console.log('forgot_password_token: ', forgot_password_token);

    return {
      message: USERS_MESSAGES.CHECK_EMAIL_TO_FORGOT_PASSWORD_SUCCESS
    };
  }

  async resetPassword({ password, user_id }: { password: string; user_id: string }) {
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          password: hashPassword(password),
          forgot_password_token: ''
        },
        $currentDate: {
          updated_at: true
        }
      }
    );

    return {
      message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS
    };
  }

  async getMe(user_id: string) {
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: this.projecttionSchema
      }
    );

    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      });
    }

    return user;
  }

  async updateMe(user_id: string, payload: UpdateMeReqBody) {
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload;
    const user = await databaseService.users.findOneAndUpdate(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          ...(_payload as UpdateMeReqBody & { date_of_birth?: Date })
        },
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: this.projecttionSchema
      }
    );
    return user;
  }

  async getProfile(username: string) {
    const user = await databaseService.users.findOne(
      { username },
      {
        projection: this.projecttionSchema
      }
    );
    return user;
  }

  async follow(user_id: string, follwed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(follwed_user_id)
    });

    if (!follower) {
      await databaseService.followers.insertOne(
        new Follower({
          user_id: new ObjectId(user_id),
          followed_user_id: new ObjectId(follwed_user_id),
          created_at: new Date()
        })
      );
      return {
        message: USERS_MESSAGES.FOLLOW_SUCCESS
      };
    }
    return {
      message: USERS_MESSAGES.FOLLOWED
    };
  }

  async unfollow(user_id: string, follwed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(follwed_user_id)
    });

    if (!follower) {
      return {
        message: USERS_MESSAGES.UNFOLLOWED
      };
    }

    await databaseService.followers.deleteOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(follwed_user_id)
    });

    return {
      message: USERS_MESSAGES.UNFOLLOW_SUCCESS
    };
  }
}

const usersService = new UsersService();
export default usersService;
