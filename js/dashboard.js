async function verificarSessao() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error || !data.session) {
    window.location.href = "index.html";
  }
}

async function sair() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", verificarSessao);