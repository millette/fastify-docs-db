"use strict"

module.exports = async function(req, reply) {
  const doc = this.db.deleteDoc(req.params.page, req.query.rev)
  reply
    .code(201)
    .lastMod(doc._updated)
    .etag(doc._rev)
  return doc
}
