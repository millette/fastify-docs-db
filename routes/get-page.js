"use strict"

module.exports = async function(req, reply) {
  const doc = this.db.getDoc(req.params.page, req.query.rev)

  if (!doc) {
    reply.code(404)
    throw new Error("API: Niet")
  }

  if (doc._deleted && !req.query.deleted) {
    reply.code(404)
    throw new Error("API: Niet (deleted)")
  }

  reply.lastMod(doc._updated, doc._rev)
  if (req.raw.method === "GET") return doc
  if (req.raw.method !== "HEAD") throw new Error("Unexpected getPage")
  reply.code(204)
  reply.header("content-length", JSON.stringify(doc).length)
}
