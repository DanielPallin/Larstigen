// ts/authguard.ts
import { supabase } from './api';

export async function requireAuth() {
  // Kolla om det finns en aktiv session
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // Om ingen är inloggad, sparka ut dem till index.html (root-mappen)
    window.location.href = '../index.html';
  }
  
  return session; // Om vi är inloggade, returnera sessionen (kan vara bra att ha)
}