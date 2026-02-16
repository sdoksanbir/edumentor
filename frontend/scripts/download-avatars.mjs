#!/usr/bin/env node
/**
 * DiceBear ücretsiz avatarlarını indirir.
 * public/avatars/ içine role+gender bazlı avatarlar kaydeder:
 *   teacher-female-1.svg, teacher-male-1.svg
 *   student-female-1.svg, student-male-1.svg
 *   default-1.svg
 * Çalıştırma: npm run download-avatars
 */
import { mkdir, writeFile } from "fs/promises"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, "..", "public", "avatars")

// DiceBear 9.x - avataaars stili (ücretsiz)
const BASE_URL = "https://api.dicebear.com/9.x/avataaars/svg"

const AVATARS = [
  { seed: "teacher-female", file: "teacher-female-1.svg" },
  { seed: "teacher-male", file: "teacher-male-1.svg" },
  { seed: "student-female", file: "student-female-1.svg" },
  { seed: "student-male", file: "student-male-1.svg" },
  { seed: "default", file: "default-1.svg" },
]

async function downloadAvatar(seed) {
  const url = `${BASE_URL}?seed=${encodeURIComponent(seed)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return res.text()
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  console.log(`Downloading role avatars to ${OUT_DIR}...`)

  for (const { seed, file } of AVATARS) {
    try {
      const svg = await downloadAvatar(seed)
      const path = join(OUT_DIR, file)
      await writeFile(path, svg, "utf-8")
      console.log(`  ✓ ${file}`)
    } catch (err) {
      console.error(`  ✗ ${file}:`, err.message)
    }
  }

  console.log("Done!")
}

main().catch(console.error)
