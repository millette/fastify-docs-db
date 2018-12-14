// npm
const fp = require("fastify-plugin")
const DocsDb = require("docs-db")

// self
const { name } = require("./package.json")
const { getPage, getPages, deletePage } = require("./routes")

// core
const { URL } = require("url")

const pagedUrl = (u, page, rel) => {
  u.searchParams.set("page", page)
  return `<${u}>; rel="${rel}"`
}

const pagination = function(
  len,
  page,
  perPage,
  { raw: { url }, headers: { host, ...h } },
) {
  const first = 0
  const previous = page > 0 && page - 1
  const last = Math.ceil(len / perPage) - 1
  const next = page < last && page + 1

  // FIXME: add support for local https
  const u = new URL(url, `${h["x-forwarded-proto"] || "http"}://${host}`)
  const links = [pagedUrl(u, first, "first"), pagedUrl(u, last, "last")]
  if (previous !== false) links.push(pagedUrl(u, previous, "previous"))
  if (next !== false) links.push(pagedUrl(u, next, "next"))
  return this.header("Link", links.join(", "))
}

const lastMod = function(date, etag) {
  return this.etag(etag).header(
    "Last-Modified",
    typeof date === "string" ? date : new Date(date).toGMTString(),
  )
}

const configDefault = {
  responseTime: true,
  caching: true,
  cors: true,
  perPage: 24,
}

const nop = function() {
  return this
}

const plugin = function(fastify, opts, next) {
  let { config, docs } = opts
  const n0 = Date.now()
  config = { ...configDefault, ...config }
  fastify.log.info("Starting...")
  if (config.responseTime) fastify.register(require("fastify-response-time"))
  if (config.caching) {
    fastify.register(require("fastify-caching"))
    fastify.decorateReply("lastMod", lastMod)
  } else {
    fastify.decorateReply("etag", nop)
    fastify.decorateReply("lastMod", nop)
  }
  if (config.cors) fastify.register(require("fastify-cors"))

  // routes
  fastify.head("/pages", getPages)
  fastify.get("/pages", getPages)
  fastify.head("/page/:page", getPage)
  fastify.get("/page/:page", getPage)
  // fastify.get("/api/delete/:page", deletePage)
  fastify.delete("/page/:page", deletePage)

  // fastify.put("/api/page/:page", async (req, reply) => {
  // const page = req.params.page
  // })

  fastify.log.info(`Done starting (${(Date.now() - n0) / 1000}s).`)
  const now = Date.now()
  fastify.log.info("Reading...")
  fastify.decorate("db", new DocsDb(docs))
  fastify.decorate("perPage", config.perPage)
  fastify.decorateReply("pagination", pagination)
  fastify.log.info(`Done reading (${(Date.now() - now) / 1000}s).`)
  next()
}

module.exports = fp(plugin, {
  fastify: "^2.0.0",
  name,
})
