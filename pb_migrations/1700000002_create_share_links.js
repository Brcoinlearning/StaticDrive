migrate((db) => {
  const collection = new Collection({
    id: "share_links",
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    name: "share_links",
    type: "base",
    system: false,
    schema: [
      {
        system: false,
        id: "content_id",
        name: "content_id",
        type: "relation",
        required: true,
        presentable: false,
        unique: false,
        options: {
          collectionId: "contents",
          cascadeDelete: true,
          minSelect: 1,
          maxSelect: 1,
          displayFields: ["content_hash"]
        }
      },
      {
        system: false,
        id: "share_hash",
        name: "share_hash",
        type: "text",
        required: true,
        presentable: false,
        unique: true,
        options: {
          min: 8,
          max: 64,
          pattern: ""
        }
      },
      {
        system: false,
        id: "is_revoked",
        name: "is_revoked",
        type: "bool",
        required: false,
        presentable: false,
        unique: false,
        options: {}
      }
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_share_links_share_hash ON share_links (share_hash)",
      "CREATE INDEX idx_share_links_content_id ON share_links (content_id)"
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
  const collection = dao.findCollectionByNameOrId("share_links")
  return dao.deleteCollection(collection)
})
