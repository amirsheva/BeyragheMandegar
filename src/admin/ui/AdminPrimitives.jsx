import {
  Search,
} from "lucide-react";

import {
  toFaDigits,
} from "./formatFa";


export function AdminPageHeader({
  eyebrow,
  eyebrowIcon:
    EyebrowIcon,
  title,
  description,
  actions,
}) {
  return (
    <header className="ds-page-header">

      <div className="ds-page-header__copy">

        {eyebrow && (
          <div className="ds-page-eyebrow">
            {EyebrowIcon && (
              <EyebrowIcon
                size={18}
                strokeWidth={1.8}
              />
            )}

            <span>
              {eyebrow}
            </span>
          </div>
        )}

        <h1 className="ds-page-title">
          {title}
        </h1>

        {description && (
          <p className="ds-page-description">
            {description}
          </p>
        )}

      </div>

      {actions && (
        <div className="ds-page-actions">
          {actions}
        </div>
      )}

    </header>
  );
}


export function AdminButton({
  children,
  icon:
    Icon,
  tone = "secondary",
  className = "",
  ...props
}) {
  return (
    <button
      className={[
        "ds-button",
        `ds-button--${tone}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {Icon && (
        <Icon
          size={18}
          strokeWidth={1.8}
        />
      )}

      <span>
        {children}
      </span>
    </button>
  );
}


export function AdminCard({
  children,
  className = "",
}) {
  return (
    <section
      className={[
        "ds-card",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </section>
  );
}


export function AdminMetricCard({
  title,
  value,
  icon:
    Icon,
  description,
  tone = "default",
}) {
  return (
    <article
      className={[
        "ds-metric",
        `ds-metric--${tone}`,
      ].join(" ")}
    >

      <div className="ds-metric__top">

        <span className="ds-metric__label">
          {title}
        </span>

        {Icon && (
          <span className="ds-metric__icon">
            <Icon
              size={19}
              strokeWidth={1.8}
            />
          </span>
        )}

      </div>

      <div className="ds-metric__value">
        {toFaDigits(value)}
      </div>

      {description && (
        <div className="ds-metric__description">
          {description}
        </div>
      )}

    </article>
  );
}


export function AdminStatusBadge({
  children,
  tone = "neutral",
}) {
  return (
    <span
      className={[
        "ds-status",
        `ds-status--${tone}`,
      ].join(" ")}
    >
      {children}
    </span>
  );
}


export function AdminSearchBox({
  value,
  onChange,
  placeholder =
    "جستجو...",
}) {
  return (
    <label className="ds-search">

      <Search
        size={19}
        strokeWidth={1.8}
      />

      <input
        value={value}
        onChange={onChange}
        placeholder={
          placeholder
        }
      />

    </label>
  );
}


export function AdminField({
  label,
  hint,
  children,
  className = "",
}) {
  return (
    <label
      className={[
        "ds-field",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >

      <span className="ds-field__label">
        {label}
      </span>

      {hint && (
        <span className="ds-field__hint">
          {hint}
        </span>
      )}

      {children}

    </label>
  );
}


export function AdminEmptyState({
  icon:
    Icon,
  title,
  description,
  action,
}) {
  return (
    <section className="ds-empty">

      {Icon && (
        <div className="ds-empty__icon">
          <Icon
            size={27}
            strokeWidth={1.7}
          />
        </div>
      )}

      <h3 className="ds-empty__title">
        {title}
      </h3>

      {description && (
        <p className="ds-empty__description">
          {description}
        </p>
      )}

      {action && (
        <div className="ds-empty__action">
          {action}
        </div>
      )}

    </section>
  );
}
