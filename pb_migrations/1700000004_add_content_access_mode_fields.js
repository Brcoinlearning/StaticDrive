migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("contents")

  collection.schema.addField(new SchemaField({
    system: false,
    id: "access_mode",
    name: "access_mode",
    type: "select",
    required: false,
    presentable: false,
    unique: false,
    options: {
      maxSelect: 1,
      values: ["public", "password"]
    }
  }))

  collection.schema.addField(new SchemaField({
    system: false,
    id: "access_password_hash",
    name: "access_password_hash",
    type: "text",
    required: false,
    presentable: false,
    unique: false,
    options: {
      min: null,
      max: 255,
      pattern: ""
    }
  }))

  collection.schema.addField(new SchemaField({
    system: false,
    id: "access_hint",
    name: "access_hint",
    type: "text",
    required: false,
    presentable: false,
    unique: false,
    options: {
      min: null,
      max: 255,
      pattern: ""
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("contents")

  collection.schema.removeField("access_mode")
  collection.schema.removeField("access_password_hash")
  collection.schema.removeField("access_hint")

  return dao.saveCollection(collection)
})
