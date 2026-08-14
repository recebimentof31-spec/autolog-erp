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

        <div class="v2-brand">

            <div class="v2-brand-icon">
                GD
            </div>

            <div>

                <strong>
                    Gestão
                </strong>

                <span>
                    Desempenho
                </span>

            </div>

        </div>


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
                Dashboard
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

            <a href="perfil.html"
   class="${paginaAtiva === "perfil" ? "active" : ""}">
    <span>👤</span>
    Meu Perfil
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

            <div
                id="usuarioLogadoSidebar"
                style="
                    margin-bottom: 16px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid rgba(255,255,255,.08);
                "
            >

                <small
                    style="
                        display:block;
                        opacity:.55;
                        margin-bottom:5px;
                    "
                >
                    Usuário conectado
                </small>

                <strong
                    id="sidebarNomeUsuario"
                    style="
                        display:block;
                        font-size:12px;
                    "
                >
                    Carregando...
                </strong>

                <small
                    id="sidebarPapelUsuario"
                    style="
                        display:block;
                        margin-top:3px;
                        color:#ff7518;
                        font-weight:700;
                    "
                >
                    ...
                </small>

            </div>


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


    // Busca permissões após montar o layout
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

            aplicarPerfilSidebar(
                null
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
                    ativo
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

function aplicarPerfilSidebar(
    perfil
) {

    const nome =
        document.getElementById(
            "sidebarNomeUsuario"
        );


    const papel =
        document.getElementById(
            "sidebarPapelUsuario"
        );


    if (!nome || !papel) {
        return;
    }


    if (!perfil) {

        nome.textContent =
            "Usuário";

        papel.textContent =
            "Perfil não identificado";

        return;
    }


    nome.textContent =
        perfil.nome_exibicao
        ||
        "Usuário";


    papel.textContent =
        obterNomePapel(
            perfil.papel
        );

}


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