import "../css/global.css";
import "../css/components.css";
import "../css/kalender.css";

import { initGlobalUI } from "./global";

async function initPage(): Promise<void> {
  await initGlobalUI();

  // din extra kalender-logik här
}

initPage();