const form = document.getElementById("employeeForm");
const tableBody = document.getElementById("employeeTableBody");
const searchInput = document.getElementById("searchInput");
const emptyMessage = document.getElementById("emptyMessage");
const employeeCounter = document.getElementById("employeeCounter");
const formTitle = document.getElementById("formTitle");
const cancelButton = document.getElementById("cancelButton");

let funcionarios = [];

// ===============================
// VERIFICA SE O USUÁRIO ESTÁ LOGADO
// ===============================

async function verificarSessao() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error || !data.session) {
    window.location.href = "index.html";
    return false;
  }

  return true;
}

// ===============================
// CARREGA OS FUNCIONÁRIOS DO SUPABASE
// ===============================

async function carregarFuncionarios() {
  const { data, error } = await supabaseClient
    .from("funcionarios")
    .select("*")
    .order("nome", { ascending: true });

  if (error) {
    console.error("Erro ao carregar funcionários:", error);
    alert("Não foi possível carregar os funcionários.");
    return;
  }

  funcionarios = data || [];
  renderizarFuncionarios(searchInput.value);
}

// ===============================
// EXIBE OS FUNCIONÁRIOS NA TABELA
// ===============================

function renderizarFuncionarios(filtro = "") {
  const termo = filtro.toLowerCase().trim();

  const lista = funcionarios.filter(funcionario => {
    const nome = funcionario.nome || "";
    const matricula = funcionario.matricula || "";

    return (
      nome.toLowerCase().includes(termo) ||
      matricula.toLowerCase().includes(termo)
    );
  });

  tableBody.innerHTML = "";

  lista.forEach(funcionario => {
    const tr = document.createElement("tr");

    const dados = [
      funcionario.nome,
      funcionario.matricula,
      funcionario.cargo,
      funcionario.setor,
      funcionario.turno
    ];

    dados.forEach(valor => {
      const td = document.createElement("td");
      td.textContent = valor || "-";
      tr.appendChild(td);
    });

    // STATUS
    const tdStatus = document.createElement("td");
    const status = document.createElement("span");

    status.className =
      "status " +
      ((funcionario.status || "Ativo").toLowerCase() === "ativo"
        ? "ativo"
        : "inativo");

    status.textContent = funcionario.status || "Ativo";

    tdStatus.appendChild(status);
    tr.appendChild(tdStatus);

    // AÇÕES
    const tdAcoes = document.createElement("td");

    const botaoEditar = document.createElement("button");
    botaoEditar.className = "edit";
    botaoEditar.textContent = "Editar";
    botaoEditar.addEventListener("click", () => {
      editarFuncionario(funcionario.id);
    });

    const botaoExcluir = document.createElement("button");
    botaoExcluir.className = "delete";
    botaoExcluir.textContent = "Excluir";
    botaoExcluir.style.marginLeft = "6px";
    botaoExcluir.addEventListener("click", () => {
      excluirFuncionario(funcionario.id);
    });

    tdAcoes.appendChild(botaoEditar);
    tdAcoes.appendChild(botaoExcluir);

    tr.appendChild(tdAcoes);

    tableBody.appendChild(tr);
  });

  emptyMessage.style.display = lista.length ? "none" : "block";

  employeeCounter.textContent =
    `${funcionarios.length} funcionário(s)`;
}

// ===============================
// LIMPA O FORMULÁRIO
// ===============================

function limparFormulario() {
  form.reset();

  document.getElementById("employeeId").value = "";
  document.getElementById("status").value = "Ativo";

  formTitle.textContent = "Novo funcionário";
  cancelButton.hidden = true;
}

// ===============================
// SALVA OU EDITA FUNCIONÁRIO
// ===============================

form.addEventListener("submit", async event => {
  event.preventDefault();

  const id = document.getElementById("employeeId").value;

  const funcionario = {
    nome: document.getElementById("nome").value.trim(),
    matricula: document.getElementById("matricula").value.trim(),
    cargo: document.getElementById("cargo").value,
    setor: document.getElementById("setor").value,
    turno: document.getElementById("turno").value,
    status: document.getElementById("status").value
  };

  if (
    !funcionario.nome ||
    !funcionario.matricula ||
    !funcionario.cargo ||
    !funcionario.setor ||
    !funcionario.turno
  ) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  let resultado;

  if (id) {
    // EDITAR
    resultado = await supabaseClient
      .from("funcionarios")
      .update(funcionario)
      .eq("id", id);
  } else {
    // CADASTRAR
    resultado = await supabaseClient
      .from("funcionarios")
      .insert([funcionario]);
  }

  if (resultado.error) {
    console.error(
      "Erro ao salvar funcionário:",
      resultado.error
    );

    if (
      resultado.error.code === "23505" ||
      resultado.error.message
        ?.toLowerCase()
        .includes("duplicate")
    ) {
      alert("Já existe um funcionário com essa matrícula.");
    } else {
      alert(
        "Não foi possível salvar o funcionário: " +
        resultado.error.message
      );
    }

    return;
  }

  limparFormulario();

  await carregarFuncionarios();
});

// ===============================
// PREENCHE O FORMULÁRIO PARA EDIÇÃO
// ===============================

function editarFuncionario(id) {
  const funcionario = funcionarios.find(
    item => String(item.id) === String(id)
  );

  if (!funcionario) return;

  document.getElementById("employeeId").value =
    funcionario.id;

  document.getElementById("nome").value =
    funcionario.nome || "";

  document.getElementById("matricula").value =
    funcionario.matricula || "";

  document.getElementById("cargo").value =
    funcionario.cargo || "";

  document.getElementById("setor").value =
    funcionario.setor || "";

  document.getElementById("turno").value =
    funcionario.turno || "";

  document.getElementById("status").value =
    funcionario.status || "Ativo";

  formTitle.textContent = "Editar funcionário";
  cancelButton.hidden = false;

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

// ===============================
// EXCLUI FUNCIONÁRIO
// ===============================

async function excluirFuncionario(id) {
  const confirmar = confirm(
    "Deseja realmente excluir este funcionário?"
  );

  if (!confirmar) return;

  const { error } = await supabaseClient
    .from("funcionarios")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(
      "Erro ao excluir funcionário:",
      error
    );

    alert("Não foi possível excluir o funcionário.");
    return;
  }

  await carregarFuncionarios();
}

// ===============================
// PESQUISA EM TEMPO REAL
// ===============================

searchInput.addEventListener("input", () => {
  renderizarFuncionarios(searchInput.value);
});

// ===============================
// CANCELA A EDIÇÃO
// ===============================

cancelButton.addEventListener(
  "click",
  limparFormulario
);

// ===============================
// INICIALIZA A PÁGINA
// ===============================

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    const logado = await verificarSessao();

    if (logado) {
      await carregarFuncionarios();
    }
  }
);