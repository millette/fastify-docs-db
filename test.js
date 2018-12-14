// npm
import test from "ava"
import got from "got"
import fastifyMod from "fastify"

// self
import plugin from "."

const docs = {
  db: [
    [
      "koz-toahudup-coz",
      {
        _id: "koz-toahudup-coz",
        title: "Kec potu ib azise heptab abehje ebe nekap eju ec",
        content: "<p>Mozrokkig ur of lutoceg onza ceve zesom wik",
        _rev: "1-2air8yAL3kmEzSUq8NC9Q",
        _created: 1544652464975,
        _updated: 1544652465000,
      },
    ],
    [
      "koz-toahudup-cozv2",
      {
        _id: "koz-toahudup-cozv2",
        title: "V2-Kec potu ib azise heptab abehje ebe nekap eju ec",
        content: "Mozrokkig ur of lutoceg onza ceve zesom wik-v2",
        _rev: "0-1air8yAL3kmEzSUq8NCv2",
        _created: 1544652464975,
        _updated: 1544652464975,
      },
    ],
  ],
  history: [
    [
      "koz-toahudup-coz",
      [
        {
          _id: "koz-toahudup-coz",
          title: "Orig Kec potu ib azise heptab abehje ebe nekap eju ec",
          content: "<p>Mozrokkig ur of lutoceg onza ceve zesom wik",
          _rev: "0-1air8yAL3kmEzSUq8NC9Q",
          _created: 1544652464975,
          _updated: 1544652464975,
        },
      ],
    ],
    ["koz-toahudup-cozv2", []],
  ],
}

test("test numéro #1", async (t) => {
  const fastify = fastifyMod()
  fastify.register(plugin, { docs })
  const address = await fastify.listen()
  const { headers, body } = await got(`${address}/pages`, { json: true })
  t.is(body.length, 2)
  const d2 = await got(`${address}/page/${body[0]._id}`, { json: true })
  t.is(d2.body.title, "Kec potu ib azise heptab abehje ebe nekap eju ec")
  const d3 = await got(`${address}/page/${body[0]._id}?rev=0`, { json: true })
  t.is(d3.body.title, "Orig Kec potu ib azise heptab abehje ebe nekap eju ec")
  const d4 = await got.delete(
    `${address}/page/${body[0]._id}?rev=${d2.body._rev}`,
    { json: true },
  )
  t.truthy(d4.headers["content-length"] < d2.headers["content-length"])

  return t.throwsAsync(got(`${address}/page/${body[0]._id}`, { json: true }), {
    instanceOf: got.HTTPError,
    message: "Response code 404 (Not Found)",
  })
})
