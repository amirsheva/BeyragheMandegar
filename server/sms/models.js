import {
  DataTypes,
} from "sequelize";

import {
  sequelize,
  Reservation,
  Performance,
} from "../models.js";


const SmsTemplate =
  sequelize.define(
    "SmsTemplate",
    {
      id: {
        type:
          DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      key: {
        type:
          DataTypes.STRING,
        allowNull: false,
        unique: true,
      },

      title: {
        type:
          DataTypes.STRING,
        allowNull: false,
      },

      body: {
        type:
          DataTypes.TEXT,
        allowNull: false,
      },

      category: {
        type:
          DataTypes.STRING,
        allowNull: false,
        defaultValue:
          "transactional",
      },

      status: {
        type:
          DataTypes.STRING,
        allowNull: false,
        defaultValue:
          "active",
      },

      is_system: {
        type:
          DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      provider_template_id: {
        type:
          DataTypes.INTEGER,
        allowNull: true,
      },

      provider_method: {
        type:
          DataTypes.STRING,
        allowNull: true,
      },

      provider_parameters_json: {
        type:
          DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName:
        "sms_templates",

      underscored: true,
    }
  );


const SmsCampaign =
  sequelize.define(
    "SmsCampaign",
    {
      id: {
        type:
          DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      name: {
        type:
          DataTypes.STRING,
        allowNull: false,
      },

      template_id: {
        type:
          DataTypes.INTEGER,
        allowNull: true,
      },

      status: {
        type:
          DataTypes.STRING,
        allowNull: false,
        defaultValue:
          "draft",
      },

      audience_json: {
        type:
          DataTypes.TEXT,
        allowNull: true,
      },

      total_recipients: {
        type:
          DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      queued_count: {
        type:
          DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      sent_count: {
        type:
          DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      delivered_count: {
        type:
          DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      failed_count: {
        type:
          DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      estimated_cost: {
        type:
          DataTypes.DECIMAL(
            14,
            2
          ),
        allowNull: false,
        defaultValue: 0,
      },

      actual_cost: {
        type:
          DataTypes.DECIMAL(
            14,
            2
          ),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName:
        "sms_campaigns",

      underscored: true,
    }
  );


const SmsMessage =
  sequelize.define(
    "SmsMessage",
    {
      id: {
        type:
          DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      reservation_id: {
        type:
          DataTypes.INTEGER,
        allowNull: true,
      },

      performance_id: {
        type:
          DataTypes.INTEGER,
        allowNull: true,
      },

      campaign_id: {
        type:
          DataTypes.INTEGER,
        allowNull: true,
      },

      template_id: {
        type:
          DataTypes.INTEGER,
        allowNull: true,
      },

      phone: {
        type:
          DataTypes.STRING,
        allowNull: false,
      },

      message: {
        type:
          DataTypes.TEXT,
        allowNull: false,
      },

      provider: {
        type:
          DataTypes.STRING,
        allowNull: false,
        defaultValue:
          "noop",
      },

      provider_message_id: {
        type:
          DataTypes.STRING,
        allowNull: true,
      },

      send_method: {
        type:
          DataTypes.STRING,
        allowNull: false,
        defaultValue:
          "text",
      },

      provider_pack_id: {
        type:
          DataTypes.STRING,
        allowNull: true,
      },

      line_number: {
        type:
          DataTypes.STRING,
        allowNull: true,
      },

      delivery_state: {
        type:
          DataTypes.INTEGER,
        allowNull: true,
      },

      delivery_checked_at: {
        type:
          DataTypes.DATE,
        allowNull: true,
      },

      scheduled_at: {
        type:
          DataTypes.DATE,
        allowNull: true,
      },

      status: {
        type:
          DataTypes.STRING,
        allowNull: false,
        defaultValue:
          "queued",
      },

      encoding: {
        type:
          DataTypes.STRING,
        allowNull: false,
        defaultValue:
          "unicode",
      },

      segment_count: {
        type:
          DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },

      estimated_cost: {
        type:
          DataTypes.DECIMAL(
            14,
            2
          ),
        allowNull: false,
        defaultValue: 0,
      },

      actual_cost: {
        type:
          DataTypes.DECIMAL(
            14,
            2
          ),
        allowNull: false,
        defaultValue: 0,
      },

      attempt_count: {
        type:
          DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      last_error: {
        type:
          DataTypes.TEXT,
        allowNull: true,
      },

      idempotency_key: {
        type:
          DataTypes.STRING,
        allowNull: false,
        unique: true,
      },

      metadata_json: {
        type:
          DataTypes.TEXT,
        allowNull: true,
      },

      queued_at: {
        type:
          DataTypes.DATE,
        allowNull: true,
      },

      sent_at: {
        type:
          DataTypes.DATE,
        allowNull: true,
      },

      delivered_at: {
        type:
          DataTypes.DATE,
        allowNull: true,
      },

      failed_at: {
        type:
          DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName:
        "sms_messages",

      underscored: true,

      indexes: [
        {
          fields: [
            "status",
          ],
        },
        {
          fields: [
            "reservation_id",
          ],
        },
        {
          fields: [
            "performance_id",
          ],
        },
        {
          fields: [
            "campaign_id",
          ],
        },
      ],
    }
  );


SmsTemplate.hasMany(
  SmsMessage,
  {
    foreignKey:
      "template_id",
    as: "messages",
  }
);

SmsMessage.belongsTo(
  SmsTemplate,
  {
    foreignKey:
      "template_id",
    as: "template",
  }
);


SmsTemplate.hasMany(
  SmsCampaign,
  {
    foreignKey:
      "template_id",
    as: "campaigns",
  }
);

SmsCampaign.belongsTo(
  SmsTemplate,
  {
    foreignKey:
      "template_id",
    as: "template",
  }
);


SmsCampaign.hasMany(
  SmsMessage,
  {
    foreignKey:
      "campaign_id",
    as: "messages",
  }
);

SmsMessage.belongsTo(
  SmsCampaign,
  {
    foreignKey:
      "campaign_id",
    as: "campaign",
  }
);


Performance.hasMany(
  SmsMessage,
  {
    foreignKey:
      "performance_id",
    as: "sms_messages",
  }
);

SmsMessage.belongsTo(
  Performance,
  {
    foreignKey:
      "performance_id",
    as: "performance",
  }
);


Reservation.hasMany(
  SmsMessage,
  {
    foreignKey:
      "reservation_id",
    as: "sms_messages",
  }
);

SmsMessage.belongsTo(
  Reservation,
  {
    foreignKey:
      "reservation_id",
    as: "reservation",
  }
);


export {
  SmsTemplate,
  SmsCampaign,
  SmsMessage,
};
