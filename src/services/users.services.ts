import { User } from '~/models/schemas/User.schema';
import databaseService from './data.servieces';

class UsersService {
  async regiser(payload: { email: string; password: string }) {
    const { email, password } = payload;
    const rersult = await databaseService.users.insertOne(
      new User({
        email,
        password
      })
    );
    return rersult;
  }

  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email });
    return Boolean(user);
  }
}

const usersService = new UsersService();
export default usersService;
