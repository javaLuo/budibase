const CouchDB = require("../db")
const emitter = require("../events/index")
const env = require("../environment")
const Queue = env.isTest()
  ? require("../utilities/queue/inMemoryQueue")
  : require("bull")
const { getAutomationParams } = require("../db/utils")
const { coerce } = require("../utilities/rowProcessor")
const { utils } = require("@budibase/auth/redis")
const { JobQueues } = require("../constants")

const { opts } = utils.getRedisOptions()
let automationQueue = new Queue(JobQueues.AUTOMATIONS, { redis: opts })

const FAKE_STRING = "TEST"
const FAKE_BOOL = false
const FAKE_NUMBER = 1
const FAKE_DATETIME = "1970-01-01T00:00:00.000Z"

const BUILTIN_DEFINITIONS = {
  ROW_SAVED: {
    name: "Row Created",
    event: "row:save",
    icon: "ri-save-line",
    tagline: "Row is added to {{inputs.enriched.table.name}}",
    description: "Fired when a row is added to your database",
    stepId: "ROW_SAVED",
    inputs: {},
    schema: {
      inputs: {
        properties: {
          tableId: {
            type: "string",
            customType: "table",
            title: "Table",
          },
        },
        required: ["tableId"],
      },
      outputs: {
        properties: {
          row: {
            type: "object",
            customType: "row",
            description: "The new row that was created",
          },
          id: {
            type: "string",
            description: "Row ID - can be used for updating",
          },
          revision: {
            type: "string",
            description: "Revision of row",
          },
        },
        required: ["row", "id"],
      },
    },
    type: "TRIGGER",
  },
  ROW_UPDATED: {
    name: "Row Updated",
    event: "row:update",
    icon: "ri-refresh-line",
    tagline: "Row is updated in {{inputs.enriched.table.name}}",
    description: "Fired when a row is updated in your database",
    stepId: "ROW_UPDATED",
    inputs: {},
    schema: {
      inputs: {
        properties: {
          tableId: {
            type: "string",
            customType: "table",
            title: "Table",
          },
        },
        required: ["tableId"],
      },
      outputs: {
        properties: {
          row: {
            type: "object",
            customType: "row",
            description: "The row that was updated",
          },
          id: {
            type: "string",
            description: "Row ID - can be used for updating",
          },
          revision: {
            type: "string",
            description: "Revision of row",
          },
        },
        required: ["row", "id"],
      },
    },
    type: "TRIGGER",
  },
  ROW_DELETED: {
    name: "Row Deleted",
    event: "row:delete",
    icon: "ri-delete-bin-line",
    tagline: "Row is deleted from {{inputs.enriched.table.name}}",
    description: "Fired when a row is deleted from your database",
    stepId: "ROW_DELETED",
    inputs: {},
    schema: {
      inputs: {
        properties: {
          tableId: {
            type: "string",
            customType: "table",
            title: "Table",
          },
        },
        required: ["tableId"],
      },
      outputs: {
        properties: {
          row: {
            type: "object",
            customType: "row",
            description: "The row that was deleted",
          },
        },
        required: ["row"],
      },
    },
    type: "TRIGGER",
  },
  WEBHOOK: {
    name: "Webhook",
    event: "web:trigger",
    icon: "ri-global-line",
    tagline: "Webhook endpoint is hit",
    description: "Trigger an automation when a HTTP POST webhook is hit",
    stepId: "WEBHOOK",
    inputs: {},
    schema: {
      inputs: {
        properties: {
          schemaUrl: {
            type: "string",
            customType: "webhookUrl",
            title: "Schema URL",
          },
          triggerUrl: {
            type: "string",
            customType: "webhookUrl",
            title: "Trigger URL",
          },
        },
        required: ["schemaUrl", "triggerUrl"],
      },
      outputs: {
        properties: {
          body: {
            type: "object",
            description: "Body of the request which hit the webhook",
          },
        },
        required: ["body"],
      },
    },
    type: "TRIGGER",
  },
  APP: {
    name: "App Action",
    event: "app:trigger",
    icon: "ri-window-fill",
    tagline: "Automation fired from the frontend",
    description: "Trigger an automation from an action inside your app",
    stepId: "APP",
    inputs: {},
    schema: {
      inputs: {
        properties: {
          fields: {
            type: "object",
            customType: "triggerSchema",
            title: "Fields",
          },
        },
        required: [],
      },
      outputs: {
        properties: {
          fields: {
            type: "object",
            description: "Fields submitted from the app frontend",
          },
        },
        required: ["fields"],
      },
    },
    type: "TRIGGER",
  },
  CRON: {
    name: "Cron Trigger",
    event: "cron:trigger",
    icon: "ri-timer-line",
    tagline: "Cron Trigger (<b>{{inputs.cron}}</b>)",
    description: "Triggers automation on a cron schedule.",
    stepId: "CRON",
    inputs: {},
    schema: {
      inputs: {
        properties: {
          cron: {
            type: "string",
            customType: "cron",
            title: "Expression",
          },
        },
        required: ["cron"],
      },
      outputs: {},
    },
    type: "TRIGGER",
  },
}

async function queueRelevantRowAutomations(event, eventType) {
  if (event.appId == null) {
    throw `No appId specified for ${eventType} - check event emitters.`
  }
  const db = new CouchDB(event.appId)
  let automations = await db.allDocs(
    getAutomationParams(null, { include_docs: true })
  )

  // filter down to the correct event type
  automations = automations.rows
    .map(automation => automation.doc)
    .filter(automation => {
      const trigger = automation.definition.trigger
      return trigger && trigger.event === eventType
    })

  for (let automation of automations) {
    let automationDef = automation.definition
    let automationTrigger = automationDef ? automationDef.trigger : {}
    if (
      !automation.live ||
      !automationTrigger.inputs ||
      automationTrigger.inputs.tableId !== event.row.tableId
    ) {
      continue
    }
    automationQueue.add({ automation, event })
  }
}

emitter.on("row:save", async function (event) {
  /* istanbul ignore next */
  if (!event || !event.row || !event.row.tableId) {
    return
  }
  await queueRelevantRowAutomations(event, "row:save")
})

emitter.on("row:update", async function (event) {
  /* istanbul ignore next */
  if (!event || !event.row || !event.row.tableId) {
    return
  }
  await queueRelevantRowAutomations(event, "row:update")
})

emitter.on("row:delete", async function (event) {
  /* istanbul ignore next */
  if (!event || !event.row || !event.row.tableId) {
    return
  }
  await queueRelevantRowAutomations(event, "row:delete")
})

async function fillRowOutput(automation, params) {
  let triggerSchema = automation.definition.trigger
  let tableId = triggerSchema.inputs.tableId
  const db = new CouchDB(params.appId)
  try {
    let table = await db.get(tableId)
    let row = {}
    for (let schemaKey of Object.keys(table.schema)) {
      const paramValue = params[schemaKey]
      let propSchema = table.schema[schemaKey]
      switch (propSchema.constraints.type) {
        case "string":
          row[schemaKey] = paramValue || FAKE_STRING
          break
        case "boolean":
          row[schemaKey] = paramValue || FAKE_BOOL
          break
        case "number":
          row[schemaKey] = paramValue || FAKE_NUMBER
          break
        case "datetime":
          row[schemaKey] = paramValue || FAKE_DATETIME
          break
      }
    }
    params.row = row
  } catch (err) {
    /* istanbul ignore next */
    throw "Failed to find table for trigger"
  }
  return params
}

module.exports.externalTrigger = async function (automation, params) {
  // TODO: replace this with allowing user in builder to input values in future
  if (automation.definition != null && automation.definition.trigger != null) {
    if (automation.definition.trigger.inputs.tableId != null) {
      params = await fillRowOutput(automation, params)
    }
    if (automation.definition.trigger.stepId === "APP") {
      // values are likely to be submitted as strings, so we shall convert to correct type
      const coercedFields = {}
      const fields = automation.definition.trigger.inputs.fields
      for (let key of Object.keys(fields)) {
        coercedFields[key] = coerce(params.fields[key], fields[key])
      }
      params.fields = coercedFields
    }
  }

  automationQueue.add({ automation, event: params })
}

module.exports.getQueues = () => {
  return [automationQueue]
}
module.exports.fillRowOutput = fillRowOutput
module.exports.automationQueue = automationQueue

module.exports.BUILTIN_DEFINITIONS = BUILTIN_DEFINITIONS
