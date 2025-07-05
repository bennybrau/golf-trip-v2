import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("account", "routes/account.tsx"),
  route("logout", "routes/logout.tsx"),
  route("golfers", "routes/golfers.tsx"),
  route("foursomes", "routes/foursomes.tsx"),
] satisfies RouteConfig;
