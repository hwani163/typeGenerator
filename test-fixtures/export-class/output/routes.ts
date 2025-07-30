import AdminRoute from "../routes/admin.route";
import { ExportClassRoute } from "../routes/export-class.route";
import UserRoute from "../routes/user.route";

export const keys = ['AdminRoute', 'ExportClassRoute', 'UserRoute'] as const;
export const routes = {
    AdminRoute: {
      class: AdminRoute,
      path: 'routes/admin.route',
    },
    ExportClassRoute: {
      class: ExportClassRoute,
      path: 'routes/export-class.route',
    },
    UserRoute: {
      class: UserRoute,
      path: 'routes/user.route',
    },
  };
