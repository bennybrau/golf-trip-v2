import { jsx, jsxs } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, UNSAFE_withComponentProps, Outlet, UNSAFE_withErrorBoundaryProps, isRouteErrorResponse, Meta, Links, ScrollRestoration, Scripts, redirect, Link, Form, useActionData, useLoaderData } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import React from "react";
import { z } from "zod";
const streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, routerContext, loadContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");
    let readyOption = userAgent && isbot(userAgent) || routerContext.isSpaMode ? "onAllReady" : "onShellReady";
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(ServerRouter, { context: routerContext, url: request.url }),
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, streamTimeout + 1e3);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
const links = () => [{
  rel: "preconnect",
  href: "https://fonts.googleapis.com"
}, {
  rel: "preconnect",
  href: "https://fonts.gstatic.com",
  crossOrigin: "anonymous"
}, {
  rel: "stylesheet",
  href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
}];
function Layout({
  children
}) {
  return /* @__PURE__ */ jsxs("html", {
    lang: "en",
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {})]
    }), /* @__PURE__ */ jsxs("body", {
      children: [children, /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
}
const root = UNSAFE_withComponentProps(function App() {
  return /* @__PURE__ */ jsx(Outlet, {});
});
const ErrorBoundary = UNSAFE_withErrorBoundaryProps(function ErrorBoundary2({
  error
}) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack;
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  }
  return /* @__PURE__ */ jsxs("main", {
    className: "pt-16 p-4 container mx-auto",
    children: [/* @__PURE__ */ jsx("h1", {
      children: message
    }), /* @__PURE__ */ jsx("p", {
      children: details
    }), stack]
  });
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  Layout,
  default: root,
  links
}, Symbol.toStringTag, { value: "Module" }));
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
async function authenticateUser(email, password) {
  let user = await prisma.user.findUnique({
    where: { email }
  });
  if (!user) {
    const hashedPassword = await bcrypt.hash(password, 10);
    user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: email.split("@")[0]
        // Use email prefix as default name
      }
    });
  } else {
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return null;
  }
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar || void 0,
    phone: user.phone || void 0
  };
}
async function createSession(userId) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3);
  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt
    }
  });
  return token;
}
async function getSessionUser(token) {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true }
  });
  if (!session || session.expiresAt < /* @__PURE__ */ new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    return null;
  }
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    avatar: session.user.avatar || void 0,
    phone: session.user.phone || void 0
  };
}
async function deleteSession(token) {
  await prisma.session.delete({ where: { token } });
}
async function updateUser(id, updates) {
  const user = await prisma.user.update({
    where: { id },
    data: updates
  });
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar || void 0,
    phone: user.phone || void 0
  };
}
async function requireAuth(request) {
  const sessionToken = getSessionToken(request);
  if (!sessionToken) {
    throw redirect("/login");
  }
  const user = await getSessionUser(sessionToken);
  if (!user) {
    throw redirect("/login");
  }
  return user;
}
function getSessionToken(request) {
  const cookie = request.headers.get("Cookie");
  if (!cookie) return null;
  const sessionCookie = cookie.split(";").find((c) => c.trim().startsWith("session="));
  if (!sessionCookie) return null;
  return sessionCookie.split("=")[1];
}
function createSessionCookie(token) {
  return `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`;
}
function clearSessionCookie() {
  return "session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
}
const Button = React.forwardRef(
  ({ className = "", variant = "primary", size = "md", fullWidth = false, children, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
    const variantClasses = {
      primary: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 border border-transparent",
      secondary: "bg-white hover:bg-gray-50 text-gray-700 focus:ring-green-500 border border-gray-300",
      danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 border border-transparent"
    };
    const sizeClasses = {
      sm: "px-3 py-2 text-sm",
      md: "px-4 py-3 text-sm",
      lg: "px-6 py-3 text-base"
    };
    const widthClass = fullWidth ? "w-full" : "";
    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`.trim();
    return /* @__PURE__ */ jsx("button", { ref, className: classes, ...props, children });
  }
);
Button.displayName = "Button";
const Input = React.forwardRef(
  ({ className = "", label, error, helperText, ...props }, ref) => {
    const inputClasses = `w-full px-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${error ? "border-red-300" : "border-gray-300"} ${className}`.trim();
    return /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      label && /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700", children: label }),
      /* @__PURE__ */ jsx("input", { ref, className: inputClasses, ...props }),
      error && /* @__PURE__ */ jsx("p", { className: "text-sm text-red-600", children: error }),
      helperText && !error && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: helperText })
    ] });
  }
);
Input.displayName = "Input";
function Card({ children, className = "" }) {
  return /* @__PURE__ */ jsx("div", { className: `bg-white shadow-lg rounded-lg ${className}`.trim(), children });
}
function CardHeader({ children, className = "" }) {
  return /* @__PURE__ */ jsx("div", { className: `px-6 py-4 border-b border-gray-200 ${className}`.trim(), children });
}
function CardContent({ children, className = "" }) {
  return /* @__PURE__ */ jsx("div", { className: `px-6 py-4 ${className}`.trim(), children });
}
function Alert({ children, variant = "info", className = "" }) {
  const variantClasses = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    info: "bg-blue-50 border-blue-200 text-blue-800"
  };
  const iconClasses = {
    success: "text-green-400",
    error: "text-red-400",
    warning: "text-yellow-400",
    info: "text-blue-400"
  };
  const icons = {
    success: /* @__PURE__ */ jsx("svg", { className: "h-5 w-5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }) }),
    error: /* @__PURE__ */ jsx("svg", { className: "h-5 w-5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z", clipRule: "evenodd" }) }),
    warning: /* @__PURE__ */ jsx("svg", { className: "h-5 w-5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z", clipRule: "evenodd" }) }),
    info: /* @__PURE__ */ jsx("svg", { className: "h-5 w-5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z", clipRule: "evenodd" }) })
  };
  return /* @__PURE__ */ jsx("div", { className: `border rounded-lg p-4 ${variantClasses[variant]} ${className}`.trim(), children: /* @__PURE__ */ jsxs("div", { className: "flex", children: [
    /* @__PURE__ */ jsx("div", { className: iconClasses[variant], children: icons[variant] }),
    /* @__PURE__ */ jsx("div", { className: "ml-3 text-sm", children })
  ] }) });
}
function Avatar({ src, alt, name, size = "md", className = "" }) {
  const sizeClasses = {
    sm: "h-8 w-8 text-sm",
    md: "h-12 w-12 text-base",
    lg: "h-16 w-16 text-lg",
    xl: "h-24 w-24 text-2xl"
  };
  const baseClasses = `rounded-full object-cover ${sizeClasses[size]} ${className}`.trim();
  if (src) {
    return /* @__PURE__ */ jsx(
      "img",
      {
        src,
        alt,
        className: baseClasses
      }
    );
  }
  return /* @__PURE__ */ jsx("div", { className: `bg-gray-300 flex items-center justify-center ${baseClasses}`.trim(), children: /* @__PURE__ */ jsx("span", { className: "font-medium text-gray-600", children: name.charAt(0).toUpperCase() }) });
}
function Logo({ size = "md", className = "" }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-24 w-24"
  };
  const iconSizeClasses = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };
  return /* @__PURE__ */ jsx("div", { className: `bg-green-600 rounded-full flex items-center justify-center ${sizeClasses[size]} ${className}`.trim(), children: /* @__PURE__ */ jsx("svg", { className: `text-white ${iconSizeClasses[size]}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 10V3L4 14h7v7l9-11h-7z" }) }) });
}
function Navigation({ user }) {
  return /* @__PURE__ */ jsx("nav", { className: "bg-white shadow-lg border-b border-gray-200", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between h-16", children: [
    /* @__PURE__ */ jsx("div", { className: "flex items-center", children: /* @__PURE__ */ jsxs(Link, { to: "/", className: "flex items-center space-x-2", children: [
      /* @__PURE__ */ jsx(Logo, { size: "sm" }),
      /* @__PURE__ */ jsx("span", { className: "text-xl font-bold text-gray-900", children: "Scaletta Golf" })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4", children: [
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/",
          className: "text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors",
          children: "Home"
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
        /* @__PURE__ */ jsxs("button", { className: "flex items-center space-x-2 text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors", children: [
          /* @__PURE__ */ jsx(Avatar, { src: user.avatar, alt: user.name, name: user.name, size: "sm" }),
          /* @__PURE__ */ jsx("span", { children: user.name }),
          /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50", children: /* @__PURE__ */ jsxs("div", { className: "py-1", children: [
          /* @__PURE__ */ jsx(
            Link,
            {
              to: "/account",
              className: "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors",
              children: "Account Settings"
            }
          ),
          /* @__PURE__ */ jsx(Form, { method: "post", action: "/logout", children: /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              className: "block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors",
              children: "Sign Out"
            }
          ) })
        ] }) })
      ] })
    ] })
  ] }) }) });
}
function meta({}) {
  return [{
    title: "Scaletta Golf - Home"
  }, {
    name: "description",
    content: "Your premier golf experience"
  }];
}
async function loader$3({
  request
}) {
  try {
    const user = await requireAuth(request);
    return {
      user
    };
  } catch (response) {
    throw response;
  }
}
const home = UNSAFE_withComponentProps(function Home({
  loaderData
}) {
  const {
    user
  } = loaderData;
  return /* @__PURE__ */ jsxs("div", {
    className: "min-h-screen bg-gray-50",
    children: [/* @__PURE__ */ jsx(Navigation, {
      user
    }), /* @__PURE__ */ jsx("main", {
      className: "max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8",
      children: /* @__PURE__ */ jsxs("div", {
        className: "text-center",
        children: [/* @__PURE__ */ jsx("div", {
          className: "flex justify-center mb-8",
          children: /* @__PURE__ */ jsx(Logo, {
            size: "lg"
          })
        }), /* @__PURE__ */ jsx("h1", {
          className: "text-4xl font-bold text-gray-900 mb-4",
          children: "Scaletta Golf"
        }), /* @__PURE__ */ jsx("p", {
          className: "text-xl text-gray-600 mb-8",
          children: "Your premier golf experience awaits"
        }), /* @__PURE__ */ jsx(Card, {
          className: "max-w-2xl mx-auto",
          children: /* @__PURE__ */ jsxs(CardContent, {
            className: "p-8",
            children: [/* @__PURE__ */ jsxs("h2", {
              className: "text-2xl font-semibold text-gray-900 mb-4",
              children: ["Hello, ", user.name, "!"]
            }), /* @__PURE__ */ jsx("p", {
              className: "text-gray-600",
              children: "Welcome to your golf management dashboard. Here you can track your games, manage your profile, and connect with other golf enthusiasts."
            })]
          })
        })]
      })
    })]
  });
});
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: home,
  loader: loader$3,
  meta
}, Symbol.toStringTag, { value: "Module" }));
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required")
});
const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  phone: z.string().optional().refine((val) => {
    if (!val) return true;
    return /^[\+]?[1-9][\d]{0,15}$/.test(val.replace(/[\s\-\(\)]/g, ""));
  }, "Please enter a valid phone number"),
  avatar: z.string().url("Please enter a valid URL").optional().or(z.literal(""))
});
z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters")
});
async function loader$2({
  request
}) {
  const sessionToken = getSessionToken(request);
  if (sessionToken) {
    throw redirect("/");
  }
  return null;
}
async function action$2({
  request
}) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  const result = loginSchema.safeParse(data);
  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      values: data
    };
  }
  const {
    email,
    password
  } = result.data;
  try {
    const user = await authenticateUser(email, password);
    if (!user) {
      return {
        error: "Invalid email or password",
        values: data
      };
    }
    const sessionToken = await createSession(user.id);
    return redirect("/", {
      headers: {
        "Set-Cookie": createSessionCookie(sessionToken)
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return {
      error: "An error occurred during login",
      values: data
    };
  }
}
const login = UNSAFE_withComponentProps(function Login() {
  var _a, _b, _c, _d, _e;
  const actionData = useActionData();
  return /* @__PURE__ */ jsx("div", {
    className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100",
    children: /* @__PURE__ */ jsx("div", {
      className: "max-w-md w-full mx-4",
      children: /* @__PURE__ */ jsx(Card, {
        className: "shadow-xl",
        children: /* @__PURE__ */ jsxs(CardContent, {
          className: "p-8",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "text-center mb-8",
            children: [/* @__PURE__ */ jsx("div", {
              className: "flex justify-center mb-4",
              children: /* @__PURE__ */ jsx(Logo, {})
            }), /* @__PURE__ */ jsx("h2", {
              className: "text-3xl font-bold text-gray-900",
              children: "Scaletta Golf"
            }), /* @__PURE__ */ jsx("p", {
              className: "mt-2 text-gray-600",
              children: "Sign in to your account"
            })]
          }), /* @__PURE__ */ jsxs(Form, {
            method: "post",
            className: "space-y-6",
            children: [/* @__PURE__ */ jsx(Input, {
              name: "email",
              type: "email",
              autoComplete: "email",
              label: "Email Address",
              placeholder: "Enter your email",
              defaultValue: (_a = actionData == null ? void 0 : actionData.values) == null ? void 0 : _a.email,
              error: (_c = (_b = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _b.email) == null ? void 0 : _c[0]
            }), /* @__PURE__ */ jsx(Input, {
              name: "password",
              type: "password",
              autoComplete: "current-password",
              label: "Password",
              placeholder: "Enter your password",
              error: (_e = (_d = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _d.password) == null ? void 0 : _e[0]
            }), (actionData == null ? void 0 : actionData.error) && /* @__PURE__ */ jsx(Alert, {
              variant: "error",
              children: actionData.error
            }), /* @__PURE__ */ jsx(Button, {
              type: "submit",
              fullWidth: true,
              children: "Sign In"
            })]
          }), /* @__PURE__ */ jsx("div", {
            className: "mt-6 text-center",
            children: /* @__PURE__ */ jsx("p", {
              className: "text-sm text-gray-500",
              children: "Demo: Use any email and password to create an account"
            })
          })]
        })
      })
    })
  });
});
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$2,
  default: login,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
async function loader$1({
  request
}) {
  const user = await requireAuth(request);
  return {
    user
  };
}
async function action$1({
  request
}) {
  const user = await requireAuth(request);
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  const result = updateProfileSchema.safeParse(data);
  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      values: data
    };
  }
  try {
    const updatedUser = await updateUser(user.id, result.data);
    return {
      success: true,
      user: updatedUser
    };
  } catch (error) {
    console.error("Profile update error:", error);
    return {
      error: "Failed to update profile",
      values: data
    };
  }
}
const account = UNSAFE_withComponentProps(function Account() {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  const {
    user
  } = useLoaderData();
  const actionData = useActionData();
  const displayUser = (actionData == null ? void 0 : actionData.user) || user;
  return /* @__PURE__ */ jsxs("div", {
    className: "min-h-screen bg-gray-50",
    children: [/* @__PURE__ */ jsx(Navigation, {
      user: displayUser
    }), /* @__PURE__ */ jsxs("main", {
      className: "max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8",
      children: [/* @__PURE__ */ jsxs(Card, {
        className: "shadow-xl",
        children: [/* @__PURE__ */ jsxs(CardHeader, {
          children: [/* @__PURE__ */ jsx("h1", {
            className: "text-3xl font-bold text-gray-900",
            children: "Account Settings"
          }), /* @__PURE__ */ jsx("p", {
            className: "mt-2 text-gray-600",
            children: "Manage your profile information"
          })]
        }), /* @__PURE__ */ jsxs(CardContent, {
          className: "space-y-6",
          children: [(actionData == null ? void 0 : actionData.success) && /* @__PURE__ */ jsx(Alert, {
            variant: "success",
            children: "Profile updated successfully!"
          }), /* @__PURE__ */ jsxs(Form, {
            method: "post",
            className: "space-y-6",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "grid grid-cols-1 gap-6 sm:grid-cols-2",
              children: [/* @__PURE__ */ jsx("div", {
                className: "sm:col-span-2",
                children: /* @__PURE__ */ jsx(Input, {
                  label: "Email Address",
                  type: "email",
                  value: displayUser.email,
                  disabled: true,
                  className: "bg-gray-50 text-gray-500 cursor-not-allowed",
                  helperText: "Email cannot be changed"
                })
              }), /* @__PURE__ */ jsx("div", {
                className: "sm:col-span-2",
                children: /* @__PURE__ */ jsx(Input, {
                  name: "name",
                  label: "Full Name",
                  type: "text",
                  defaultValue: ((_a = actionData == null ? void 0 : actionData.values) == null ? void 0 : _a.name) || displayUser.name,
                  placeholder: "Enter your full name",
                  error: (_c = (_b = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _b.name) == null ? void 0 : _c[0]
                })
              }), /* @__PURE__ */ jsx("div", {
                className: "sm:col-span-2",
                children: /* @__PURE__ */ jsx(Input, {
                  name: "phone",
                  label: "Phone Number (optional)",
                  type: "tel",
                  defaultValue: ((_d = actionData == null ? void 0 : actionData.values) == null ? void 0 : _d.phone) || displayUser.phone || "",
                  placeholder: "Enter your phone number",
                  error: (_f = (_e = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _e.phone) == null ? void 0 : _f[0]
                })
              }), /* @__PURE__ */ jsx("div", {
                className: "sm:col-span-2",
                children: /* @__PURE__ */ jsx(Input, {
                  name: "avatar",
                  label: "Avatar URL (optional)",
                  type: "url",
                  defaultValue: ((_g = actionData == null ? void 0 : actionData.values) == null ? void 0 : _g.avatar) || displayUser.avatar || "",
                  placeholder: "https://example.com/avatar.jpg",
                  error: (_i = (_h = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _h.avatar) == null ? void 0 : _i[0],
                  helperText: "Provide a URL to an image for your profile picture"
                })
              })]
            }), (actionData == null ? void 0 : actionData.error) && /* @__PURE__ */ jsx(Alert, {
              variant: "error",
              children: actionData.error
            }), /* @__PURE__ */ jsx("div", {
              className: "flex justify-end",
              children: /* @__PURE__ */ jsx(Button, {
                type: "submit",
                children: "Save Changes"
              })
            })]
          })]
        })]
      }), /* @__PURE__ */ jsxs(Card, {
        className: "mt-8 shadow-xl",
        children: [/* @__PURE__ */ jsx(CardHeader, {
          children: /* @__PURE__ */ jsx("h2", {
            className: "text-lg font-semibold text-gray-900",
            children: "Profile Preview"
          })
        }), /* @__PURE__ */ jsx(CardContent, {
          children: /* @__PURE__ */ jsxs("div", {
            className: "flex items-center space-x-4",
            children: [/* @__PURE__ */ jsx(Avatar, {
              src: displayUser.avatar,
              alt: displayUser.name,
              name: displayUser.name,
              size: "lg"
            }), /* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("h3", {
                className: "text-lg font-medium text-gray-900",
                children: displayUser.name
              }), /* @__PURE__ */ jsx("p", {
                className: "text-gray-600",
                children: displayUser.email
              }), displayUser.phone && /* @__PURE__ */ jsx("p", {
                className: "text-gray-600",
                children: displayUser.phone
              })]
            })]
          })
        })]
      })]
    })]
  });
});
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1,
  default: account,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
async function action({
  request
}) {
  const sessionToken = getSessionToken(request);
  if (sessionToken) {
    await deleteSession(sessionToken);
  }
  return redirect("/login", {
    headers: {
      "Set-Cookie": clearSessionCookie()
    }
  });
}
async function loader() {
  return redirect("/");
}
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action,
  loader
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-C_Zzt9V7.js", "imports": ["/assets/chunk-QMGIS6GS-YbxEZTjb.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": true, "module": "/assets/root-dmTKmHq-.js", "imports": ["/assets/chunk-QMGIS6GS-YbxEZTjb.js"], "css": ["/assets/root-Dua51moP.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/home": { "id": "routes/home", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/home-Bsg2dmnY.js", "imports": ["/assets/chunk-QMGIS6GS-YbxEZTjb.js", "/assets/Navigation-D0BNUioj.js", "/assets/Logo-C7Ikp3ea.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/login": { "id": "routes/login", "parentId": "root", "path": "login", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/login-CPZbjAn9.js", "imports": ["/assets/chunk-QMGIS6GS-YbxEZTjb.js", "/assets/Logo-C7Ikp3ea.js", "/assets/Alert-d_GJTFq-.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/account": { "id": "routes/account", "parentId": "root", "path": "account", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/account-CjCs9mxx.js", "imports": ["/assets/chunk-QMGIS6GS-YbxEZTjb.js", "/assets/Navigation-D0BNUioj.js", "/assets/Logo-C7Ikp3ea.js", "/assets/Alert-d_GJTFq-.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/logout": { "id": "routes/logout", "parentId": "root", "path": "logout", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/logout-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-8f4ca808.js", "version": "8f4ca808", "sri": void 0 };
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "unstable_middleware": false, "unstable_optimizeDeps": false, "unstable_splitRouteModules": false, "unstable_subResourceIntegrity": false, "unstable_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = [];
const routeDiscovery = { "mode": "lazy", "manifestPath": "/__manifest" };
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/home": {
    id: "routes/home",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route1
  },
  "routes/login": {
    id: "routes/login",
    parentId: "root",
    path: "login",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/account": {
    id: "routes/account",
    parentId: "root",
    path: "account",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/logout": {
    id: "routes/logout",
    parentId: "root",
    path: "logout",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  prerender,
  publicPath,
  routeDiscovery,
  routes,
  ssr
};
