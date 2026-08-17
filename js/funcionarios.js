// =====================================================
// GESTÃO DE DESEMPENHO
// FUNCIONÁRIOS - V3
// =====================================================


// =====================================================
// ELEMENTOS DA PÁGINA
// =====================================================

const form =
    document.getElementById(
        "employeeForm"
    );

const tableBody =
    document.getElementById(
        "employeeTableBody"
    );

const searchInput =
    document.getElementById(
        "searchInput"
    );

const emptyMessage =
    document.getElementById(
        "emptyMessage"
    );

const employeeCounter =
    document.getElementById(
        "employeeCounter"
    );

const formTitle =
    document.getElementById(
        "formTitle"
    );

const cancelButton =
    document.getElementById(
        "cancelButton"
    );


// =====================================================
// ELEMENTOS DE FOTO
// =====================================================

const employeeAvatarPreview =
    document.getElementById(
        "employeeAvatarPreview"
    );

const employeePhotoInput =
    document.getElementById(
        "employeePhotoInput"
    );

const btnSelecionarFotoFuncionario =
    document.getElementById(
        "btnSelecionarFotoFuncionario"
    );

const btnEditarFotoFuncionario =
    document.getElementById(
        "btnEditarFotoFuncionario"
    );

const btnRemoverFotoFuncionario =
    document.getElementById(
        "btnRemoverFotoFuncionario"
    );

const employeePhotoStatus =
    document.getElementById(
        "employeePhotoStatus"
    );


// =====================================================
// MODAL DE FOTO
// =====================================================

const employeePhotoModal =
    document.getElementById(
        "employeePhotoModal"
    );

const btnCloseEmployeePhotoModal =
    document.getElementById(
        "btnCloseEmployeePhotoModal"
    );

const employeePhotoModalImage =
    document.getElementById(
        "employeePhotoModalImage"
    );

const employeePhotoModalName =
    document.getElementById(
        "employeePhotoModalName"
    );

const employeePhotoModalDetails =
    document.getElementById(
        "employeePhotoModalDetails"
    );


// =====================================================
// ESTADO
// =====================================================

let funcionarios = [];

let usuarioAuthAtual = null;

let fotoSelecionada = null;

let avatarAtualUrl = null;

let removerAvatarAtual = false;


// =====================================================
// VERIFICA SESSÃO
// =====================================================

async function verificarSessao() {

    const {
        data,
        error
    } =
        await supabaseClient
            .auth
            .getSession();


    if (
        error ||
        !data.session
    ) {

        window.location.href =
            "index.html";

        return false;

    }


    usuarioAuthAtual =
        data.session.user;


    return true;

}


// =====================================================
// CARREGA FUNCIONÁRIOS
// =====================================================

async function carregarFuncionarios() {

    const {
        data,
        error
    } =
        await supabaseClient

            .from(
                "funcionarios"
            )

            .select("*")

            .order(
                "nome",
                {
                    ascending: true
                }
            );


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


    funcionarios =
        data || [];


    renderizarFuncionarios(
        searchInput?.value || ""
    );

}


// =====================================================
// INICIAIS
// =====================================================

function obterIniciais(nome) {

    const partes =
        String(
            nome ||
            "Funcionário"
        )
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (
        partes.length === 0
    ) {

        return "FN";

    }


    if (
        partes.length === 1
    ) {

        return partes[0]
            .slice(0, 2)
            .toUpperCase();

    }


    return (
        partes[0][0]
        +
        partes[
            partes.length - 1
        ][0]
    )
        .toUpperCase();

}


// =====================================================
// CRIA AVATAR
// =====================================================

function criarAvatarFuncionario(
    funcionario,
    tamanho = "tabela"
) {

    const avatar =
        document.createElement(
            "div"
        );


    avatar.className =
        tamanho === "tabela"
            ? "funcionario-tabela-avatar"
            : "funcionario-avatar";


    if (
        funcionario.avatar_url
    ) {

        const imagem =
            document.createElement(
                "img"
            );


        imagem.src =
            funcionario.avatar_url;


        imagem.alt =
            `Foto de ${funcionario.nome || "funcionário"}`;


        avatar.appendChild(
            imagem
        );

    }

    else {

        avatar.textContent =
            obterIniciais(
                funcionario.nome
            );

    }


    avatar.title =
        funcionario.avatar_url
            ? "Visualizar foto"
            : "Sem foto cadastrada";


    if (
        funcionario.avatar_url
    ) {

        avatar.addEventListener(
            "click",
            () => {

                abrirModalFotoFuncionario(
                    funcionario
                );

            }
        );

    }


    return avatar;

}


// =====================================================
// RENDERIZA FUNCIONÁRIOS
// =====================================================

function renderizarFuncionarios(
    filtro = ""
) {

    const termo =
        filtro
            .toLowerCase()
            .trim();


    const lista =
        funcionarios.filter(
            funcionario => {

                const nome =
                    funcionario.nome ||
                    "";

                const matricula =
                    funcionario.matricula ||
                    "";


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


    tableBody.innerHTML =
        "";


    lista.forEach(
        funcionario => {

            const tr =
                document.createElement(
                    "tr"
                );


            // =========================================
            // COLABORADOR
            // =========================================

            const tdColaborador =
                document.createElement(
                    "td"
                );


            const identidade =
                document.createElement(
                    "div"
                );


            identidade.className =
                "funcionario-tabela-identidade";


            const avatar =
                criarAvatarFuncionario(
                    funcionario,
                    "tabela"
                );


            const blocoNome =
                document.createElement(
                    "div"
                );


            blocoNome.className =
                "funcionario-tabela-nome";


            const nome =
                document.createElement(
                    "strong"
                );


            nome.textContent =
                funcionario.nome ||
                "-";


            const subtitulo =
                document.createElement(
                    "small"
                );


            subtitulo.textContent =
                funcionario.matricula
                    ? `Matrícula ${funcionario.matricula}`
                    : "Sem matrícula";


            blocoNome.appendChild(
                nome
            );


            blocoNome.appendChild(
                subtitulo
            );


            identidade.appendChild(
                avatar
            );


            identidade.appendChild(
                blocoNome
            );


            tdColaborador.appendChild(
                identidade
            );


            tr.appendChild(
                tdColaborador
            );


            // =========================================
            // DADOS
            // =========================================

            const dados = [

                funcionario.matricula,

                funcionario.cargo,

                funcionario.setor,

                funcionario.turno

            ];


            dados.forEach(
                valor => {

                    const td =
                        document.createElement(
                            "td"
                        );


                    td.textContent =
                        valor ||
                        "-";


                    tr.appendChild(
                        td
                    );

                }
            );


            // =========================================
            // STATUS
            // =========================================

            const tdStatus =
                document.createElement(
                    "td"
                );


            const status =
                document.createElement(
                    "span"
                );


            const statusFuncionario =
                funcionario.status ||
                "Ativo";


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
                    .toLowerCase() ===
                "ativo"
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


            tdStatus.appendChild(
                status
            );


            tr.appendChild(
                tdStatus
            );


            // =========================================
            // AÇÕES
            // =========================================

            const tdAcoes =
                document.createElement(
                    "td"
                );


            const containerAcoes =
                document.createElement(
                    "div"
                );


            containerAcoes.style.display =
                "flex";

            containerAcoes.style.gap =
                "8px";

            containerAcoes.style.alignItems =
                "center";


            // =========================================
            // EDITAR
            // =========================================

            const botaoEditar =
                document.createElement(
                    "button"
                );


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


            // =========================================
            // EXCLUIR
            // =========================================

            const botaoExcluir =
                document.createElement(
                    "button"
                );


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


    if (
        lista.length === 0
    ) {

        emptyMessage.style.display =
            "block";

    }

    else {

        emptyMessage.style.display =
            "none";

    }


    const quantidade =
        funcionarios.length;


    employeeCounter.textContent =
        quantidade === 1
            ? "1 funcionário"
            : `${quantidade} funcionários`;

}


// =====================================================
// ATUALIZA PREVIEW DO AVATAR
// =====================================================

function atualizarPreviewFuncionario(
    nome,
    avatarUrl = null
) {

    if (
        !employeeAvatarPreview
    ) {

        return;

    }


    employeeAvatarPreview.innerHTML =
        "";


    if (
        avatarUrl
    ) {

        const imagem =
            document.createElement(
                "img"
            );


        imagem.src =
            avatarUrl;


        imagem.alt =
            "Foto do funcionário";


        employeeAvatarPreview.appendChild(
            imagem
        );


        btnRemoverFotoFuncionario.style.display =
            "inline-flex";


        return;

    }


    employeeAvatarPreview.textContent =
        obterIniciais(
            nome
        );


    btnRemoverFotoFuncionario.style.display =
        "none";

}


// =====================================================
// STATUS DA FOTO
// =====================================================

function definirStatusFoto(
    mensagem,
    tipo = "normal"
) {

    if (
        !employeePhotoStatus
    ) {

        return;

    }


    employeePhotoStatus.textContent =
        mensagem;


    switch (tipo) {

        case "sucesso":

            employeePhotoStatus.style.color =
                "#37d67a";

            break;


        case "erro":

            employeePhotoStatus.style.color =
                "#ff5d5d";

            break;


        default:

            employeePhotoStatus.style.color =
                "#8792a2";

    }

}


// =====================================================
// LIMPA FORMULÁRIO
// =====================================================

function limparFormulario() {

    form.reset();


    document
        .getElementById(
            "employeeId"
        )
        .value =
        "";


    document
        .getElementById(
            "status"
        )
        .value =
        "Ativo";


    formTitle.textContent =
        "Novo funcionário";


    cancelButton.style.display =
        "none";


    fotoSelecionada =
        null;


    avatarAtualUrl =
        null;


    removerAvatarAtual =
        false;


    if (
        employeePhotoInput
    ) {

        employeePhotoInput.value =
            "";

    }


    atualizarPreviewFuncionario(
        "Funcionário",
        null
    );


    definirStatusFoto(
        ""
    );

}


// =====================================================
// PREVIEW DA FOTO SELECIONADA
// =====================================================

function mostrarPreviewArquivo(
    arquivo
) {

    if (
        !arquivo
    ) {

        return;

    }


    const urlTemporaria =
        URL.createObjectURL(
            arquivo
        );


    atualizarPreviewFuncionario(
        document
            .getElementById(
                "nome"
            )
            ?.value ||
        "Funcionário",
        urlTemporaria
    );


    definirStatusFoto(
        "Foto selecionada. Salve o funcionário para confirmar.",
        "normal"
    );

}


// =====================================================
// VALIDA FOTO
// =====================================================

function validarFotoFuncionario(
    arquivo
) {

    const tiposPermitidos = [

        "image/jpeg",

        "image/png",

        "image/webp"

    ];


    if (
        !tiposPermitidos.includes(
            arquivo.type
        )
    ) {

        definirStatusFoto(
            "Formato inválido. Use JPG, PNG ou WEBP.",
            "erro"
        );

        return false;

    }


    const tamanhoMaximo =
        2 * 1024 * 1024;


    if (
        arquivo.size >
        tamanhoMaximo
    ) {

        definirStatusFoto(
            "A foto deve ter no máximo 2 MB.",
            "erro"
        );

        return false;

    }


    return true;

}


// =====================================================
// UPLOAD DA FOTO
// =====================================================

async function enviarFotoFuncionario(
    funcionarioId,
    arquivo
) {

    if (
        !arquivo ||
        !funcionarioId
    ) {

        return null;

    }


    let extensao =
        arquivo.name
            .split(".")
            .pop()
            ?.toLowerCase();


    if (
        ![
            "jpg",
            "jpeg",
            "png",
            "webp"
        ].includes(extensao)
    ) {

        extensao =
            arquivo.type === "image/png"
                ? "png"
                : arquivo.type === "image/webp"
                    ? "webp"
                    : "jpg";

    }


    const caminho =
        `funcionarios/${funcionarioId}/avatar.${extensao}`;


    const {
        error: erroUpload
    } =
        await supabaseClient
            .storage
            .from("avatars")
            .upload(
                caminho,
                arquivo,
                {
                    upsert: true,
                    cacheControl: "3600",
                    contentType: arquivo.type
                }
            );


    if (erroUpload) {
        throw erroUpload;
    }


    const {
        data: dadosUrl
    } =
        supabaseClient
            .storage
            .from("avatars")
            .getPublicUrl(caminho);


    const urlPublica =
        dadosUrl?.publicUrl;


    if (!urlPublica) {

        throw new Error(
            "Não foi possível gerar a URL pública da foto."
        );

    }


    return `${urlPublica}?v=${Date.now()}`;

}


// =====================================================
// REMOVE FOTO DO STORAGE
// =====================================================

async function removerFotoFuncionarioStorage(
    funcionarioId,
    avatarUrl
) {

    if (
        !funcionarioId ||
        !avatarUrl
    ) {

        return;

    }


    try {

        const url =
            new URL(
                avatarUrl
            );


        const marcador =
            "/storage/v1/object/public/avatars/";


        const indice =
            url.pathname.indexOf(
                marcador
            );


        if (indice === -1) {
            return;
        }


        const caminho =
            decodeURIComponent(
                url.pathname.substring(
                    indice +
                    marcador.length
                )
            );


        if (
            !caminho.startsWith(
                `funcionarios/${funcionarioId}/`
            )
        ) {

            return;

        }


        const {
            error
        } =
            await supabaseClient
                .storage
                .from("avatars")
                .remove([
                    caminho
                ]);


        if (error) {
            throw error;
        }

    }


    catch (erro) {

        console.warn(
            "Não foi possível remover a foto antiga do Storage:",
            erro
        );

    }

}


// =====================================================
// SALVAR / EDITAR
// =====================================================

form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const id =
            document
                .getElementById(
                    "employeeId"
                )
                .value;


        const funcionario = {

            nome:
                document
                    .getElementById(
                        "nome"
                    )
                    .value
                    .trim(),

            matricula:
                document
                    .getElementById(
                        "matricula"
                    )
                    .value
                    .trim(),

            cargo:
                document
                    .getElementById(
                        "cargo"
                    )
                    .value,

            setor:
                document
                    .getElementById(
                        "setor"
                    )
                    .value,

            turno:
                document
                    .getElementById(
                        "turno"
                    )
                    .value,

            status:
                document
                    .getElementById(
                        "status"
                    )
                    .value

        };


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


        try {

            let funcionarioSalvo = null;


            // =====================================
            // EDITAR
            // =====================================

            if (
                id
            ) {

                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .from(
                            "funcionarios"
                        )
                        .update(
                            funcionario
                        )
                        .eq(
                            "id",
                            id
                        )
                        .select("*")
                        .single();


                if (
                    error
                ) {

                    throw error;

                }


                funcionarioSalvo =
                    data;

            }


            // =====================================
            // CADASTRAR
            // =====================================

            else {

                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .from(
                            "funcionarios"
                        )
                        .insert([
                            funcionario
                        ])
                        .select("*")
                        .single();


                if (
                    error
                ) {

                    throw error;

                }


                funcionarioSalvo =
                    data;

            }


            // =====================================
            // UPLOAD DA FOTO
            // =====================================

            let novaAvatarUrl =
                avatarAtualUrl;


            if (
                fotoSelecionada
            ) {

                definirStatusFoto(
                    "Enviando foto...",
                    "normal"
                );


                novaAvatarUrl =
                    await enviarFotoFuncionario(
                        funcionarioSalvo.id,
                        fotoSelecionada
                    );

            }


            if (
    removerAvatarAtual
) {

    await removerFotoFuncionarioStorage(
        funcionarioSalvo.id,
        funcionarioSalvo.avatar_url
    );

    novaAvatarUrl =
        null;

}

                novaAvatarUrl =
                    null;

            }


            // =====================================
            // ATUALIZA avatar_url
            // =====================================

            if (
                novaAvatarUrl !==
                funcionarioSalvo.avatar_url
            ) {

                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .from(
                            "funcionarios"
                        )
                        .update({
                            avatar_url:
                                novaAvatarUrl
                        })
                        .eq(
                            "id",
                            funcionarioSalvo.id
                        )
                        .select("*")
                        .single();


                if (
                    error
                ) {

                    throw error;

                }


                funcionarioSalvo =
                    data;

            }


            definirStatusFoto(
                "Funcionário salvo com sucesso.",
                "sucesso"
            );


            limparFormulario();


            await carregarFuncionarios();

        }


        catch (
            erro
        ) {

            console.error(
                "Erro ao salvar funcionário:",
                erro
            );


            if (
                erro?.code ===
                "23505"
                ||
                erro?.message
                    ?.toLowerCase()
                    .includes(
                        "duplicate"
                    )
            ) {

                alert(
                    "Já existe um funcionário com essa matrícula."
                );

            }

            else {

                alert(
                    "Não foi possível salvar o funcionário: "
                    +
                    (
                        erro?.message ||
                        "erro desconhecido"
                    )
                );

            }

        }

    }
);


// =====================================================
// EDITAR FUNCIONÁRIO
// =====================================================

function editarFuncionario(
    id
) {

    const funcionario =
        funcionarios.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    id
                )
        );


    if (
        !funcionario
    ) {

        return;

    }


    document
        .getElementById(
            "employeeId"
        )
        .value =
        funcionario.id;


    document
        .getElementById(
            "nome"
        )
        .value =
        funcionario.nome ||
        "";


    document
        .getElementById(
            "matricula"
        )
        .value =
        funcionario.matricula ||
        "";


    document
        .getElementById(
            "cargo"
        )
        .value =
        funcionario.cargo ||
        "";


    document
        .getElementById(
            "setor"
        )
        .value =
        funcionario.setor ||
        "";


    document
        .getElementById(
            "turno"
        )
        .value =
        funcionario.turno ||
        "";


    document
        .getElementById(
            "status"
        )
        .value =
        funcionario.status ||
        "Ativo";


    formTitle.textContent =
        "Editar funcionário";


    cancelButton.style.display =
        "inline-flex";


    fotoSelecionada =
        null;


    avatarAtualUrl =
        funcionario.avatar_url ||
        null;


    removerAvatarAtual =
        false;


    atualizarPreviewFuncionario(
        funcionario.nome,
        avatarAtualUrl
    );


    definirStatusFoto(
        avatarAtualUrl
            ? "Foto atual cadastrada."
            : "Funcionário sem foto cadastrada."
    );


    window.scrollTo({

        top: 0,

        behavior:
            "smooth"

    });

}


// =====================================================
// EXCLUIR FUNCIONÁRIO
// =====================================================

async function excluirFuncionario(
    id
) {

    const funcionario =
        funcionarios.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    id
                )
        );


    const nome =
        funcionario?.nome ||
        "este funcionário";


    const confirmar =
        confirm(
            `Deseja realmente excluir ${nome}?`
        );


    if (
        !confirmar
    ) {

        return;

    }


    const {
        error
    } =
        await supabaseClient
            .from(
                "funcionarios"
            )
            .delete()
            .eq(
                "id",
                id
            );


    if (
        error
    ) {

        console.error(
            "Erro ao excluir funcionário:",
            error
        );


        alert(
            "Não foi possível excluir o funcionário."
        );


        return;

    }


    const idEmEdicao =
        document
            .getElementById(
                "employeeId"
            )
            .value;


    if (
        String(
            idEmEdicao
        ) ===
        String(
            id
        )
    ) {

        limparFormulario();

    }


    await carregarFuncionarios();

}


// =====================================================
// MODAL DA FOTO
// =====================================================

function abrirModalFotoFuncionario(
    funcionario
) {

    if (
        !funcionario?.avatar_url ||
        !employeePhotoModal ||
        !employeePhotoModalImage
    ) {

        return;

    }


    employeePhotoModalImage.src =
        funcionario.avatar_url;


    if (
        employeePhotoModalName
    ) {

        employeePhotoModalName.textContent =
            funcionario.nome ||
            "Funcionário";

    }


    if (
        employeePhotoModalDetails
    ) {

        const detalhes = [

            funcionario.cargo,

            funcionario.setor

        ]
            .filter(Boolean)
            .join(" • ");


        employeePhotoModalDetails.textContent =
            detalhes ||
            "Colaborador";

    }


    employeePhotoModal.classList.add(
        "aberto"
    );


    employeePhotoModal.setAttribute(
        "aria-hidden",
        "false"
    );

}


function fecharModalFotoFuncionario() {

    if (
        !employeePhotoModal
    ) {

        return;

    }


    employeePhotoModal.classList.remove(
        "aberto"
    );


    employeePhotoModal.setAttribute(
        "aria-hidden",
        "true"
    );

}


// =====================================================
// EVENTOS DA FOTO
// =====================================================

if (
    btnSelecionarFotoFuncionario &&
    employeePhotoInput
) {

    btnSelecionarFotoFuncionario
        .addEventListener(
            "click",
            () => {

                employeePhotoInput.click();

            }
        );

}


if (
    btnEditarFotoFuncionario &&
    employeePhotoInput
) {

    btnEditarFotoFuncionario
        .addEventListener(
            "click",
            event => {

                event.stopPropagation();

                employeePhotoInput.click();

            }
        );

}


if (
    employeePhotoInput
) {

    employeePhotoInput
        .addEventListener(
            "change",
            () => {

                const arquivo =
                    employeePhotoInput
                        .files
                        ?.[0];


                if (
                    !arquivo
                ) {

                    return;

                }


                if (
                    !validarFotoFuncionario(
                        arquivo
                    )
                ) {

                    employeePhotoInput.value =
                        "";

                    return;

                }


                fotoSelecionada =
                    arquivo;


                removerAvatarAtual =
                    false;


                mostrarPreviewArquivo(
                    arquivo
                );

            }
        );

}


if (
    btnRemoverFotoFuncionario
) {

    btnRemoverFotoFuncionario
        .addEventListener(
            "click",
            () => {

                fotoSelecionada =
                    null;


                removerAvatarAtual =
                    true;


                avatarAtualUrl =
                    null;


                employeePhotoInput.value =
                    "";


                const nome =
                    document
                        .getElementById(
                            "nome"
                        )
                        ?.value ||
                    "Funcionário";


                atualizarPreviewFuncionario(
                    nome,
                    null
                );


                definirStatusFoto(
                    "A foto será removida quando o funcionário for salvo.",
                    "normal"
                );

            }
        );

}


if (
    employeeAvatarPreview
) {

    employeeAvatarPreview
        .addEventListener(
            "click",
            () => {

                const id =
                    document
                        .getElementById(
                            "employeeId"
                        )
                        ?.value;


                if (
                    !id
                ) {

                    return;

                }


                const funcionario =
                    funcionarios.find(
                        item =>
                            String(
                                item.id
                            ) ===
                            String(
                                id
                            )
                    );


                if (
                    funcionario?.avatar_url
                ) {

                    abrirModalFotoFuncionario(
                        funcionario
                    );

                }

            }
        );

}


if (
    btnCloseEmployeePhotoModal
) {

    btnCloseEmployeePhotoModal
        .addEventListener(
            "click",
            fecharModalFotoFuncionario
        );

}


if (
    employeePhotoModal
) {

    employeePhotoModal
        .addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    employeePhotoModal
                ) {

                    fecharModalFotoFuncionario();

                }

            }
        );

}


// =====================================================
// ATUALIZA INICIAIS AO DIGITAR NOME
// =====================================================

const campoNomeFuncionario =
    document.getElementById(
        "nome"
    );


if (
    campoNomeFuncionario
) {

    campoNomeFuncionario
        .addEventListener(
            "input",
            () => {

                if (
                    !fotoSelecionada &&
                    !avatarAtualUrl
                ) {

                    atualizarPreviewFuncionario(
                        campoNomeFuncionario.value,
                        null
                    );

                }

            }
        );

}


// =====================================================
// PESQUISA
// =====================================================

searchInput.addEventListener(
    "input",
    () => {

        renderizarFuncionarios(
            searchInput.value
        );

    }
);


// =====================================================
// CANCELAR EDIÇÃO
// =====================================================

cancelButton.addEventListener(
    "click",
    limparFormulario
);


// =====================================================
// INICIALIZAÇÃO
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const logado =
            await verificarSessao();


        if (
            !logado
        ) {

            return;

        }


        limparFormulario();


        await carregarFuncionarios();

    }
);