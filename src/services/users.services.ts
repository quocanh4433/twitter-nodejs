import { User } from '~/models/schemas/User.schema';
import databaseService from './data.servieces';
import { RegisterReqBody } from '~/models/requests/User.request';
import { hashPassword } from '~/utils/crypto';
import { signToken } from '~/utils/jwt';
import { TokenType, UserVerifyStatus } from '~/constants/enums';
import RefreshToken from '~/models/schemas/RequestToken.schema';
import { ObjectId } from 'mongodb';
import { config } from 'dotenv';
import { USERS_MESSAGES } from '~/constants/messages';

config();

class UsersService {
  private signAccessToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken },
      options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN },
      privateKey: process.env.JWT_ACCESS_TOKEN_SECRET as string
    });
  }

  private signRefreshToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.RefreshToken },
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN },
      privateKey: process.env.JWT_REFRESH_TOKEN_SECRET as string
    });
  }

  private signAccessAndRefreshToken(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefreshToken(user_id)]);
  }

  private signVerifyEmailToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.EmailVerifyToken },
      options: { expiresIn: process.env.VERIFY_EMIAL_TOKEN_EXPIRES_IN },
      privateKey: process.env.JWT_VERIFY_EMAIL_SECRET as string
    });
  }

  async regiser(payload: RegisterReqBody) {
    const user_id = new ObjectId();
    const email_verify_token = await this.signVerifyEmailToken(user_id.toString());
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password),
        email_verify_token
      })
    );

    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id.toString());
    databaseService.refreshTokens.insertOne(new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token }));
    return {
      access_token,
      refresh_token
    };
  }

  async login(user_id: string) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id);
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
      this.signAccessAndRefreshToken(user_id),
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
    return {
      access_token,
      refresh_token
    };
  }
}

const usersService = new UsersService();
export default usersService;
