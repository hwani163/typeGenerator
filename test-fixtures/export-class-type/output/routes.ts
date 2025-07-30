import type AdminRoute from "../routes/admin.route";
import type { ExportClassTypeRoute } from "../routes/export-class-type.route";
import type UserRoute from "../routes/user.route";

export const keys = ['AdminRoute', 'ExportClassTypeRoute', 'UserRoute'] as const;

export interface Routes {
  AdminRoute: AdminRoute;
  ExportClassTypeRoute: ExportClassTypeRoute;
  UserRoute: UserRoute;
}
