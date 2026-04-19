migrate((db) => {
  const collection = new Collection({
    id: "contents",
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    name: "contents",
    type: "base",
    system: false,
    schema: [
      {
        system: false,
        id: "owner_user_id",
        name: "owner_user_id",
        type: "relation",
        required: true,
        presentable: false,
        unique: false,
        options: {
          collectionId: "users_api",
          cascadeDelete: false,
          minSelect: 1,
          maxSelect: 1,
          displayFields: ["display_name"]
        }
      },
      {
        system: false,
        id: "type",
        name: "type",
        type: "select",
        required: true,
        presentable: false,
        unique: false,
        options: {
          maxSelect: 1,
          values: ["file", "rich_text"]
        }
      },
      {
        system: false,
        id: "title",
        name: "title",
        type: "text",
        required: false,
        presentable: false,
        unique: false,
        options: {
          min: null,
          max: 255,
          pattern: ""
        }
      },
      {
        system: false,
        id: "original_filename",
        name: "original_filename",
        type: "text",
        required: false,
        presentable: false,
        unique: false,
        options: {
          min: null,
          max: 255,
          pattern: ""
        }
      },
      {
        system: false,
        id: "content_hash",
        name: "content_hash",
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
        id: "storage_path",
        name: "storage_path",
        type: "text",
        required: false,
        presentable: false,
        unique: false,
        options: {
          min: null,
          max: 512,
          pattern: ""
        }
      },
      {
        system: false,
        id: "mime_type",
        name: "mime_type",
        type: "text",
        required: false,
        presentable: false,
        unique: false,
        options: {
          min: null,
          max: 255,
          pattern: ""
        }
      },
      {
        system: false,
        id: "file_size",
        name: "file_size",
        type: "number",
        required: false,
        presentable: false,
        unique: false,
        options: {
          noDecimal: true,
          min: 0,
          max: null
        }
      },
      {
        system: false,
        id: "html_content",
        name: "html_content",
        type: "editor",
        required: false,
        presentable: false,
        unique: false,
        options: {
          convertUrls: false
        }
      },
      {
        system: false,
        id: "is_shared",
        name: "is_shared",
        type: "bool",
        required: false,
        presentable: false,
        unique: false,
        options: {}
      }
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_contents_content_hash ON contents (content_hash)",
      "CREATE INDEX idx_contents_owner_user_id ON contents (owner_user_id)",
      "CREATE INDEX idx_contents_type ON contents (type)"
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
  const collection = dao.findCollectionByNameOrId("contents")
  return dao.deleteCollection(collection)
})
