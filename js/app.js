async function login() {
  const email = document.getElementById("usuario").value.trim();
  const senha = document.getElementById("senha").value;
  const mensagem = document.getElementById("mensagem");

  mensagem.textContent = "";

  if (!email || !senha) {
    mensagem.textContent = "Informe o e-mail e a senha.";
    return;
  }

  mensagem.textContent = "Entrando...";

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: senha
  });

  if (error) {
    console.error(error);
    mensagem.textContent = "E-mail ou senha incorretos.";
    return;
  }

  if (data.session) {
    window.location.href = "dashboard.html";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const { data } = await supabase.auth.getSession();

  if (data.session) {
    window.location.href = "dashboard.html";
  }

  document.getElementById("senha")?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      login();
    }
  });
});