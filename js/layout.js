// =====================================================
// PERFIL ATUAL DO USUÁRIO
// =====================================================

window.perfilUsuarioAtual = null;


// =====================================================
// CARREGA LAYOUT
// =====================================================

function carregarLayout(paginaAtiva = "") {

    const sidebar =
        document.getElementById(
            "appSidebar"
        );

    if (!sidebar) {
        return;

    }


    sidebar.innerHTML = `
    <a href="perfil.html"
       class="v2-user-profile ${paginaAtiva === "perfil" ? "active" : ""}"
       title="Meu Perfil">

        <div class="v2-user-avatar" id="sidebarUserAvatar">
            DB
        </div>

        <div class="v2-user-info">
            <strong id="sidebarUserName">Usuário</strong>
            <span id="sidebarUserRole">Carregando...</span>
        </div>

        <div class="v2-user-arrow">›</div>
    </a>

    <nav class="v2-menu">

            <a
                href="dashboard.html"
                class="${
                    paginaAtiva === "dashboard"
                        ? "active"
                        : ""
                }"
            >
                <span>▦</span>
Visão Geral
            </a>


            <a
                href="funcionarios.html"
                class="${
                    paginaAtiva === "funcionarios"
                        ? "active"
                        : ""
                }"
            >
                <span>♙</span>
                Funcionários
            </a>


            <a
                href="avaliacoes.html"
                class="${
                    paginaAtiva === "avaliacoes"
                        ? "active"
                        : ""
                }"
            >
                <span>✎</span>
                Avaliações
            </a>


            <a
                href="ranking.html"
                class="${
                    paginaAtiva === "ranking"
                        ? "active"
                        : ""
                }"
            >
                <span>♛</span>
                Ranking
            </a>


            <a
                href="relatorios.html"
                class="${
                    paginaAtiva === "relatorios"
                        ? "active"
                        : ""
                }"
            >
                <span>▥</span>
                Relatórios
            </a>

            <a
                href="configuracoes.html"
                id="menuConfiguracoes"
                class="${
                    paginaAtiva === "configuracoes"
                        ? "active"
                        : ""
                }"
            >
                <span>⚙</span>
                Configurações
            </a>

        </nav>


        <div class="v2-sidebar-bottom">


            <div class="v2-status">

                <span class="v2-status-dot"></span>

                <div>

                    <strong>
                        Sistema Online
                    </strong>

                    <small>
                        Supabase conectado
                    </small>

                </div>

            </div>

        </div>

    `;


   // Busca perfil e permissões após montar o layout
carregarPerfilUsuarioAtual();


}


// =====================================================
// CARREGA PERFIL DO USUÁRIO LOGADO
// =====================================================

async function carregarPerfilUsuarioAtual() {

    try {

        // =============================================
        // SESSÃO ATUAL
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

            console.warn(
                "Nenhum usuário autenticado."
            );


            aplicarPermissoesUsuario(
                null
            );

            return;
        }


        // =============================================
        // BUSCA PERFIL
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
    avatar_url
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

            console.warn(
                "Perfil do usuário não encontrado."
            );

            aplicarPerfilSidebar(
                null
            );

            aplicarPermissoesUsuario(
                null
            );

            return;
        }


        // =============================================
        // PERFIL INATIVO
        // =============================================

        if (
            perfil.ativo === false
        ) {

            alert(
                "Seu acesso ao sistema está desativado."
            );

            await supabaseClient
                .auth
                .signOut();

            window.location.href =
                "index.html";

            return;
        }


        // =============================================
        // GUARDA PERFIL GLOBALMENTE
        // =============================================

        window.perfilUsuarioAtual =
            perfil;


        console.log(
            "Perfil do usuário carregado:",
            perfil
        );


        // =============================================
        // ATUALIZA INTERFACE
        // =============================================

        aplicarPerfilSidebar(
            perfil
        );


        aplicarPermissoesUsuario(
            perfil
        );

    }

    catch (erro) {

        console.error(
            "Erro ao carregar perfil do usuário:",
            erro
        );


        aplicarPerfilSidebar(
            null
        );


        aplicarPermissoesUsuario(
            null
        );

    }

}


// =====================================================
// EXIBE USUÁRIO NA SIDEBAR
// =====================================================

function aplicarPerfilSidebar(perfil) {

    const nome =
        document.getElementById(
            "sidebarUserName"
        );

    const papel =
        document.getElementById(
            "sidebarUserRole"
        );

    const avatar =
        document.getElementById(
            "sidebarUserAvatar"
        );


    if (!nome || !papel || !avatar) {
        return;
    }


    if (!perfil) {

        nome.textContent =
            "Usuário";

        papel.textContent =
            "Perfil não identificado";

        avatar.textContent =
            "U";

        avatar.style.backgroundImage = "";
        avatar.style.backgroundSize = "";
        avatar.style.backgroundPosition = "";
        avatar.style.backgroundRepeat = "";

        return;
    }


    const nomeExibicao =
        String(
            perfil.nome_exibicao ||
            "Usuário"
        ).trim();


    nome.textContent =
        nomeExibicao;


    papel.textContent =
        obterNomePapel(
            perfil.papel
        );


    // =============================================
    // INICIAIS DO AVATAR
    // =============================================

    const partesNome =
        nomeExibicao
            .split(/\s+/)
            .filter(Boolean);


    let iniciais = "U";


    if (partesNome.length === 1) {

        iniciais =
            partesNome[0]
                .substring(0, 2)
                .toUpperCase();

    }


    if (partesNome.length >= 2) {

        iniciais =
            (
                partesNome[0][0]
                +
                partesNome[
                    partesNome.length - 1
                ][0]
            )
            .toUpperCase();

    }


    // =============================================
    // FOTO DO PERFIL NA SIDEBAR
    // =============================================

    if (perfil.avatar_url) {

        avatar.textContent = "";

        avatar.style.backgroundImage =
            `url("${perfil.avatar_url}")`;

        avatar.style.backgroundSize =
            "cover";

        avatar.style.backgroundPosition =
            "center";

        avatar.style.backgroundRepeat =
            "no-repeat";

    } else {

        avatar.style.backgroundImage = "";
        avatar.style.backgroundSize = "";
        avatar.style.backgroundPosition = "";
        avatar.style.backgroundRepeat = "";

        avatar.textContent =
            iniciais;

    }

}


// =====================================================
// EXIBE USUÁRIO NA SIDEBAR
// =====================================================


// =====================================================
// NOME AMIGÁVEL DO PERFIL
// =====================================================

function obterNomePapel(
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
// APLICA PERMISSÕES VISUAIS
// =====================================================

function aplicarPermissoesUsuario(
    perfil
) {

    const papel =
        String(
            perfil?.papel
            || ""
        )
            .trim()
            .toLowerCase();


    const ehAdmin =
        papel === "admin"
        ||
        papel === "administrador";


    // =============================================
    // CONFIGURAÇÕES
    // SOMENTE ADMIN
    // =============================================

    const menuConfiguracoes =
        document.getElementById(
            "menuConfiguracoes"
        );


    if (menuConfiguracoes) {

        menuConfiguracoes.style.display =
            ehAdmin
                ? ""
                : "none";

    }


    // =============================================
    // ATRIBUTOS GLOBAIS
    // =============================================

    document.body.dataset.papelUsuario =
        papel
        ||
        "nao_identificado";


    document.body.dataset.admin =
        ehAdmin
            ? "true"
            : "false";


    console.log(
        "Permissões aplicadas:",
        {
            papel,
            ehAdmin
        }
    );

}


// =====================================================
// HELPERS DE PERMISSÃO
// =====================================================

function usuarioEhAdmin() {

    const papel =
        String(
            window
                .perfilUsuarioAtual
                ?.papel
            || ""
        )
            .trim()
            .toLowerCase();


    return (
        papel === "admin"
        ||
        papel === "administrador"
    );

}


function usuarioEhLider() {

    const papel =
        String(
            window
                .perfilUsuarioAtual
                ?.papel
            || ""
        )
            .trim()
            .toLowerCase();


    return papel === "lider";

}

// =====================================================
// CARREGAR USUÁRIO CONECTADO NA SIDEBAR
// =====================================================

