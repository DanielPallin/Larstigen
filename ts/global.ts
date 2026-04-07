/*  Icons */

const iconCache = new Map<string, string>();

async function fetchIcon(name: string): Promise<string> {
  if (iconCache.has(name)) {
    return iconCache.get(name)!;
  }

  const response = await fetch(`/assets/icons/${name}.svg`);

  if (!response.ok) {
    throw new Error(`Kunde inte ladda ikon: ${name}`);
  }

  const svgText = await response.text();
  iconCache.set(name, svgText);

  return svgText;
}

function normalizeSvg(svg: SVGSVGElement): void {
  svg.removeAttribute("width");
  svg.removeAttribute("height");

  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  svg.querySelectorAll("[stroke]").forEach((node) => {
    node.setAttribute("stroke", "currentColor");
  });

  svg.querySelectorAll("[fill]").forEach((node) => {
    const currentFill = node.getAttribute("fill");
    if (currentFill && currentFill !== "none") {
      node.setAttribute("fill", "none");
    }
  });
}

export async function loadIcons(): Promise<void> {
  const holders = document.querySelectorAll<HTMLElement>("[data-icon]");

  for (const holder of holders) {
    if (holder.querySelector("svg")) continue;

    const iconName = holder.dataset.icon;
    if (!iconName) continue;

    try {
      const svgText = await fetchIcon(iconName);
      holder.innerHTML = svgText;

      const svg = holder.querySelector("svg");
      if (!svg) continue;

      normalizeSvg(svg);
    } catch (error) {
      console.error(error);
    }
  }
}

/* Nav */

export function setActiveNav(): void {
  const currentPage = window.location.pathname.split("/").pop();

  const navItems = document.querySelectorAll<HTMLAnchorElement>(".bottom-nav .nav-item");

  navItems.forEach((item) => {
    const href = item.getAttribute("href");
    item.classList.toggle("active", href === currentPage);
  });
}

export function initBottomNavScroll(threshold = 80): void {
  const nav = document.querySelector<HTMLElement>(".bottom-nav");
  if (!nav) return;

  let lastScrollY = window.scrollY;

  window.addEventListener("scroll", () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY < 10) {
      nav.classList.remove("hide");
      lastScrollY = currentScrollY;
      return;
    }

    if (currentScrollY > lastScrollY && currentScrollY > threshold) {
      nav.classList.add("hide");
    } else if (currentScrollY < lastScrollY) {
      nav.classList.remove("hide");
    }

    lastScrollY = currentScrollY;
  });
}

/* Krympande header */

export function initHeaderShrink(threshold = 60): void {
  const header = document.querySelector<HTMLElement>(".site-header");
  if (!header) return;

  const updateHeader = (): void => {
    header.classList.toggle("shrink", window.scrollY > threshold);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader);
}

/* Global init*/

export async function initGlobalUI(): Promise<void> {
  setActiveNav();
  await loadIcons();
  initBottomNavScroll();
  initHeaderShrink();
}