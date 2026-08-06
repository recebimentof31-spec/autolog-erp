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

  const { data, error } =
    await supabaseClient.auth.signInWithPassword({
      email: email,
      password: senha
    });

  if (error) {
    console.error("Erro do Supabase:", error);

    mensagem.textContent =
      `${error.message} | código: ${error.code || "sem código"}`;

    return;
  }

  if (data.session) {
    window.location.href = "dashboard.html";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const { data, error } =
    await supabaseClient.auth.getSession();

  if (error) {
    console.error("Erro ao verificar sessão:", error);
    return;
  }

  if (data.session) {
    window.location.href = "dashboard.html";
  }

  document
    .getElementById("senha")
    ?.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        login();
      }
    });
});