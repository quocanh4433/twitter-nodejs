import User from '~/models/schemas/User.schema';
import databaseService from './data.servieces';
import { RegisterReqBody, UpdateMeReqBody } from '~/models/requests/User.request';
import { hashPassword } from '~/utils/crypto';
import { signToken, verifyToken } from '~/utils/jwt';
import { TokenType, UserVerifyStatus } from '~/constants/enums';
import RefreshToken from '~/models/schemas/RefreshToken.schema';
import { ObjectId } from 'mongodb';
import { USERS_MESSAGES } from '~/constants/messages';
import HTTP_STATUS from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Error';
import Follower from '~/models/schemas/Follower.schema';
import axios from 'axios';
import { sendForgotPasswordEmail, sendVerifyRegisterEmail } from '~/utils/email';
import { envConfig } from '~/constants/config';

class UsersService {
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken, verify },
      options: { expiresIn: envConfig.accessTokenExpiresIn },
      privateKey: envConfig.jwtAccessTokenSecret as string
    });
  }

  private signRefreshToken({ user_id, verify, exp }: { user_id: string; verify: UserVerifyStatus; exp?: number }) {
    if (exp) {
      return signToken({
        payload: { user_id, token_type: TokenType.RefreshToken, verify, exp },
        privateKey: envConfig.jwtRefreshtokenSecret as string
      });
    }
    return signToken({
      payload: { user_id, token_type: TokenType.RefreshToken, verify },
      options: { expiresIn: envConfig.refreshTokenExppiresIn },
      privateKey: envConfig.jwtRefreshtokenSecret as string
    });
  }

  private decodeRefreshToken(refresh_token: string) {
    return verifyToken({
      token: refresh_token,
      secretOrPublicKey: envConfig.jwtRefreshtokenSecret as string
    });
  }

  private signAccessAndRefreshToken({
    user_id,
    verify,
    exp
  }: {
    user_id: string;
    verify: UserVerifyStatus;
    exp?: number;
  }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify, exp })]);
  }

  private signVerifyEmailToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.EmailVerifyToken, verify },
      options: { expiresIn: envConfig.verifyEmailTokenExpiresIn },
      privateKey: envConfig.jwtVerifyemailSecret as string
    });
  }

  private signForgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.ForgotPasswordToken, verify },
      options: { expiresIn: envConfig.forgotPasswordTokenExpiresIn },
      privateKey: envConfig.jwtForgotPasswordSecret as string
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

  private async getOAuthGooogleToken(code: string) {
    const body = {
      code,
      client_id: envConfig.googleClientId,
      redirect_uri: envConfig.googleRedirectUri,
      client_secret: envConfig.googleClientSecret,
      grant_type: 'authorization_code'
    };

    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return data as {
      access_token: string;
      id_token: string;
    };
  }

  private async getGoogleUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: {
        access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    });
    return data as {
      id: string;
      email: string;
      verified_email: boolean;
      name: string;
      given_name: string;
      family_name: string;
      picture: string;
      locale: string;
    };
  }

  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId();
    const verify = UserVerifyStatus.Unverified;
    const email_verify_token = await this.signVerifyEmailToken({
      user_id: user_id.toString(),
      verify
    });

    const verifyEmail = await sendVerifyRegisterEmail(payload.email, email_verify_token);
    console.log('verifyEmail', verifyEmail);

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
    const { exp, iat } = await this.decodeRefreshToken(refresh_token);
    databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, exp, iat })
    );

    return {
      access_token,
      refresh_token
    };
  }

  async oauth(code: string) {
    const { access_token, id_token } = await this.getOAuthGooogleToken(code);
    const userInfo = await this.getGoogleUserInfo(access_token, id_token);

    if (!userInfo.verified_email) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.GMAIL_NOT_VERIFY,
        status: HTTP_STATUS.BAD_REQUEST
      });
    }

    const user = await databaseService.users.findOne({ email: userInfo.email });
    if (user) {
      const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
        user_id: user._id.toString(),
        verify: user.verify ? UserVerifyStatus.Verified : UserVerifyStatus.Unverified
      });
      const { exp, iat } = await this.decodeRefreshToken(refresh_token);
      await databaseService.refreshTokens.insertOne(
        new RefreshToken({
          user_id: user._id,
          token: refresh_token,
          exp,
          iat
        })
      );
      return {
        access_token,
        refresh_token,
        newUser: 0,
        verify: user.verify
      };
    } else {
      const password = Math.random().toString(36).substring(2, 15);
      const data = await this.register({
        email: userInfo.email,
        name: userInfo.name,
        date_of_birth: new Date().toISOString(),
        password,
        confirm_password: password
      });
      return { ...data, newUser: 1, verify: UserVerifyStatus.Unverified };
    }
  }

  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({ user_id, verify });
    const { exp, iat } = await this.decodeRefreshToken(refresh_token);
    databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, exp, iat })
    );
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
    const { exp, iat } = await this.decodeRefreshToken(refresh_token);
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, exp, iat })
    );
    return {
      access_token,
      refresh_token
    };
  }

  async resendVerifyEmail(user_id: string, email: string) {
    const email_verify_token = await this.signVerifyEmailToken({ user_id, verify: UserVerifyStatus.Unverified });

    // Send verify email
    await sendVerifyRegisterEmail(email, email_verify_token);

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

  async forgotPassword({ user_id, verify, email }: { user_id: string; verify: UserVerifyStatus; email: string }) {
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
    await sendForgotPasswordEmail(email, forgot_password_token);

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

  async refreshToken({
    user_id,
    refresh_token,
    verify,
    exp,
    iat
  }: {
    user_id: string;
    refresh_token: string;
    verify: UserVerifyStatus;
    exp: number;
    iat: number;
  }) {
    const [new_access_token, new_refresh_token] = await this.signAccessAndRefreshToken({ user_id, verify, exp: exp });
    databaseService.refreshTokens.deleteOne({ token: refresh_token });
    databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: new_refresh_token, exp, iat })
    );
    return {
      access_token: new_access_token,
      refresh_token: new_refresh_token
    };
  }

  async changePassword(user_id: string, password: string) {
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          password: hashPassword(password)
        },
        $currentDate: {
          updated_at: true
        }
      }
    );
    return {
      message: USERS_MESSAGES.CHAGE_PASSWORD_SUCCESS
    };
  }
}

const usersService = new UsersService();
export default usersService;
