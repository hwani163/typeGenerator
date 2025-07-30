import type AdminRoute from "../routes/admin.route";
import type UserRoute from "../routes/user.route";

export const keys = ['AdminRoute', 'UserRoute'] as const;

export interface Routes {
  AdminRoute: AdminRoute;
  UserRoute: UserRoute;
}
