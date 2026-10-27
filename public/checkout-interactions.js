(() => {
  const formatMoney = (cents) => new Intl.NumberFormat(document.documentElement.lang || "es", { style: "currency", currency: "USD" }).format(cents / 100);

  const update = (root) => {
    const items = Array.from(root.querySelectorAll("[data-checkout-item]"));
    const lines = [];
    let weekly = 0;
    let monthly = 0;
    let once = 0;

    for (const item of items) {
      const cadence = item.dataset.cadence || "once";
      const count = Number(item.dataset.count || 0);
      const unit = cadence === "week" ? Number(item.dataset.weekPrice) : cadence === "month" ? Number(item.dataset.monthPrice) : Number(item.dataset.oncePrice);
      const price = item.querySelector("[data-price]");
      const cadenceLabel = item.querySelector("[data-price-cadence]");
      const countOutput = item.querySelector("[data-count-output]");
      const monthButton = item.querySelector('[data-cadence="month"]');
      const weekButton = item.querySelector('[data-cadence="week"]');
      const decrement = item.querySelector('[data-quantity-action="decrement"]');
      const increment = item.querySelector('[data-quantity-action="increment"]');

      if (price) price.textContent = formatMoney(unit);
      if (cadenceLabel) cadenceLabel.textContent = cadence === "week" ? item.dataset.weekLabel : cadence === "month" ? item.dataset.monthLabel : item.dataset.onceLabel;
      if (countOutput) {
        countOutput.textContent = String(count);
        countOutput.setAttribute("aria-label", `${item.dataset.name}: ${count}`);
      }
      if (monthButton) {
        monthButton.setAttribute("aria-pressed", String(cadence === "month"));
        monthButton.classList.toggle("bg-[#063635]", cadence === "month");
        monthButton.classList.toggle("text-white", cadence === "month");
      }
      if (weekButton) {
        weekButton.setAttribute("aria-pressed", String(cadence === "week"));
        weekButton.classList.toggle("bg-[#063635]", cadence === "week");
        weekButton.classList.toggle("text-white", cadence === "week");
      }
      if (decrement) decrement.disabled = count === 0;
      if (increment) increment.disabled = count >= 100;
      item.classList.toggle("border-[#15601d]", count > 0);
      item.classList.toggle("bg-[#f4fff6]", count > 0);

      if (count > 0) {
        const total = unit * count;
        lines.push({ name: item.dataset.name || "", cadence, count, total });
        if (cadence === "week") weekly += total;
        else if (cadence === "month") monthly += total;
        else once += total;
      }
    }

    const lineTarget = root.querySelector("[data-summary-lines]");
    const weeklyTarget = root.querySelector("[data-summary-weekly]");
    const monthlyTarget = root.querySelector("[data-summary-monthly]");
    const onceTarget = root.querySelector("[data-summary-once]");
    const dueTarget = root.querySelector("[data-summary-due]");
    const action = root.querySelector("[data-checkout-action]");
    const labels = root.dataset;

    if (lineTarget) lineTarget.innerHTML = lines.map((line) => `<div class="flex justify-between gap-3 text-sm"><div class="min-w-0"><p class="font-semibold text-[#063635]">${line.name} <span class="whitespace-nowrap text-[#48594f]">× ${line.count}</span></p><p class="mt-1 text-xs text-[#48594f]">${line.cadence === "week" ? labels.weekly : line.cadence === "month" ? labels.monthly : labels.once}</p></div><span class="shrink-0 font-semibold">${formatMoney(line.total)}</span></div>`).join("");
    if (weeklyTarget) weeklyTarget.textContent = weekly ? formatMoney(weekly) : "—";
    if (monthlyTarget) monthlyTarget.textContent = monthly ? formatMoney(monthly) : "—";
    if (onceTarget) onceTarget.textContent = once ? formatMoney(once) : "—";
    if (dueTarget) dueTarget.textContent = formatMoney(weekly + monthly + once);
    if (action) action.disabled = weekly + monthly === 0;
  };

  const setup = () => {
    document.querySelectorAll("[data-checkout-root]").forEach(update);
    document.addEventListener("click", (event) => {
      const target = event.target.closest("button[data-cadence], button[data-quantity-action]");
      if (!target || target.disabled) return;
      const item = target.closest("[data-checkout-item]");
      const root = target.closest("[data-checkout-root]");
      if (!item || !root) return;
      event.preventDefault();
      event.stopPropagation();
      if (target.dataset.cadence) item.dataset.cadence = target.dataset.cadence;
      if (target.dataset.quantityAction === "increment") item.dataset.count = String(Math.min(100, Number(item.dataset.count || 0) + 1));
      if (target.dataset.quantityAction === "decrement") item.dataset.count = String(Math.max(0, Number(item.dataset.count || 0) - 1));
      update(root);
    }, true);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup, { once: true });
  else setup();
})();
