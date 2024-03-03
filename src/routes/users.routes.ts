import { Router } from 'express';
import {
  loginController,
  logoutController,
  registerController,
  verifyEmailTokenController,
  resendVerifyEmailTokenController,
  forgotPasswordController,
  verifyForgotPasswordController,
  resetPasswordController,
  getMeController,
  updateMeController,
  getProfileController,
  followController,
  unfollowController,
  oAuthController,
  refreshTokenController,
  changePasswordController
} from '~/controllers/users.controllers';
import { filterMiddleware } from '~/middlewares/common.middlewares';
import {
  loginValidator,
  registerValidator,
  accessTokenValidator,
  refreshTokenValidator,
  verifyEmailTokenValidator,
  forgotPasswordValidator,
  verifyForgotPasswordTokenValidator,
  resetPasswordValidator,
  verifiedUserValidator,
  updateMeValidator,
  followValidator,
  unfollowValidator,
  changePasswordValidator
} from '~/middlewares/users.middlewares';
import { UpdateMeReqBody } from '~/models/requests/User.request';
import { wrapRequestHandler } from '~/utils/handlers';

const usersRouter = Router();
/**
 * Description. Login a user
 * Path: /login
 * Method: POST
 * Body: { email: string, password: string}
 */
usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController));

/**
 * Description. OAuth with google
 * Path: /auth/google
 * Method: GET
 * Query: {code: string}
 */
usersRouter.get('/auth/google', wrapRequestHandler(oAuthController));

/**
 * Description. Register a new user
 * Path: /register
 * Method: POST
 * Body: { name: string, email: string, password: string, confirm_password: string, date_of_birth: ISO8601 }
 */
usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController));

/**
 * Description. Logout a user
 * Path: /logout
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: { refresh_token: string }
 */
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController));

/**
 * Description. Verify email when user register
 * Path: /verify-email
 * Method: POST
 * Body: { email_verify_token: string }
 */
usersRouter.post('/verify-email', verifyEmailTokenValidator, wrapRequestHandler(verifyEmailTokenController));

/**
 * Description. Resend verify email when user register
 * Path: /resend-verify-email
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 */
usersRouter.post('/resend-verify-email', accessTokenValidator, wrapRequestHandler(resendVerifyEmailTokenController));

/**
 * Description. Submit a email to forgot password, send a new email to user
 * Path: /forgot-password
 * Method: POST
 * body: {email: string}
 */
usersRouter.post('/forgot-password', forgotPasswordValidator, wrapRequestHandler(forgotPasswordController));

/**
 * Description. Verify link in email to reset password
 * Path: /verify-forgot-password
 * Method: POST
 * body: {forgot_password_token: string}
 */
usersRouter.post(
  '/verify-forgot-password',
  verifyForgotPasswordTokenValidator,
  wrapRequestHandler(verifyForgotPasswordController)
);

/**
 * Description. Reset password
 * Path: /reset-password
 * Method: POST
 * body: {forgot_password_token: string, password: string, confirm_password: string}
 */
usersRouter.post('/reset-password', resetPasswordValidator, wrapRequestHandler(resetPasswordController));

/**
 * Description. change password
 * Path: /change-password
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 *
 * body: {old_password: string, password: string, confirm_password: string}
 */
usersRouter.post(
  '/change-password',
  accessTokenValidator,
  verifiedUserValidator,
  changePasswordValidator,
  wrapRequestHandler(changePasswordController)
);

/**
 * Description. Refresh token
 * Path: /refresh-token
 * Method: POST
 * body: {refressh_token: string}
 */
usersRouter.post('/refresh-token', refreshTokenValidator, wrapRequestHandler(refreshTokenController));

/**
 * Description. Get profile
 * Path: /me
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
usersRouter.get('/me', accessTokenValidator, wrapRequestHandler(getMeController));

/**
 * Description. Update profile
 * Path: /me
 * Method: PATCH
 * Header: { Authorization: Bearer <access_token> }
 * Body: UserSchema
 */
usersRouter.patch(
  '/update-profile',
  accessTokenValidator,
  verifiedUserValidator,
  filterMiddleware<UpdateMeReqBody>([
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'username',
    'avatar',
    'cover_photo'
  ]),
  updateMeValidator,
  wrapRequestHandler(updateMeController)
);

/**
 * Description. Get profile
 * Path: /:username
 * Method: GET
 */
usersRouter.get('/:username', wrapRequestHandler(getProfileController));

/**
 * Description. follow someone
 * Path: /follow
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: {followed_user_id: string}
 */
usersRouter.post(
  '/follow',
  accessTokenValidator,
  verifiedUserValidator,
  followValidator,
  wrapRequestHandler(followController)
);

/**
 * Description. unfollow someone
 * Path: /follow/:user_id
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: {followed_user_id: string}
 */
usersRouter.delete(
  '/follow/:user_id',
  accessTokenValidator,
  verifiedUserValidator,
  unfollowValidator,
  wrapRequestHandler(unfollowController)
);

export default usersRouter;
