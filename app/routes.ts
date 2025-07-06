import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("account", "routes/account.tsx"),
  route("logout", "routes/logout.tsx"),
  route("users", "routes/users.tsx"),
  route("users/new", "routes/users.new.tsx"),
  route("users/:id/edit", "routes/users.$id.edit.tsx"),
  route("golfers", "routes/golfers.tsx"),
  route("golfers/new", "routes/golfers.new.tsx"),
  route("golfers/:id/edit", "routes/golfers.$id.edit.tsx"),
  route("foursomes", "routes/foursomes.tsx"),
  route("foursomes/new", "routes/foursomes.new.tsx"),
  route("foursomes/:id/edit", "routes/foursomes.$id.edit.tsx"),
  route("gallery", "routes/gallery.tsx"),
  route("champions", "routes/champions.tsx"),
  route("champions/new", "routes/champions.new.tsx"),
  route("champions/:id/edit", "routes/champions.$id.edit.tsx"),
] satisfies RouteConfig;
