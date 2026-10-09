import { css } from "lit";

/**
 * Gemeinsame Gestaltung. Farben, Schrift und Abstände kommen aus den Design-Variablen von
 * Home Assistant, damit helle und dunkle Themen funktionieren (Pflichtenheft 10.1).
 */
export const baseStyles = css`
  :host {
    --ot-radius: var(--ha-card-border-radius, 12px);
    --ot-gap: 12px;
    --ot-touch: 48px;
    font-family: var(--ha-font-family-body, var(--paper-font-body1_-_font-family, Roboto, system-ui, sans-serif));
    color: var(--primary-text-color);
    box-sizing: border-box;
  }
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  h1,
  h2,
  h3 {
    margin: 0;
    font-weight: 500;
  }
  h2 {
    font-size: 1.1rem;
  }
  h3 {
    font-size: 1rem;
    color: var(--secondary-text-color);
  }
  a {
    color: var(--primary-color);
  }
  .muted {
    color: var(--secondary-text-color);
  }
  .small {
    font-size: 0.85rem;
  }
  .grow {
    flex: 1;
    min-width: 0;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .wrap {
    flex-wrap: wrap;
  }
  .stack {
    display: flex;
    flex-direction: column;
    gap: var(--ot-gap);
  }
  .ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Knöpfe */
  button {
    font: inherit;
    color: inherit;
    cursor: pointer;
  }
  button:focus-visible,
  a:focus-visible,
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible,
  [tabindex]:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 40px;
    padding: 0 16px;
    border-radius: 20px;
    border: 1px solid var(--divider-color);
    background: transparent;
    font-weight: 500;
  }
  .btn.primary {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: var(--text-primary-color, #fff);
  }
  .btn.danger {
    color: var(--error-color);
    border-color: var(--error-color);
  }
  .btn.text {
    border-color: transparent;
  }
  .btn[disabled] {
    opacity: 0.5;
    cursor: default;
  }
  .icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--ot-touch);
    height: var(--ot-touch);
    border: none;
    border-radius: 50%;
    background: transparent;
    flex: none;
  }
  .icon-btn:hover,
  .btn:hover {
    background-color: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
  }
  .btn.primary:hover {
    background: var(--primary-color);
    filter: brightness(1.1);
  }

  /* Eingabefelder */
  label.field {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.85rem;
    color: var(--secondary-text-color);
  }
  input,
  select,
  textarea {
    font: inherit;
    color: var(--primary-text-color);
    background: var(--card-background-color, transparent);
    border: 1px solid var(--divider-color);
    border-radius: 8px;
    padding: 10px 12px;
    min-height: 44px;
    width: 100%;
  }
  textarea {
    resize: vertical;
  }
  input[type="checkbox"] {
    width: 22px;
    height: 22px;
    min-height: 0;
    padding: 0;
  }
  label.check {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 40px;
    color: var(--primary-text-color);
    font-size: 1rem;
  }

  /* Karten, Listen */
  .card {
    background: var(--card-background-color, #fff);
    border-radius: var(--ot-radius);
    border: 1px solid var(--divider-color);
    padding: 16px;
  }
  .list {
    display: flex;
    flex-direction: column;
    background: var(--card-background-color, #fff);
    border-radius: var(--ot-radius);
    border: 1px solid var(--divider-color);
    overflow: hidden;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 8px 12px;
    border: none;
    border-bottom: 1px solid var(--divider-color);
    background: transparent;
    text-align: left;
    width: 100%;
    content-visibility: auto;
    contain-intrinsic-size: auto 60px;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }
  .item:last-child {
    border-bottom: none;
  }
  .item:hover {
    background-color: color-mix(in srgb, var(--primary-text-color) 5%, transparent);
  }
  .item.selected {
    background-color: color-mix(in srgb, var(--primary-color) 18%, transparent);
  }
  .item .icon {
    color: var(--secondary-text-color);
    flex: none;
  }
  .item .title {
    font-size: 1rem;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2.2em;
    padding: 2px 8px;
    border-radius: 12px;
    background: var(--primary-color);
    color: var(--text-primary-color, #fff);
    font-weight: 600;
    font-size: 0.85rem;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 10px;
    min-height: 26px;
    border-radius: 13px;
    font-size: 0.8rem;
    border: 1px solid var(--divider-color);
    background: transparent;
    color: var(--secondary-text-color);
  }
  .chip.warning {
    border-color: var(--warning-color, #ff9800);
    color: var(--warning-color, #ff9800);
  }
  .chip.error {
    border-color: var(--error-color, #db4437);
    color: var(--error-color, #db4437);
  }
  button.chip {
    cursor: pointer;
    min-height: 36px;
    padding: 0 14px;
    font-size: 0.9rem;
  }
  button.chip[aria-pressed="true"] {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: var(--text-primary-color, #fff);
  }
  .empty {
    text-align: center;
    padding: 32px 16px;
    color: var(--secondary-text-color);
  }
  .empty ha-icon {
    --mdc-icon-size: 48px;
    opacity: 0.6;
  }
  .section-title {
    margin: 20px 4px 8px;
    font-size: 0.85rem;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--secondary-text-color);
  }
  .error-text {
    color: var(--error-color);
  }
`;
