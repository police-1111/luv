import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";
import vaultRoute from "./api/vault.js";
import songsRoute from "./api/songs.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =======================================
// 🌥️ Cloudinary Config
// =======================================
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// =======================================
// 🔐 Session + Passport Setup
// =======================================
app.use(
  session({
    secret: "super_secret_key_123",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // true if using HTTPS
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ✅ Allowed Google Accounts
const ALLOWED_EMAILS = [
  "hiiyogitaaa11@gmail.com",
  "policeofficers100@gmail.com",
  "cybercrimesalert@gmail.com"
];

// =======================================
// 🔑 Google OAuth Setup
// =======================================
passport.use(
  new GoogleStrategy(
    {
      clientID:
        "900088000170-9iql224cug0sbrjonf1sp54n2qambscr.apps.googleusercontent.com",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      const email = profile.emails?.[0]?.value;
      if (ALLOWED_EMAILS.includes(email)) {
        console.log("✅ Authorized:", email);
        return done(null, profile);
      } else {
        console.log("🚫 Unauthorized attempt:", email);
        return done(null, false, { message: "Unauthorized user" });
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// =======================================
// 🧭 Middleware for Auth Protection
// =======================================
function ensureAuth(req, res, next) {
  if (
    req.isAuthenticated() &&
    ALLOWED_EMAILS.includes(req.user.emails[0].value)
  ) {
    return next();
  }
  res.redirect("/denied.html");
}

// =======================================
// 🧭 Google OAuth Routes
// =======================================
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/denied.html" }),
  (req, res) => {
    if (req.user && ALLOWED_EMAILS.includes(req.user.emails[0].value)) {
      console.log("✅ Login success:", req.user.emails[0].value);
      res.redirect("/confess.html");
    } else {
      console.log("🚫 Login blocked");
      req.logout(() => res.redirect("/denied.html"));
    }
  }
);

// Logout route
app.get("/logout", (req, res) => {
  req.logout(() => res.redirect("/"));
});

// =======================================
// 🌐 Serve Static Files
// =======================================
app.use(express.static(__dirname));

// =======================================
// ☁️ Cloudinary Routes via External APIs
// =======================================
app.use("/api/vault", vaultRoute);
app.use("/api/songs", songsRoute);

// =======================================
// 🏠 Main Routes
// =======================================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "home.html"));
});

app.get("/home.html", ensureAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "confess.html"));
});

// =======================================
// 🚀 Start Server
// =======================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
