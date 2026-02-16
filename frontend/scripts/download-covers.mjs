#!/usr/bin/env node
/**
 * Cover görsellerini indirir. public/covers/ içine kaydeder.
 * Unsplash (unsplash.com) ücretsiz görseller - License: https://unsplash.com/license
 * Çalıştırma: node scripts/download-covers.mjs
 * Veya: npm run download-covers
 */
import { mkdir, writeFile, copyFile } from "fs/promises"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, "..", "public", "covers")

// Unsplash direct URLs - ücretsiz, lisans: https://unsplash.com/license
// Format: w=1200 boyutunda, landscape cover için uygun
const COVERS = [
  {
    role: "teacher",
    url: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&q=80",
    desc: "Classroom, whiteboard, education",
  },
  {
    role: "student",
    url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80",
    desc: "Study, learning, collaboration",
  },
  {
    role: "admin",
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
    desc: "Modern office, dashboard",
  },
  {
    role: "parent",
    url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1200&q=80",
    desc: "Family, parent-child",
  },
  {
    role: "default",
    url: "https://images.unsplash.com/photo-1497215846104-dccb96e381c2?w=1200&q=80",
    desc: "Office, default",
  },
]

async function downloadCover({ role, url }) {
  const res = await fetch(url, {
    headers: { "User-Agent": "PremiumReactAdmin/1.0 (cover download)" },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = await res.arrayBuffer()
  return Buffer.from(buf)
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  console.log("Downloading cover images from Unsplash to", OUT_DIR)
  console.log("(Unsplash License: https://unsplash.com/license - free to use)\n")

  for (const { role, url, desc } of COVERS) {
    const file = `${role}.jpg`
    try {
      const data = await downloadCover({ role, url })
      const path = join(OUT_DIR, file)
      await writeFile(path, data)
      console.log(`  ✓ ${file} (${desc})`)
    } catch (err) {
      console.error(`  ✗ ${file}:`, err.message)
      if (role === "default") {
        const adminPath = join(OUT_DIR, "admin.jpg")
        const defaultPath = join(OUT_DIR, "default.jpg")
        try {
          await copyFile(adminPath, defaultPath)
          console.log("  → default.jpg: copied from admin.jpg (fallback)")
        } catch (_) {}
      }
    }
  }

  console.log("\nDone! Add attribution in your app: Photos from Unsplash.")
}

main().catch(console.error)
