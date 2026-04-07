import { supabase } from "./api";
import "../css/global.css"
import "../css/components.css";

// 1. Fånga upp båda formulären
const parentLoginForm = document.getElementById("parent-login-form");
const staffLoginForm = document.getElementById("login-form");

// 2. Skapa en gemensam inloggningsfunktion
async function handleLogin(e: Event, emailId: string, passwordId: string) {
  e.preventDefault(); // Stoppa sidan från att laddas om

  const email = (document.getElementById(emailId) as HTMLInputElement).value;
  const password = (document.getElementById(passwordId) as HTMLInputElement)
    .value;

  // Fråga Supabase om uppgifterna stämmer
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) {
    alert("Inloggningen misslyckades. Kontrollera e-post och lösenord.");
    console.error("Login error:", error.message);
  } else {
    // SUCCESS! Skicka användaren dashboard
    window.location.href = "pages/dashboard.html";
  }
}

// 3. Koppla funktionen till knapparna
parentLoginForm?.addEventListener("submit", (e) =>
  handleLogin(e, "parent-email", "parent-password"),
);
staffLoginForm?.addEventListener("submit", (e) =>
  handleLogin(e, "email", "password"),
);
