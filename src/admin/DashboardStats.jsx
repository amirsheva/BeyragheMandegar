import {
  Activity,
  CalendarDays,
  CheckCircle2,
  FileText,
  Ticket,
  Users,
} from "lucide-react";

import {
  AdminMetricCard,
} from "./ui/AdminPrimitives";

import {
  faNumber,
} from "./ui/formatFa";


function numberValue(
  value
) {
  const numeric =
    Number(value);

  return Number.isFinite(
    numeric
  )
    ? numeric
    : 0;
}


export default function DashboardStats({
  stats,
}) {
  const normalized = {
    shows:
      numberValue(
        stats?.shows ??
        stats?.productions
      ),

    performances:
      numberValue(
        stats?.performances
      ),

    reservations:
      numberValue(
        stats?.reservations
      ),

    tickets:
      numberValue(
        stats?.tickets
      ),

    totalCapacity:
      numberValue(
        stats?.totalCapacity
      ),

    remainingCapacity:
      numberValue(
        stats?.remainingCapacity
      ),
  };


  const cards = [
    {
      title:
        "نمایش‌ها",

      value:
        normalized.shows,

      description:
        "آثار نمایشی ثبت‌شده",

      icon:
        FileText,
    },

    {
      title:
        "اجراها",

      value:
        normalized.performances,

      description:
        "تمام اجراهای ثبت‌شده",

      icon:
        CalendarDays,
    },

    {
      title:
        "رزروها",

      value:
        normalized.reservations,

      description:
        "رزروهای ثبت‌شده سامانه",

      icon:
        Users,
    },

    {
      title:
        "بلیت‌های رزرو شده",

      value:
        normalized.tickets,

      description:
        "مجموع بلیت‌های ثبت‌شده",

      icon:
        Ticket,

      tone:
        "success",
    },

    {
      title:
        "ظرفیت کل",

      value:
        normalized.totalCapacity,

      description:
        "ظرفیت تعریف‌شده اجراها",

      icon:
        Activity,
    },

    {
      title:
        "ظرفیت باقی‌مانده",

      value:
        normalized.remainingCapacity,

      description:
        "ظرفیت باقی‌مانده برای رزرو",

      icon:
        CheckCircle2,

      tone:
        "success",
    },
  ];


  return (
    <section className="dashboard-metrics">
      {cards.map(
        (card) => (
          <AdminMetricCard
            key={
              card.title
            }
            title={
              card.title
            }
            value={
              faNumber(
                card.value
              )
            }
            description={
              card.description
            }
            icon={
              card.icon
            }
            tone={
              card.tone ||
              "default"
            }
          />
        )
      )}
    </section>
  );
}
