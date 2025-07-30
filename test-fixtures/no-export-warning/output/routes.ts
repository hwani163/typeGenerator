import AdminRoute from "../routes/admin.route";
import UserRoute from "../routes/user.route";
import ValidRoute from "../routes/valid.route";

export const keys = ['AdminRoute', 'UserRoute', 'ValidRoute'] as const;
export const routes = {
    AdminRoute: {
      class: AdminRoute,
      path: 'routes/admin.route',
    },
    UserRoute: {
      class: UserRoute,
      path: 'routes/user.route',
    },
    ValidRoute: {
      class: ValidRoute,
      path: 'routes/valid.route',
    },
  };
