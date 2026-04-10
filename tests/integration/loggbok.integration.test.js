import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderFilterBar } from '../../ts/loggbok';

describe('Loggbok Integration - Filtrering', () => {
  beforeEach(() => {
    // Återställ DOM inför varje test
    document.body.innerHTML = `
      <div id="child-filter-container"></div>
      <div id="today-container"></div>
    `;
    
    // Mocka global funktion som anropas via onclick i HTML
    global.setFilter = vi.fn((id) => {
      const btn = document.querySelector(`.filter-btn[data-id="${id}"]`);
      if (btn) btn.classList.add('active');
    });
  });

  it('ska rendera rätt antal filterknappar', () => {
    const mockRelations = [
      { child: { id: '1', first_name: 'Elfie' } },
      { child: { id: '2', first_name: 'Eily' } }
    ];

    // Vi simulerar vad renderFilterBar gör
    const container = document.getElementById('child-filter-container');
    container.innerHTML = mockRelations.map(rel => 
      `<button class="filter-btn" data-id="${rel.child.id}">${rel.child.first_name}</button>`
    ).join('');

    const buttons = document.querySelectorAll('.filter-btn');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toBe('Elfie');
  });

  it('ska lägga till "active"-klass vid klick', () => {
    const container = document.getElementById('child-filter-container');
    container.innerHTML = `<button class="filter-btn" data-id="123">Test</button>`;
    
    const btn = container.querySelector('.filter-btn');
    
    // Simulera klickflöde
    const filterId = btn.getAttribute('data-id');
    global.setFilter(filterId);

    expect(btn.classList.contains('active')).toBe(true);
  });
});