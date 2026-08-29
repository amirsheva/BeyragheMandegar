import {
  RefreshCw,
  RotateCcw,
} from "lucide-react";

import {
  AdminEmptyState,
  AdminStatusBadge,
} from "./ui/AdminPrimitives";

import {
  faNumber,
  toFaDigits,
} from "./ui/formatFa";


function statusLabel(
  status
) {
  const map = {
    queued: "در صف",
    sent: "ارسال‌شده",
    delivered: "تحویل‌شده",
    failed: "ناموفق",
  };

  return (
    map[status] ||
    status ||
    "نامشخص"
  );
}


function statusTone(
  status
) {
  if (
    status === "sent" ||
    status === "delivered"
  ) {
    return "success";
  }

  if (
    status === "failed"
  ) {
    return "danger";
  }

  if (
    status === "queued"
  ) {
    return "accent";
  }

  return "neutral";
}


function deliveryLabel(
  state
) {
  if (
    state === null ||
    state === undefined
  ) {
    return "—";
  }

  const map = {
    1: "رسیده",
    2: "نرسیده به گوشی",
    3: "رسیده به مخابرات",
    4: "نرسیده به مخابرات",
    5: "رسیده به اپراتور",
    6: "ناموفق",
    7: "لیست سیاه",
    8: "نامشخص",
  };

  return (
    map[
      Number(state)
    ] ||
    `کد ${faNumber(
      state
    )}`
  );
}


function formatDate(
  value
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return toFaDigits(
    date.toLocaleString(
      "fa-IR",
      {
        dateStyle:
          "short",
        timeStyle:
          "short",
      }
    )
  );
}


export default function SmsMessagesTable({
  items,
  onRetry,
  onRefreshDelivery,
  refreshingId,
}) {
  if (
    !items.length
  ) {
    return (
      <AdminEmptyState
        icon={RefreshCw}
        title="هنوز پیامی ثبت نشده است"
        description="سوابق ارسال و وضعیت تحویل پیام‌ها پس از اولین ارسال در این بخش نمایش داده می‌شود."
      />
    );
  }


  return (
    <section className="sms-panel sms-table-panel">
      <div className="sms-table-scroll">
        <table className="sms-table">
          <thead>
            <tr>
              <th>
                ردیف
              </th>

              <th>
                شماره
              </th>

              <th>
                پیام
              </th>

              <th>
                Provider
              </th>

              <th>
                روش
              </th>

              <th>
                شناسه پیام
              </th>

              <th>
                وضعیت
              </th>

              <th>
                تحویل
              </th>

              <th>
                هزینه
              </th>

              <th>
                تلاش
              </th>

              <th>
                آخرین بررسی
              </th>

              <th>
                عملیات
              </th>
            </tr>
          </thead>

          <tbody>
            {items.map(
              (
                item,
                index
              ) => (
                <tr
                  key={
                    item.id
                  }
                >
                  <td>
                    {faNumber(
                      index + 1
                    )}
                  </td>

                  <td
                    className="sms-nowrap"
                    dir="ltr"
                  >
                    {toFaDigits(
                      item.phone
                    )}
                  </td>

                  <td className="sms-message-cell">
                    {toFaDigits(
                      item.message
                    )}

                    {item.lastError && (
                      <div className="sms-row-error">
                        {toFaDigits(
                          item.lastError
                        )}
                      </div>
                    )}
                  </td>

                  <td>
                    <span className="sms-provider-badge">
                      {toFaDigits(
                        item.provider ||
                        "—"
                      )}
                    </span>
                  </td>

                  <td>
                    {toFaDigits(
                      item.sendMethod ||
                      "—"
                    )}
                  </td>

                  <td
                    className="sms-nowrap"
                    dir="ltr"
                  >
                    {toFaDigits(
                      item.providerMessageId ||
                      "—"
                    )}
                  </td>

                  <td>
                    <AdminStatusBadge
                      tone={
                        statusTone(
                          item.status
                        )
                      }
                    >
                      {statusLabel(
                        item.status
                      )}
                    </AdminStatusBadge>
                  </td>

                  <td className="sms-nowrap">
                    {deliveryLabel(
                      item.deliveryState
                    )}
                  </td>

                  <td className="sms-nowrap">
                    {faNumber(
                      item.actualCost ||
                      0
                    )}
                  </td>

                  <td>
                    {faNumber(
                      item.attemptCount ||
                      0
                    )}
                  </td>

                  <td className="sms-date-cell">
                    {formatDate(
                      item.deliveryCheckedAt
                    )}
                  </td>

                  <td>
                    <div className="sms-row-actions">
                      {item.provider ===
                        "smsir" &&
                        item.providerMessageId && (
                          <button
                            type="button"
                            disabled={
                              refreshingId ===
                              item.id
                            }
                            onClick={() =>
                              onRefreshDelivery(
                                item.id
                              )
                            }
                            className="sms-row-action"
                          >
                            <RefreshCw
                              size={16}
                              className={
                                refreshingId ===
                                item.id
                                  ? "animate-spin"
                                  : ""
                              }
                            />

                            بروزرسانی
                          </button>
                        )}


                      {[
                        "failed",
                        "queued",
                      ].includes(
                        item.status
                      ) && (
                        <button
                          type="button"
                          onClick={() =>
                            onRetry(
                              item.id
                            )
                          }
                          className="sms-row-action is-danger"
                        >
                          <RotateCcw
                            size={16}
                          />

                          ارسال مجدد
                        </button>
                      )}


                      {!(
                        item.provider ===
                          "smsir" &&
                        item.providerMessageId
                      ) &&
                        ![
                          "failed",
                          "queued",
                        ].includes(
                          item.status
                        ) && (
                          <span className="sms-no-action">
                            —
                          </span>
                        )}
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
