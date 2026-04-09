import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderMenuSection } from '../../ts/information'; 

describe('Menu Integration Test', () => {
  
  const mockMenus = [
    {
      id: '1',
      date: new Date().toISOString().split('T')[0], // Dagens datum
      title: 'Köttbullar',
      description: 'Serveras med mos',
      department_id: 'dep1'
    }
  ];

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="menu-accordion-container"></div>
    `;
  });

  it('ska rendera dagens lunch i menyn', async () => {
    await renderMenuSection(mockMenus, 'dep1');

    const container = document.getElementById('menu-accordion-container');
    
    expect(container?.innerHTML).toContain('Köttbullar');
    expect(container?.innerHTML).toContain('Dagens lunch:');
  });

  it('ska visa "Information saknas" om en dag saknar mat', async () => {

    await renderMenuSection([], 'dep1');

    const container = document.getElementById('menu-accordion-container');
    expect(container?.innerHTML).toContain('Information saknas');
  });

  it('ska uppdatera veckonumret när man klickar på nästa-knappen', async () => {
    await renderMenuSection(mockMenus, 'dep1');

    const weekLabelBefore = document.querySelector('.week-navigation span');
    const initialText = weekLabelBefore?.textContent; // T.ex. "Vecka 15"

    const nextBtn = document.getElementById('next-menu-week');
    nextBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true })); // Säkrare klick i JSDOM

    const weekLabelAfter = document.querySelector('.week-navigation span');
    const newText = weekLabelAfter?.textContent;

    expect(newText).not.toBe(initialText);
  });
  });
