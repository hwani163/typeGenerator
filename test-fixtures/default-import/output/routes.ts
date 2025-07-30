import AdminRoute from "../routes/admin.route";
import UserRoute from "../routes/user.route";

export const keys = ['AdminRoute', 'UserRoute'] as const;
export const routes = {
    AdminRoute: {
      class: AdminRoute,
      path: 'routes/admin.route',
    },
    UserRoute: {
      class: UserRoute,
      path: 'routes/user.route',
    },
  };
