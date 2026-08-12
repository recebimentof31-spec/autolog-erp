// =============================================
// GESTÃO DE DESEMPENHO
// FUNCIONÁRIOS - V2
// =============================================


// =============================================
// ELEMENTOS DA PÁGINA
// =============================================

const form = document.getElementById("employeeForm");

const tableBody =
    document.getElementById("employeeTableBody");

const searchInput =
    document.getElementById("searchInput");

const emptyMessage =
    document.getElementById("emptyMessage");

const employeeCounter =
    document.getElementById("employeeCounter");

const formTitle =
    document.getElementById("formTitle");

const cancelButton =
    document.getElementById("cancelButton");


let funcionarios = [];


// =============================================
// VERIFICA SESSÃO
// =============================================

async function verificarSessao() {

    const { data, error } =
        await supabaseClient.auth.getSession();


    if (error || !data.session) {

        window.location.href = "index.html";

        return false;

    }


    return true;

}


// =============================================
// CARREGA FUNCIONÁRIOS
// =============================================

async function carregarFuncionarios() {

    const { data, error } =
        await supabaseClient
            .from("funcionarios")
            .select("*")
            .order("nome", {
                ascending: true
            });


    if (error) {

        console.error(
            "Erro ao carregar funcionários:",
            error
        );

        alert(
            "Não foi possível carregar os funcionários."
        );

        return;

    }


    funcionarios = data || [];


    renderizarFuncionarios(
        searchInput.value
    );

}


// =============================================
// RENDERIZA FUNCIONÁRIOS
// =============================================

function renderizarFuncionarios(filtro = "") {

    const termo =
        filtro
            .toLowerCase()
            .trim();


    const lista =
        funcionarios.filter(
            funcionario => {

                const nome =
                    funcionario.nome || "";

                const matricula =
                    funcionario.matricula || "";


                return (
                    nome
                        .toLowerCase()
                        .includes(termo)
                    ||
                    matricula
                        .toLowerCase()
                        .includes(termo)
                );

            }
        );


    tableBody.innerHTML = "";


    // =========================================
    // CRIA AS LINHAS
    // =========================================

    lista.forEach(
        funcionario => {

            const tr =
                document.createElement("tr");


            // =================================
            // DADOS
            // =================================

            const dados = [

                funcionario.nome,

                funcionario.matricula,

                funcionario.cargo,

                funcionario.setor,

                funcionario.turno

            ];


            dados.forEach(
                valor => {

                    const td =
                        document.createElement("td");

                    td.textContent =
                        valor || "-";

                    tr.appendChild(td);

                }
            );


            // =================================
            // STATUS
            // =================================

            const tdStatus =
                document.createElement("td");


            const status =
                document.createElement("span");


            const statusFuncionario =
                funcionario.status || "Ativo";


            status.textContent =
                statusFuncionario;


            status.style.display =
                "inline-flex";

            status.style.alignItems =
                "center";

            status.style.justifyContent =
                "center";

            status.style.padding =
                "5px 10px";

            status.style.borderRadius =
                "999px";

            status.style.fontSize =
                "10px";

            status.style.fontWeight =
                "800";

            status.style.textTransform =
                "uppercase";

            status.style.letterSpacing =
                ".3px";


            if (
                statusFuncionario
                    .toLowerCase() === "ativo"
            ) {

                status.style.background =
                    "rgba(46, 204, 113, 0.12)";

                status.style.color =
                    "#4ade80";

                status.style.border =
                    "1px solid rgba(74,222,128,.18)";

            }

            else {

                status.style.background =
                    "rgba(239,68,68,.12)";

                status.style.color =
                    "#f87171";

                status.style.border =
                    "1px solid rgba(248,113,113,.18)";

            }


            tdStatus.appendChild(status);

            tr.appendChild(tdStatus);


            // =================================
            // AÇÕES
            // =================================

            const tdAcoes =
                document.createElement("td");


            const containerAcoes =
                document.createElement("div");


            containerAcoes.style.display =
                "flex";

            containerAcoes.style.gap =
                "8px";

            containerAcoes.style.alignItems =
                "center";


            // =================================
            // BOTÃO EDITAR
            // =================================

            const botaoEditar =
                document.createElement("button");


            botaoEditar.type =
                "button";

            botaoEditar.textContent =
                "Editar";


            botaoEditar.style.padding =
                "7px 12px";

            botaoEditar.style.borderRadius =
                "7px";

            botaoEditar.style.border =
                "1px solid rgba(255,122,26,.35)";

            botaoEditar.style.background =
                "rgba(255,122,26,.10)";

            botaoEditar.style.color =
                "#ff7a1a";

            botaoEditar.style.fontWeight =
                "700";

            botaoEditar.style.fontSize =
                "11px";

            botaoEditar.style.cursor =
                "pointer";


            botaoEditar.addEventListener(
                "click",
                () => {

                    editarFuncionario(
                        funcionario.id
                    );

                }
            );


            // =================================
            // BOTÃO EXCLUIR
            // =================================

            const botaoExcluir =
                document.createElement("button");


            botaoExcluir.type =
                "button";

            botaoExcluir.textContent =
                "Excluir";


            botaoExcluir.style.padding =
                "7px 12px";

            botaoExcluir.style.borderRadius =
                "7px";

            botaoExcluir.style.border =
                "1px solid rgba(239,68,68,.30)";

            botaoExcluir.style.background =
                "rgba(239,68,68,.10)";

            botaoExcluir.style.color =
                "#f87171";

            botaoExcluir.style.fontWeight =
                "700";

            botaoExcluir.style.fontSize =
                "11px";

            botaoExcluir.style.cursor =
                "pointer";


            botaoExcluir.addEventListener(
                "click",
                () => {

                    excluirFuncionario(
                        funcionario.id
                    );

                }
            );


            containerAcoes.appendChild(
                botaoEditar
            );

            containerAcoes.appendChild(
                botaoExcluir
            );


            tdAcoes.appendChild(
                containerAcoes
            );


            tr.appendChild(
                tdAcoes
            );


            tableBody.appendChild(
                tr
            );

        }
    );


    // =========================================
    // MENSAGEM DE LISTA VAZIA
    // =========================================

    if (lista.length === 0) {

        emptyMessage.style.display =
            "block";

    }

    else {

        emptyMessage.style.display =
            "none";

    }


    // =========================================
    // CONTADOR
    // =========================================

    const quantidade =
        funcionarios.length;


    employeeCounter.textContent =
        quantidade === 1
            ? "1 funcionário"
            : `${quantidade} funcionários`;

}


// =============================================
// LIMPA FORMULÁRIO
// =============================================

function limparFormulario() {

    form.reset();


    document
        .getElementById("employeeId")
        .value = "";


    document
        .getElementById("status")
        .value = "Ativo";


    formTitle.textContent =
        "Novo funcionário";


    cancelButton.style.display =
        "none";

}


// =============================================
// SALVAR / EDITAR
// =============================================

form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const id =
            document
                .getElementById("employeeId")
                .value;


        const funcionario = {

            nome:
                document
                    .getElementById("nome")
                    .value
                    .trim(),

            matricula:
                document
                    .getElementById("matricula")
                    .value
                    .trim(),

            cargo:
                document
                    .getElementById("cargo")
                    .value,

            setor:
                document
                    .getElementById("setor")
                    .value,

            turno:
                document
                    .getElementById("turno")
                    .value,

            status:
                document
                    .getElementById("status")
                    .value

        };


        // =====================================
        // VALIDAÇÃO
        // =====================================

        if (
            !funcionario.nome ||
            !funcionario.matricula ||
            !funcionario.cargo ||
            !funcionario.setor ||
            !funcionario.turno
        ) {

            alert(
                "Preencha todos os campos obrigatórios."
            );

            return;

        }


        let resultado;


        // =====================================
        // EDITAR
        // =====================================

        if (id) {

            resultado =
                await supabaseClient
                    .from("funcionarios")
                    .update(funcionario)
                    .eq("id", id);

        }


        // =====================================
        // CADASTRAR
        // =====================================

        else {

            resultado =
                await supabaseClient
                    .from("funcionarios")
                    .insert([
                        funcionario
                    ]);

        }


        // =====================================
        // ERRO
        // =====================================

        if (resultado.error) {

            console.error(
                "Erro ao salvar funcionário:",
                resultado.error
            );


            if (
                resultado.error.code === "23505"
                ||
                resultado.error.message
                    ?.toLowerCase()
                    .includes("duplicate")
            ) {

                alert(
                    "Já existe um funcionário com essa matrícula."
                );

            }

            else {

                alert(
                    "Não foi possível salvar o funcionário: "
                    +
                    resultado.error.message
                );

            }


            return;

        }


        // =====================================
        // SUCESSO
        // =====================================

        limparFormulario();


        await carregarFuncionarios();

    }
);


// =============================================
// EDITAR FUNCIONÁRIO
// =============================================

function editarFuncionario(id) {

    const funcionario =
        funcionarios.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!funcionario) {

        return;

    }


    document
        .getElementById("employeeId")
        .value =
        funcionario.id;


    document
        .getElementById("nome")
        .value =
        funcionario.nome || "";


    document
        .getElementById("matricula")
        .value =
        funcionario.matricula || "";


    document
        .getElementById("cargo")
        .value =
        funcionario.cargo || "";


    document
        .getElementById("setor")
        .value =
        funcionario.setor || "";


    document
        .getElementById("turno")
        .value =
        funcionario.turno || "";


    document
        .getElementById("status")
        .value =
        funcionario.status || "Ativo";


    formTitle.textContent =
        "Editar funcionário";


    cancelButton.style.display =
        "inline-flex";


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


// =============================================
// EXCLUIR FUNCIONÁRIO
// =============================================

async function excluirFuncionario(id) {

    const funcionario =
        funcionarios.find(
            item =>
                String(item.id) ===
                String(id)
        );


    const nome =
        funcionario?.nome ||
        "este funcionário";


    const confirmar =
        confirm(
            `Deseja realmente excluir ${nome}?`
        );


    if (!confirmar) {

        return;

    }


    const { error } =
        await supabaseClient
            .from("funcionarios")
            .delete()
            .eq("id", id);


    if (error) {

        console.error(
            "Erro ao excluir funcionário:",
            error
        );


        alert(
            "Não foi possível excluir o funcionário."
        );


        return;

    }


    // Se estava editando o funcionário excluído
    const idEmEdicao =
        document
            .getElementById("employeeId")
            .value;


    if (
        String(idEmEdicao) ===
        String(id)
    ) {

        limparFormulario();

    }


    await carregarFuncionarios();

}


// =============================================
// PESQUISA
// =============================================

searchInput.addEventListener(
    "input",
    () => {

        renderizarFuncionarios(
            searchInput.value
        );

    }
);


// =============================================
// CANCELAR EDIÇÃO
// =============================================

cancelButton.addEventListener(
    "click",
    limparFormulario
);


// =============================================
// INICIALIZAÇÃO
// =============================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const logado =
            await verificarSessao();


        if (!logado) {

            return;

        }


        limparFormulario();


        await carregarFuncionarios();

    }
);