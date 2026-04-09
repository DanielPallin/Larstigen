import "../css/global.css";
import "../css/components.css";
import "../css/dashboard.css";

import { initGlobalUI } from "./global";

async function initPage(): Promise<void> {
  await initGlobalUI();

  // din extra dashboard-logik här
}

initPage();