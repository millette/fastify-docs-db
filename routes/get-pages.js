"use strict"

const makeSorter = (sort) => (a, b) => {
  const af = a[sort]
  const bf = b[sort]
  if (af > bf) return -1
  if (af < bf) return 1
  return 0
}

const sorterLastMod = makeSorter("_updated")

const format = ({ _created, _updated, ...rest }) => ({
  _created: new Date(_created).toISOString(),
  _updated: new Date(_updated).toISOString(),
  ...rest,
})

const assert = (reply, condition, message) => {
  if (condition) return
  reply.code(400)
  throw new Error(message)
}

module.exports = async function(req, reply) {
  // TODO: cache until dirty (handle in docs-db)
  const docs = this.db.docMetas
  if (!docs.length) {
    reply.code(404)
    throw new Error("No content at all")
  }

  const asc = "asc" in req.query
  // FIXME: use reply.code(400) and throw instead
  assert(
    reply,
    !req.query.page || !isNaN(req.query.page),
    "page should be an integer",
  )
  assert(reply, !asc || !req.query.asc, "asc should not have any value")

  const d2 = docs.sort(sorterLastMod)
  const { _rev, _updated } = d2[0]
  let d3
  if (req.query.sort) {
    const sort = "_" + req.query.sort
    // FIXME: use reply.code(400) and throw instead
    assert(reply, sort in docs[0], "Unknown sort field")
    d3 = sort === "_updated" ? d2 : docs.sort(makeSorter(sort))
    if (asc) d3 = d3.reverse()
  } else {
    d3 = docs
  }

  const page = parseInt(req.query.page, 10) || 0

  const d4 = d3
    .slice(page * this.perPage, page * this.perPage + this.perPage)
    .map(format)

  if (!d4.length) {
    reply.code(404)
    throw new Error("No content found")
  }

  reply
    .pagination(docs.length, page, this.perPage, req)
    .lastMod(_updated, `${this.perPage}-${_rev}`)

  if (req.raw.method === "GET") return d4
  if (req.raw.method !== "HEAD") throw new Error("Unexpected getPages")
  reply.code(204)
  reply.header("content-length", JSON.stringify(d4).length)
}
