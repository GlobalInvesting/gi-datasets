
(function () {
  const DATA_URL = GI_DATA_BASE + "capital-flows-data/capital_flows.json";

  function signalColor(signal) {
    if (signal === "Accumulating") return "var(--up)";
    if (signal === "Reducing") return "var(--down)";
    return "var(--text3)";
  }

  function signalBadge(signal) {
    if (!signal) return '<span style="color:var(--text3);">—</span>';
    const color = signalColor(signal);
    return `<span style="display:inline-block;padding:2px 7px;border-radius:3px;background:${color}22;color:${color};font-size:10px;">${signal}</span>`;
  }

  function fmtSigned(v, decimals) {
    if (v === null || v === undefined) return "—";
    const s = v.toFixed(decimals);
    return v > 0 ? "+" + s : s;
  }

  function showUnavailable(prefix) {
    const gateEl = document.getElementById(`capflows-${prefix}-gate`);
    const wrap = document.getElementById(`capflows-${prefix}-wrap`);
    const unavailEl = document.getElementById(`capflows-${prefix}-unavailable`);
    if (gateEl) gateEl.style.display = "none";
    if (wrap) wrap.style.display = "none";
    if (unavailEl) unavailEl.style.display = "block";
  }

  function renderGate(prefix, gate) {
    const wrap = document.getElementById(`capflows-${prefix}-wrap`);
    const gateEl = document.getElementById(`capflows-${prefix}-gate`);
    const unavailEl = document.getElementById(`capflows-${prefix}-unavailable`);
    const progressText = document.getElementById(`capflows-${prefix}-progress-text`);
    const progressBar = document.getElementById(`capflows-${prefix}-progress-bar`);
    if (!gate) return;
    if (unavailEl) unavailEl.style.display = "none";
    const unit = "mo";
    if (progressText) progressText.textContent = `${gate.have}/${gate.need}${unit}`;
    if (progressBar) progressBar.style.width = `${Math.min(100, (gate.have / gate.need) * 100)}%`;
    if (gate.ready) {
      if (gateEl) gateEl.style.display = "none";
      if (wrap) wrap.style.display = "block";
    } else {
      if (gateEl) gateEl.style.display = "block";
      if (wrap) wrap.style.display = "none";
    }
  }

  function renderTic(tic) {
    if (!tic) { showUnavailable("tic"); return; }
    renderGate("tic", tic.gate);
    const tbody = document.getElementById("capflows-tic-tbody");
    const asof = document.getElementById("capflows-tic-asof");
    if (!tbody) return;
    tbody.innerHTML = tic.top10
      .map((row) => {
        const flag = row.iso2
          ? `<span class="fi fi-${row.iso2}" style="margin-right:5px;border-radius:2px;"></span>`
          : "";
        return `<tr>
          <td style="padding:4px 8px 4px 16px;white-space:nowrap;">${flag}${row.country}</td>
          <td style="text-align:right;padding:4px 8px;">${row.holdings_bn.toFixed(1)}</td>
          <td style="text-align:right;padding:4px 8px;color:${row.mom_change_bn > 0 ? "var(--up)" : row.mom_change_bn < 0 ? "var(--down)" : "var(--text3)"};">${fmtSigned(row.mom_change_bn, 1)}</td>
          <td style="text-align:right;padding:4px 16px 4px 8px;">${signalBadge(row.signal)}</td>
        </tr>`;
      })
      .join("");
    if (asof) asof.textContent = `As of ${tic.as_of} · US Treasury TIC`;
  }

  function fundFlowRows(rows) {
    return rows
      .map((row) => {
        const momColor = row.mom_change_bn > 0 ? "var(--up)" : row.mom_change_bn < 0 ? "var(--down)" : "var(--text3)";
        return `<tr>
          <td style="padding:4px 8px 4px 16px;white-space:nowrap;">${row.category}</td>
          <td style="text-align:right;padding:4px 8px;color:${row.net_flow_bn > 0 ? "var(--up)" : row.net_flow_bn < 0 ? "var(--down)" : "var(--text3)"};">${fmtSigned(row.net_flow_bn, 1)}</td>
          <td style="text-align:right;padding:4px 8px;color:${momColor};">${fmtSigned(row.mom_change_bn, 1)}</td>
          <td style="text-align:right;padding:4px 16px 4px 8px;">${signalBadge(row.signal)}</td>
        </tr>`;
      })
      .join("");
  }

  function fundFlowGateRow(gate, label) {
    const have = gate ? gate.have : 0;
    const need = gate ? gate.need : 12;
    const pct = Math.min(100, (have / need) * 100);
    return `<tr><td colspan="4" style="padding:6px 16px 12px;font-size:11px;color:var(--text2);font-family:var(--font-ui);">
      Accumulating ${label} history — ${have}/${need}mo
      <div style="height:4px;background:var(--bg2);border-radius:2px;margin-top:6px;overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:var(--accent);border-radius:2px;"></div>
      </div>
    </td></tr>`;
  }

  function fundFlowUnavailableRow(label) {
    return `<tr><td colspan="4" style="padding:6px 16px 12px;font-size:11px;color:var(--text3);font-family:var(--font-ui);">${label} currently unavailable.</td></tr>`;
  }

  function renderFundFlows(rf, mmf) {
    const tbody = document.getElementById("capflows-flows-tbody");
    const wrap = document.getElementById("capflows-flows-wrap");
    const unavailEl = document.getElementById("capflows-flows-unavailable");
    const asof = document.getElementById("capflows-flows-asof");
    if (!tbody) return;

    if (!rf && !mmf) {
      if (wrap) wrap.style.display = "none";
      if (unavailEl) unavailEl.style.display = "block";
      return;
    }
    if (unavailEl) unavailEl.style.display = "none";
    if (wrap) wrap.style.display = "block";

    const asofParts = [];
    let html = "";

    if (rf) {
      html += rf.gate && rf.gate.ready ? fundFlowRows(rf.rows) : fundFlowGateRow(rf.gate, "registered fund flows");
      asofParts.push(`Registered Funds as of ${rf.as_of}`);
    } else {
      html += fundFlowUnavailableRow("Registered fund flows");
    }

    if (mmf) {
      if (mmf.gate && mmf.gate.ready) {
        const total = mmf.rows.find((row) => row.category === "Money Market — Total");
        html += total ? fundFlowRows([{ ...total, category: "Money Market" }]) : fundFlowUnavailableRow("Money market flows");
      } else {
        html += fundFlowGateRow(mmf.gate, "money market");
      }
      asofParts.push(`MMF as of ${mmf.as_of}`);
    } else {
      html += fundFlowUnavailableRow("Money market flows");
    }

    tbody.innerHTML = html;
    if (asof) asof.textContent = asofParts.join(" · ");
  }

  async function loadCapitalFlows() {
    try {
      const resp = await fetch(DATA_URL, { cache: "no-store" });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const doc = await resp.json();
      renderTic(doc.tic);
      renderFundFlows(doc.registered_funds, doc.mmf);
    } catch (err) {
      const ticBody = document.getElementById("capflows-tic-tbody");
      if (ticBody) {
        ticBody.innerHTML = `<tr><td colspan="4" style="padding:14px 16px;color:var(--text3);">Capital flows data unavailable.</td></tr>`;
      }
      console.error("[capital-flows] load failed:", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadCapitalFlows);
  } else {
    loadCapitalFlows();
  }
})();
