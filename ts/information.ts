import "../css/global.css";
import "../css/components.css";
import "../css/information.css";

import { initGlobalUI } from "./global";

async function initPage(): Promise<void> {
  await initGlobalUI();

  // din extra information-logik här
}

initPage();