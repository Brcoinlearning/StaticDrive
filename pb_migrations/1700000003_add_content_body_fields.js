migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("contents")

  collection.schema.addField(new SchemaField({
    system: false,
    id: "body_source",
    name: "body_source",
    type: "text",
    required: false,
    presentable: false,
    unique: false,
    options: {
      min: null,
      max: null,
      pattern: ""
    }
  }))

  collection.schema.addField(new SchemaField({
    system: false,
    id: "body_format",
    name: "body_format",
    type: "text",
    required: false,
    presentable: false,
    unique: false,
    options: {
      min: null,
      max: 32,
      pattern: ""
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("contents")

  collection.schema.removeField("body_source")
  collection.schema.removeField("body_format")

  return dao.saveCollection(collection)
})
