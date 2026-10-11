// Einstiegspunkt des Bündels: meldet Panel und Karte bei Home Assistant an.
import "./components/ot-dialog";
import "./components/ot-confirm";
import "./components/ot-path";
import "./components/ot-node-list";
import "./components/ot-node-form";
import "./components/ot-quickadd";
import "./components/ot-move";
import "./components/ot-node-page";
import "./components/ot-overview";
import "./components/ot-search-page";
import "./components/ot-trash-page";
import "./components/ot-due-page";
import "./components/ot-out-page";
import "./components/ot-lists-page";
import "./components/ot-stocktake-page";
import "./components/ot-settings-page";
import "./components/ot-tree";
import "./components/ot-panel";
import "./components/ot-card";

declare global {
  interface Window {
    customCards?: Array<{ type: string; name: string; description: string; preview?: boolean }>;
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ordnungstracker-card",
  name: "Ordnungs-Tracker",
  description: "Suche, Kacheln oder der Inhalt einer Kiste aus dem Ordnungs-Tracker.",
  preview: false,
});
