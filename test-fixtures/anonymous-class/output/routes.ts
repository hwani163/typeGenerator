import AdminRoute from "../routes/admin.route";
import UserProfileRoute from "../routes/user-profile.route";
import UserRoute from "../routes/user.route";

export const keys = ['AdminRoute', 'UserProfileRoute', 'UserRoute'] as const;
export const routes = {
    AdminRoute: {
      class: AdminRoute,
      path: 'routes/admin.route',
    },
    UserProfileRoute: {
      class: UserProfileRoute,
      path: 'routes/user-profile.route',
    },
    UserRoute: {
      class: UserRoute,
      path: 'routes/user.route',
    },
  };
