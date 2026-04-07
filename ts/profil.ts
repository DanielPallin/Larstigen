import "../css/global.css";
import "../css/components.css";
import "../css/profil.css";

import { initGlobalUI } from "./global";

async function initPage(): Promise<void> {
  await initGlobalUI();

  // din extra profil-logik här
}

initPage();