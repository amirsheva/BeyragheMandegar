import kavenegarProvider
  from "./providers/kavenegar-provider.js";


/*
 * Fires a Kavenegar Verify Lookup message on the
 * "reserved" template right after a reservation is
 * confirmed. Entirely separate from the SMS.ir
 * template/queue system in reservation-status-notifier.js —
 * scoped to Kavenegar only, per request.
 */
async function notifyReservationConfirmedViaKavenegar({
  phone,
  productionTitle,
  count,
}) {
  const apiKey =
    String(
      process.env
        .KAVENEGAR_API_KEY ||
      ""
    ).trim();

  if (!apiKey) {
    return {
      skipped: true,
      reason:
        "kavenegar_not_configured",
    };
  }

  const cleanPhone =
    String(
      phone ||
      ""
    ).trim();

  if (!cleanPhone) {
    return {
      skipped: true,
      reason:
        "phone_missing",
    };
  }

  const template =
    String(
      process.env
        .KAVENEGAR_RESERVATION_TEMPLATE ||
      "reserved"
    ).trim() ||
    "reserved";

  const result =
    await kavenegarProvider
      .verifyLookup({
        receptor:
          cleanPhone,

        template,

        token:
          String(
            count ??
            ""
          ),

        token10:
          String(
            productionTitle ||
            ""
          ),
      });

  return {
    skipped: false,
    messageId:
      result.messageId,
  };
}


export {
  notifyReservationConfirmedViaKavenegar,
};
