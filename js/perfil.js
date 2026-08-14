// =====================================================
// MEU PERFIL
// =====================================================

let perfilAtual = null;
let usuarioAuthAtual = null;


// =====================================================
// INICIALIZAÇÃO
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await carregarMeuPerfil();

        configurarEventosPerfil();

    }
);


// =====================================================
// CARREGA PERFIL
// =====================================================

async function carregarMeuPerfil() {

    definirMensagemPerfil(
        "Carregando perfil...",
        "normal"
    );


    try {

        // =============================================
        // SESSÃO
        // =============================================

        const {
            data: sessaoData,
            error: erroSessao
        } =
            await supabaseClient
                .auth
                .getSession();


        if (erroSessao) {
            throw erroSessao;
        }


        const usuario =
            sessaoData
                ?.session
                ?.user;


        if (!usuario) {

            window.location.href =
                "index.html";

            return;
        }


        usuarioAuthAtual =
            usuario;


        // =============================================
        // PERFIL DO SISTEMA
        // =============================================

        const {
            data: perfil,
            error: erroPerfil
        } =
            await supabaseClient

                .from(
                    "perfis_usuario"
                )

                .select(`
                    id,
                    auth_user_id,
                    funcionario_id,
                    nome_exibicao,
                    papel,
                    ativo,
                    created_at
                `)

                .eq(
                    "auth_user_id",
                    usuario.id
                )

                .maybeSingle();


        if (erroPerfil) {
            throw erroPerfil;
        }


        if (!perfil) {

            throw new Error(
                "Perfil de usuário não encontrado."
            );

        }


        perfilAtual =
            perfil;


        // =============================================
        // PREENCHE A TELA
        // =============================================

        preencherPerfil(
            perfil,
            usuario
        );


        definirMensagemPerfil(
            "",
            "normal"
        );


        console.log(
            "Meu Perfil carregado:",
            {
                perfil,
                usuario:
                    usuario.email
            }
        );

    }


    catch (erro) {

        console.error(
            "Erro ao carregar Meu Perfil:",
            erro
        );


        definirMensagemPerfil(
            "Não foi possível carregar seu perfil.",
            "erro"
        );

    }

}


// =====================================================
// PREENCHE CAMPOS
// =====================================================

function preencherPerfil(
    perfil,
    usuario
) {

    const nome =
        String(
            perfil.nome_exibicao
            || ""
        ).trim();


    const email =
        usuario.email
        || "";


    const papel =
        obterNomePapelPerfil(
            perfil.papel
        );


    const status =
        perfil.ativo === false
            ? "Inativo"
            : "Ativo";


    definirValorPerfil(
        "perfilNome",
        nome
    );


    definirValorPerfil(
        "perfilEmail",
        email
    );


    definirValorPerfil(
        "perfilFuncao",
        papel
    );


    definirValorPerfil(
        "perfilStatus",
        status
    );


    definirTextoPerfil(
        "perfilNomeTopo",
        nome || "Usuário"
    );


    definirTextoPerfil(
        "perfilEmailTopo",
        email
    );


    definirTextoPerfil(
        "perfilPapel",
        papel
    );


    atualizarAvatarIniciais(
        nome
    );

}


// =====================================================
// CONFIGURA EVENTOS
// =====================================================

function configurarEventosPerfil() {

    const botaoSalvar =
        document.getElementById(
            "btnSalvarPerfil"
        );


    if (botaoSalvar) {

        botaoSalvar.addEventListener(
            "click",
            salvarMeuPerfil
        );

    }


    const botaoAvatar =
        document.getElementById(
            "btnAlterarAvatar"
        );


    if (botaoAvatar) {

        botaoAvatar.addEventListener(
            "click",
            () => {

                alert(
                    "A alteração de foto será habilitada na próxima etapa."
                );

            }
        );

    }

}


// =====================================================
// SALVA PERFIL
// =====================================================

async function salvarMeuPerfil() {

    if (!perfilAtual) {

        alert(
            "Perfil ainda não carregado."
        );

        return;

    }


    const campoNome =
        document.getElementById(
            "perfilNome"
        );


    const botao =
        document.getElementById(
            "btnSalvarPerfil"
        );


    const novoNome =
        String(
            campoNome?.value
            || ""
        ).trim();


    // =============================================
    // VALIDAÇÃO
    // =============================================

    if (
        novoNome.length < 3
    ) {

        definirMensagemPerfil(
            "Informe um nome válido com pelo menos 3 caracteres.",
            "erro"
        );

        campoNome?.focus();

        return;

    }


    if (
        novoNome.length > 80
    ) {

        definirMensagemPerfil(
            "O nome deve ter no máximo 80 caracteres.",
            "erro"
        );

        return;

    }


    // =============================================
    // BOTÃO
    // =============================================

    if (botao) {

        botao.disabled =
            true;

        botao.textContent =
            "Salvando...";

    }


    definirMensagemPerfil(
        "Salvando alterações...",
        "normal"
    );


    try {

        const {
            data,
            error
        } =
            await supabaseClient

                .from(
                    "perfis_usuario"
                )

                .update({

                    nome_exibicao:
                        novoNome

                })

                .eq(
                    "id",
                    perfilAtual.id
                )

                .select(`
                    id,
                    auth_user_id,
                    funcionario_id,
                    nome_exibicao,
                    papel,
                    ativo,
                    created_at
                `)

                .single();


        if (error) {
            throw error;
        }


        perfilAtual =
            data;


        // Atualiza também o perfil global do layout
        window.perfilUsuarioAtual =
            data;


        preencherPerfil(
            data,
            usuarioAuthAtual
        );


        // Atualiza sidebar imediatamente
        if (
            typeof aplicarPerfilSidebar ===
            "function"
        ) {

            aplicarPerfilSidebar(
                data
            );

        }


        definirMensagemPerfil(
            "Perfil atualizado com sucesso.",
            "sucesso"
        );


        console.log(
            "Perfil atualizado:",
            data
        );

    }


    catch (erro) {

        console.error(
            "Erro ao salvar perfil:",
            erro
        );


        definirMensagemPerfil(
            "Não foi possível salvar as alterações.",
            "erro"
        );

    }


    finally {

        if (botao) {

            botao.disabled =
                false;

            botao.textContent =
                "Salvar alterações";

        }

    }

}


// =====================================================
// AVATAR COM INICIAIS
// =====================================================

function atualizarAvatarIniciais(
    nome
) {

    const avatar =
        document.getElementById(
            "perfilAvatar"
        );


    if (!avatar) {
        return;
    }


    const palavras =
        String(
            nome
            || "Usuário"
        )
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    let iniciais =
        "U";


    if (palavras.length === 1) {

        iniciais =
            palavras[0]
                .slice(0, 2)
                .toUpperCase();

    }


    else if (
        palavras.length >= 2
    ) {

        iniciais =
            (
                palavras[0][0]
                +
                palavras[
                    palavras.length - 1
                ][0]
            )
                .toUpperCase();

    }


    avatar.textContent =
        iniciais;

}


// =====================================================
// NOME AMIGÁVEL DO PAPEL
// =====================================================

function obterNomePapelPerfil(
    papel
) {

    const valor =
        String(
            papel
            || ""
        )
            .trim()
            .toLowerCase();


    switch (valor) {

        case "admin":
        case "administrador":

            return "Administrador";


        case "lider":

            return "Líder";


        case "colaborador":

            return "Colaborador";


        default:

            return "Usuário";

    }

}


// =====================================================
// HELPERS
// =====================================================

function definirTextoPerfil(
    id,
    valor
) {

    const elemento =
        document.getElementById(
            id
        );


    if (elemento) {

        elemento.textContent =
            valor;

    }

}


function definirValorPerfil(
    id,
    valor
) {

    const elemento =
        document.getElementById(
            id
        );


    if (elemento) {

        elemento.value =
            valor;

    }

}


// =====================================================
// MENSAGENS
// =====================================================

function definirMensagemPerfil(
    mensagem,
    tipo
) {

    const elemento =
        document.getElementById(
            "perfilMensagem"
        );


    if (!elemento) {
        return;
    }


    elemento.textContent =
        mensagem;


    switch (tipo) {

        case "sucesso":

            elemento.style.color =
                "#37d67a";

            break;


        case "erro":

            elemento.style.color =
                "#ff5d5d";

            break;


        default:

            elemento.style.color =
                "#8792a2";

    }

}