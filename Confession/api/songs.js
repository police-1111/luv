import express from "express";
import { v2 as cloudinary } from "cloudinary";

const router = express.Router();

router.get("/", async (req, res) => {
  console.log("🎧 GET /api/songs request received");

  // Configure Cloudinary safely (Vercel compatible)
  cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
  });

  try {
    // Cloudinary treats MP3s as raw or video types — search both
    const result = await cloudinary.search
      .expression("(folder:song AND (resource_type:raw OR resource_type:video))")
      .sort_by("created_at", "desc")
      .max_results(50)
      .execute();

    const songs = result.resources.map((r) => ({
      url: r.secure_url,
      name: r.public_id.split("/").pop(),
    }));

    console.log(`✅ Found ${songs.length} songs`);
    res.status(200).json({ songs });
  } catch (err) {
    console.error("❌ Error fetching songs:", err);
    res.status(500).json({
      error: "Failed to fetch songs from Cloudinary",
      details: err.message,
    });
  }
});

export default router;
