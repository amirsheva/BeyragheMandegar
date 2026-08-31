import {
  randomUUID,
} from "crypto";


function maskPhone(
  phone
) {
  const value =
    String(
      phone || ""
    );

  if (
    value.length < 8
  ) {
    return "***";
  }

  return (
    value.slice(0, 4) +
    "***" +
    value.slice(-4)
  );
}


const noopProvider = {
  key:
    "noop",


  async send({
    phone,
    message,
  }) {
    const providerMessageId =
      `noop-${randomUUID()}`;


    console.log(
      "[SMS:NOOP]",
      {
        phone:
          maskPhone(phone),

        length:
          String(
            message || ""
          ).length,

        providerMessageId,
      }
    );


    return {
      ok: true,

      providerMessageId,

      status:
        "sent",

      actualCost: 0,
    };
  },


  async getBalance() {
    return {
      supported: false,
      balance: null,
    };
  },


  async getDeliveryStatus() {
    return {
      supported: false,
      status: "sent",
    };
  },
};


export default noopProvider;
