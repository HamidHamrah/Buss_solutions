// Run manually before deploying a customer: `node scripts/stamp-deploy.mjs <slug>`
// Stamps render.yaml's service name + CORS/JWT/Email `value:` entries, and wrangler.json's
// Worker name, from customers/<slug>/config.json's `deployment` block. Never touches
// `sync: false` entries in render.yaml — those are secrets set manually in Render's
// dashboard per environment, same convention as every sibling repo this template replaces.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

const slug = process.argv[2]
if (!slug) {
  console.error('Usage: node scripts/stamp-deploy.mjs <customer-slug>')
  process.exit(1)
}

const configPath = path.join(repoRoot, 'customers', slug, 'config.json')
if (!existsSync(configPath)) {
  console.error(`No config found for slug "${slug}" at ${configPath}`)
  process.exit(1)
}

const { deployment } = JSON.parse(readFileSync(configPath, 'utf-8'))

// ── render.yaml ──────────────────────────────────────────────────────────────
const renderPath = path.join(repoRoot, 'render.yaml')
let render = readFileSync(renderPath, 'utf-8')
render = render.replace(/(- name: )\S+/, `$1${deployment.renderServiceName}`)
render = render.replace(
  /(- key: Customer__Slug\n\s+value: )\S+/,
  `$1${slug}`
)
deployment.corsOrigins.forEach((origin, i) => {
  const re = new RegExp(`(- key: Cors__AllowedOrigins__${i + 1}\\n\\s+value: )\\S+`)
  if (re.test(render)) render = render.replace(re, `$1${origin}`)
})
render = render.replace(/(- key: Jwt__Issuer\n\s+value: )\S+/, `$1${deployment.jwtIssuer}`)
render = render.replace(/(- key: Jwt__Audience\n\s+value: )\S+/, `$1${deployment.jwtAudience}`)
render = render.replace(/(- key: Email__FromAddress\n\s+value: )\S+/, `$1${deployment.emailFromAddress}`)
render = render.replace(/(- key: Email__NotifyTo\n\s+value: )\S+/, `$1${deployment.emailNotifyTo}`)
writeFileSync(renderPath, render)

// ── wrangler.json ───────────────────────────────────────────────────────────
const wranglerPath = path.join(repoRoot, 'wrangler.json')
let wrangler = readFileSync(wranglerPath, 'utf-8')
wrangler = wrangler.replace(/("name":\s*)"[^"]*"/, `$1"${deployment.cloudflareWorkerName}"`)
writeFileSync(wranglerPath, wrangler)

console.log(`[stamp-deploy] Stamped render.yaml + wrangler.json for "${slug}"`)
console.log(`  Render service: ${deployment.renderServiceName}`)
console.log(`  Cloudflare Worker: ${deployment.cloudflareWorkerName}`)
console.log(`  CORS origins: ${deployment.corsOrigins.join(', ')}`)
