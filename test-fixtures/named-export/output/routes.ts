import AdminRoute from "../routes/admin.route";
import { NamedExportRoute } from "../routes/named-export.route";
import UserRoute from "../routes/user.route";

export const keys = ['AdminRoute', 'NamedExportRoute', 'UserRoute'] as const;
export const routes = {
    AdminRoute: {
      class: AdminRoute,
      path: 'routes/admin.route',
    },
    NamedExportRoute: {
      class: NamedExportRoute,
      path: 'routes/named-export.route',
    },
    UserRoute: {
      class: UserRoute,
      path: 'routes/user.route',
    },
  };
