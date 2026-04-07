import "/css/global.css";
import "/css/components.css";
import "/css/loggbok.css";

import { initGlobalUI } from "./global";

async function initPage(): Promise<void> {
  await initGlobalUI();

  // din extra loggbok-logik här
}

initPage();