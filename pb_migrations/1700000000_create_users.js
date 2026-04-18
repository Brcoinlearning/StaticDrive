migrate((db) => {
  const collection = new Collection({
    id: "users_api",
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    name: "users_api",
    type: "base",
    system: false,
    schema: [
      {
        system: false,
        id: "display_name",
        name: "display_name",
        type: "text",
        required: true,
        presentable: false,
        unique: false,
        options: {
          min: null,
          max: 120,
          pattern: ""
        }
      },
      {
        system: false,
        id: "api_key",
        name: "api_key",
        type: "text",
        required: true,
        presentable: false,
        unique: true,
        options: {
          min: 16,
          max: 255,
          pattern: ""
        }
      }
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_users_api_api_key ON users_api (api_key)"
    ],
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    options: {}
  })

  return Dao(db).saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("users_api")
  return dao.deleteCollection(collection)
})
