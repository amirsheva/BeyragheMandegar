import "dotenv/config";

import {
  Sequelize,
  DataTypes,
} from "sequelize";

import {
  decryptPii,
  encryptPii,
} from "./security/pii-crypto.js";


const sequelize =
  new Sequelize({
    dialect: "sqlite",
    storage:
      process.env.DB_STORAGE ||
      "./reservations.db",
    logging: false,
    retry: {
      max: 5,
    },
    dialectOptions: {
      timeout: 10000,
    },
  });


const Production =
  sequelize.define(
    "Production",
    {
      id: {
        type:
          DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      title: {
        type:
          DataTypes.STRING,
        allowNull: false,
      },

      slug: {
        type:
          DataTypes.STRING,
        allowNull: false,
        unique: true,
      },

      subtitle: {
        type:
          DataTypes.STRING,
        allowNull: true,
      },

      short_description: {
        type:
          DataTypes.TEXT,
        allowNull: true,
      },

      description: {
        type:
          DataTypes.TEXT,
        allowNull: true,
      },

      director: {
        type:
          DataTypes.STRING,
        allowNull: true,
      },

      poster: {
        type:
          DataTypes.STRING,
        allowNull: true,
      },

      status: {
        type:
          DataTypes.STRING,
        allowNull: false,
        defaultValue:
          "published",
      },

      tags: {
        type:
          DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName:
        "productions",
      timestamps: true,
      underscored: true,
    }
  );


const Venue =
  sequelize.define(
    "Venue",
    {
      id: {
        type:
          DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      name: {
        type:
          DataTypes.STRING,
        allowNull: false,
      },

      slug: {
        type:
          DataTypes.STRING,
        allowNull: false,
        unique: true,
      },

      hall_name: {
        type:
          DataTypes.STRING,
        allowNull: true,
      },

      address: {
        type:
          DataTypes.TEXT,
        allowNull: true,
      },

      entrance_note: {
        type:
          DataTypes.TEXT,
        allowNull: true,
      },

      access_note: {
        type:
          DataTypes.TEXT,
        allowNull: true,
      },

      latitude: {
        type:
          DataTypes.DECIMAL(
            10,
            7
          ),
        allowNull: true,
      },

      longitude: {
        type:
          DataTypes.DECIMAL(
            10,
            7
          ),
        allowNull: true,
      },

      google_maps_url: {
        type:
          DataTypes.TEXT,
        allowNull: true,
      },

      neshan_url: {
        type:
          DataTypes.TEXT,
        allowNull: true,
      },

      balad_url: {
        type:
          DataTypes.TEXT,
        allowNull: true,
      },

      waze_url: {
        type:
          DataTypes.TEXT,
        allowNull: true,
      },

      status: {
        type:
          DataTypes.STRING,
        allowNull: false,
        defaultValue:
          "active",
      },
    },
    {
      tableName:
        "venues",
      timestamps: true,
      underscored: true,
    }
  );


const Performance =
  sequelize.define(
    "Performance",
    {
      id: {
        type:
          DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      production_id: {
        type:
          DataTypes.INTEGER,
        allowNull: false,
      },

      venue_id: {
        type:
          DataTypes.INTEGER,
        allowNull: true,
      },

      date: {
        type:
          DataTypes.STRING,
        allowNull: false,
      },

      time: {
        type:
          DataTypes.STRING,
        allowNull: false,
      },

      attendance_time: {
        type:
          DataTypes.STRING,
        allowNull: true,
      },

      end_time: {
        type:
          DataTypes.STRING,
        allowNull: true,
      },

      ticket_note: {
        type:
          DataTypes.TEXT,
        allowNull: true,
      },

      capacity: {
        type:
          DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 300,
      },

      remaining_capacity: {
        type:
          DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 300,
      },

      status: {
        type:
          DataTypes.STRING,
        allowNull: false,
        defaultValue:
          "active",
      },

      booking_enabled: {
        type:
          DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      label: {
        type:
          DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName:
        "performances",
      timestamps: true,
      underscored: true,
    }
  );


const Reservation =
  sequelize.define(
    "Reservation",
    {
      id: {
        type:
          DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      performance_id: {
        type:
          DataTypes.INTEGER,
        allowNull: false,
      },

      name: {
        type:
          DataTypes.STRING,
        allowNull: false,
      },

      phone: {
        type:
          DataTypes.STRING,
        allowNull: false,

        get() {
          return decryptPii(
            this.getDataValue(
              "phone"
            )
          );
        },

        set(value) {
          this.setDataValue(
            "phone",
            encryptPii(
              value
            )
          );
        },
      },

      national_id: {
        type:
          DataTypes.STRING,
        allowNull: false,

        get() {
          return decryptPii(
            this.getDataValue(
              "national_id"
            )
          );
        },

        set(value) {
          this.setDataValue(
            "national_id",
            encryptPii(
              value
            )
          );
        },
      },

      count: {
        type:
          DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },

      tracking_code: {
        type:
          DataTypes.STRING,
        allowNull: false,
        unique: true,
      },

      status: {
        type:
          DataTypes.STRING,
        allowNull: false,
        defaultValue:
          "confirmed",
      },
    },
    {
      tableName:
        "reservations",
      timestamps: true,
      underscored: true,
    }
  );


Production.hasMany(
  Performance,
  {
    foreignKey:
      "production_id",
    as:
      "performances",
  }
);

Performance.belongsTo(
  Production,
  {
    foreignKey:
      "production_id",
    as:
      "production",
  }
);


Venue.hasMany(
  Performance,
  {
    foreignKey:
      "venue_id",
    as:
      "performances",
  }
);

Performance.belongsTo(
  Venue,
  {
    foreignKey:
      "venue_id",
    as:
      "venue",
  }
);


Performance.hasMany(
  Reservation,
  {
    foreignKey:
      "performance_id",
    as:
      "reservations",
  }
);

Reservation.belongsTo(
  Performance,
  {
    foreignKey:
      "performance_id",
    as:
      "performance",
  }
);



// NEWS_MODEL_V1
const News = sequelize.define(
  "News",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    excerpt: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    cover: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "draft",
    },

    published_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "news",
    timestamps: true,
    underscored: true,
  }
);


export {
  sequelize,
  Production,
  Performance,
  Reservation,
  Venue,
  News,
};
