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

    const botaoAlterarSenha =
    document.getElementById(
        "btnAlterarSenha"
    );

const modalAlterarSenha =
    document.getElementById(
        "modalAlterarSenha"
    );

const botaoFecharSenha =
    document.getElementById(
        "btnFecharModalSenha"
    );

const botaoCancelarSenha =
    document.getElementById(
        "btnCancelarSenha"
    );

const botaoSalvarSenha =
    document.getElementById(
        "btnSalvarSenha"
    );


if (
    botaoAlterarSenha &&
    modalAlterarSenha
) {

    botaoAlterarSenha.addEventListener(
        "click",
        () => {

            abrirModalSenha();

        }
    );

}


if (botaoFecharSenha) {

    botaoFecharSenha.addEventListener(
        "click",
        fecharModalSenha
    );

}


if (botaoCancelarSenha) {

    botaoCancelarSenha.addEventListener(
        "click",
        fecharModalSenha
    );

}


if (botaoSalvarSenha) {

    botaoSalvarSenha.addEventListener(
        "click",
        atualizarSenhaUsuario
    );

}


if (modalAlterarSenha) {

    modalAlterarSenha.addEventListener(
        "click",
        (evento) => {

            if (
                evento.target ===
                modalAlterarSenha
            ) {

                fecharModalSenha();

            }

        }
    );

}
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
                    avatar_url,
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


    atualizarAvatarPerfil(
    perfil.avatar_url,
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

    const botaoAvatar =
        document.getElementById(
            "btnAlterarAvatar"
        );

    const inputAvatar =
        document.getElementById(
            "inputAvatar"
        );


    // SALVAR PERFIL
    if (botaoSalvar) {

        botaoSalvar.addEventListener(
            "click",
            salvarMeuPerfil
        );

    }


    // ABRIR SELETOR DE FOTO
    if (
        botaoAvatar &&
        inputAvatar
    ) {

        botaoAvatar.addEventListener(
            "click",
            () => {

                inputAvatar.click();

            }
        );


        // FOTO SELECIONADA
        inputAvatar.addEventListener(
            "change",
            async () => {

                const arquivo =
                    inputAvatar.files?.[0];

                if (!arquivo) {
                    return;
                }


                await enviarAvatar(
                    arquivo
                );


                inputAvatar.value = "";

            }
        );

    }

}

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
                    avatar_url,
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

function atualizarAvatarPerfil(
    avatarUrl,
    nome
) {

    const avatar =
        document.getElementById(
            "perfilAvatar"
        );

    if (!avatar) {
        return;
    }

    // Limpa conteúdo anterior
    avatar.innerHTML = "";

    // Se existe foto, mostra a imagem
    if (avatarUrl) {

        const imagem =
            document.createElement(
                "img"
            );

        imagem.src =
            avatarUrl;

        imagem.alt =
            "Foto de perfil";

        imagem.style.width =
            "100%";

        imagem.style.height =
            "100%";

        imagem.style.objectFit =
            "cover";

        imagem.style.borderRadius =
            "50%";

        avatar.appendChild(
            imagem
        );

        return;
    }

    // Caso contrário, usa iniciais
    const palavras =
        String(
            nome || "Usuário"
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

    else if (palavras.length >= 2) {

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

// =====================================================
// ENVIA AVATAR PARA O SUPABASE
// =====================================================

async function enviarAvatar(arquivo) {

    if (!usuarioAuthAtual || !perfilAtual) {

        definirMensagemPerfil(
            "Usuário ainda não identificado.",
            "erro"
        );

        return;
    }


    // =================================================
    // TIPOS PERMITIDOS
    // =================================================

    const tiposPermitidos = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];


    if (!tiposPermitidos.includes(arquivo.type)) {

        definirMensagemPerfil(
            "Formato inválido. Selecione JPG, PNG ou WEBP.",
            "erro"
        );

        return;
    }


    // =================================================
    // LIMITE 2 MB
    // =================================================

    const tamanhoMaximo =
        2 * 1024 * 1024;


    if (arquivo.size > tamanhoMaximo) {

        definirMensagemPerfil(
            "A imagem deve ter no máximo 2 MB.",
            "erro"
        );

        return;
    }


    definirMensagemPerfil(
        "Enviando foto...",
        "normal"
    );


    try {

        // =================================================
        // EXTENSÃO
        // =================================================

        let extensao =
            arquivo.name
                .split(".")
                .pop()
                ?.toLowerCase();


        if (
            !["jpg", "jpeg", "png", "webp"]
                .includes(extensao)
        ) {

            extensao =
                arquivo.type === "image/png"
                    ? "png"
                    : arquivo.type === "image/webp"
                        ? "webp"
                        : "jpg";
        }


        // =================================================
        // CAMINHO
        //
        // avatars/
        //     auth-user-id/
        //         avatar.jpg
        // =================================================

        const caminho =
            `${usuarioAuthAtual.id}/avatar.${extensao}`;


        // =================================================
        // ENVIA PARA STORAGE
        // =================================================

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


        // =================================================
        // GERA URL PÚBLICA
        // =================================================

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
                "Não foi possível gerar a URL pública do avatar."
            );

        }


        // =================================================
        // EVITA CACHE DA FOTO ANTIGA
        // =================================================

        const avatarUrl =
            `${urlPublica}?v=${Date.now()}`;


        // =================================================
        // SALVA URL EM perfis_usuario
        // =================================================

        const {
            data: perfilAtualizado,
            error: erroPerfil
        } =
            await supabaseClient
                .from("perfis_usuario")
                .update({
                    avatar_url: avatarUrl
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
                    avatar_url,
                    created_at
                `)
                .single();


        if (erroPerfil) {
            throw erroPerfil;
        }


        // =================================================
        // ATUALIZA MEMÓRIA LOCAL
        // =================================================

        perfilAtual =
            perfilAtualizado;


        window.perfilUsuarioAtual =
            perfilAtualizado;


        // =================================================
        // ATUALIZA FOTO DA PÁGINA
        // =================================================

        atualizarAvatarPerfil(
            perfilAtualizado.avatar_url,
            perfilAtualizado.nome_exibicao
        );


        definirMensagemPerfil(
            "Foto atualizada com sucesso.",
            "sucesso"
        );


        console.log(
            "Avatar atualizado com sucesso:",
            perfilAtualizado.avatar_url
        );

    }


    catch (erro) {

        console.error(
            "Erro ao atualizar avatar:",
            erro
        );


        definirMensagemPerfil(
            "Não foi possível atualizar a foto.",
            "erro"
        );

    }

}

// =====================================================
// MODAL DE ALTERAÇÃO DE SENHA
// =====================================================

function abrirModalSenha() {

    const modal =
        document.getElementById(
            "modalAlterarSenha"
        );

    const novaSenha =
        document.getElementById(
            "novaSenha"
        );

    const confirmarSenha =
        document.getElementById(
            "confirmarNovaSenha"
        );

    const mensagem =
        document.getElementById(
            "senhaMensagem"
        );


    if (!modal) {
        return;
    }


    if (novaSenha) {
        novaSenha.value = "";
    }


    if (confirmarSenha) {
        confirmarSenha.value = "";
    }


    if (mensagem) {

        mensagem.textContent = "";

        mensagem.style.color =
            "#8792a2";

    }


    modal.classList.add(
        "aberto"
    );

    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    setTimeout(
        () => {

            novaSenha?.focus();

        },
        50
    );

}


// =====================================================
// FECHA MODAL
// =====================================================

function fecharModalSenha() {

    const modal =
        document.getElementById(
            "modalAlterarSenha"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "aberto"
    );

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

}


// =====================================================
// ATUALIZA SENHA
// =====================================================

async function atualizarSenhaUsuario() {

    const campoNovaSenha =
        document.getElementById(
            "novaSenha"
        );

    const campoConfirmacao =
        document.getElementById(
            "confirmarNovaSenha"
        );

    const botao =
        document.getElementById(
            "btnSalvarSenha"
        );

    const mensagem =
        document.getElementById(
            "senhaMensagem"
        );


    const novaSenha =
        String(
            campoNovaSenha?.value ||
            ""
        );


    const confirmarSenha =
        String(
            campoConfirmacao?.value ||
            ""
        );


    // =============================================
    // VALIDAÇÕES
    // =============================================

    if (novaSenha.length < 8) {

        definirMensagemSenha(
            "A senha deve ter pelo menos 8 caracteres.",
            "erro"
        );

        campoNovaSenha?.focus();

        return;

    }


    if (
        novaSenha !==
        confirmarSenha
    ) {

        definirMensagemSenha(
            "As senhas informadas não coincidem.",
            "erro"
        );

        campoConfirmacao?.focus();

        return;

    }


    try {

        if (botao) {

            botao.disabled =
                true;

            botao.textContent =
                "Atualizando...";

        }


        definirMensagemSenha(
            "Atualizando sua senha...",
            "normal"
        );


        const {
            error
        } =
            await supabaseClient
                .auth
                .updateUser({
                    password:
                        novaSenha
                });


        if (error) {
            throw error;
        }


        definirMensagemSenha(
            "Senha atualizada com sucesso.",
            "sucesso"
        );


        campoNovaSenha.value = "";
        campoConfirmacao.value = "";


        setTimeout(
            () => {

                fecharModalSenha();

            },
            1200
        );


        console.log(
            "Senha atualizada com sucesso."
        );

    }


    catch (erro) {

        console.error(
            "Erro ao atualizar senha:",
            erro
        );


        definirMensagemSenha(
            erro?.message ||
            "Não foi possível atualizar a senha.",
            "erro"
        );

    }


    finally {

        if (botao) {

            botao.disabled =
                false;

            botao.textContent =
                "Atualizar senha";

        }

    }

}


// =====================================================
// MENSAGEM DO MODAL
// =====================================================

function definirMensagemSenha(
    mensagem,
    tipo
) {

    const elemento =
        document.getElementById(
            "senhaMensagem"
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

// =====================================================
// MOSTRAR / OCULTAR SENHA
// =====================================================

document.querySelectorAll(".senha-toggle").forEach((botao) => {

    botao.addEventListener("click", () => {

        const targetId = botao.dataset.target;
        const campoSenha = document.getElementById(targetId);

        if (!campoSenha) {
            return;
        }

        const senhaVisivel = campoSenha.type === "text";

        campoSenha.type = senhaVisivel
            ? "password"
            : "text";

        botao.textContent = senhaVisivel
            ? "👁"
            : "🙈";

        botao.setAttribute(
            "aria-label",
            senhaVisivel
                ? "Mostrar senha"
                : "Ocultar senha"
        );

        botao.setAttribute(
            "title",
            senhaVisivel
                ? "Mostrar senha"
                : "Ocultar senha"
        );

    });

});

// =====================================================
// BOTÃO DE EDIÇÃO DO AVATAR
// =====================================================

const btnEditarAvatar =
    document.getElementById("btnEditarAvatar");

const inputAvatarPerfil =
    document.getElementById("inputAvatar");

if (btnEditarAvatar && inputAvatarPerfil) {

    btnEditarAvatar.addEventListener("click", (event) => {

        event.stopPropagation();

        inputAvatarPerfil.click();

    });

}

// =====================================================
// VISUALIZAÇÃO AMPLIADA DA FOTO
// =====================================================

const avatarPerfil =
    document.getElementById(
        "perfilAvatar"
    );

const modalFotoPerfil =
    document.getElementById(
        "modalFotoPerfil"
    );

const fotoPerfilAmpliada =
    document.getElementById(
        "fotoPerfilAmpliada"
    );

const fotoPerfilNome =
    document.getElementById(
        "fotoPerfilNome"
    );

const btnFecharFotoPerfil =
    document.getElementById(
        "btnFecharFotoPerfil"
    );


function abrirFotoPerfil() {

    if (
        !perfilAtual?.avatar_url ||
        !modalFotoPerfil ||
        !fotoPerfilAmpliada
    ) {
        return;
    }


    fotoPerfilAmpliada.src =
        perfilAtual.avatar_url;


    if (fotoPerfilNome) {

        fotoPerfilNome.textContent =
            perfilAtual.nome_exibicao ||
            "Usuário";

    }


    modalFotoPerfil.classList.add(
        "aberto"
    );

    modalFotoPerfil.setAttribute(
        "aria-hidden",
        "false"
    );

}


function fecharFotoPerfil() {

    if (!modalFotoPerfil) {
        return;
    }


    modalFotoPerfil.classList.remove(
        "aberto"
    );

    modalFotoPerfil.setAttribute(
        "aria-hidden",
        "true"
    );

}


if (avatarPerfil) {

    avatarPerfil.addEventListener(
        "click",
        abrirFotoPerfil
    );

}


if (btnFecharFotoPerfil) {

    btnFecharFotoPerfil.addEventListener(
        "click",
        fecharFotoPerfil
    );

}


if (modalFotoPerfil) {

    modalFotoPerfil.addEventListener(
        "click",
        (evento) => {

            if (
                evento.target ===
                modalFotoPerfil
            ) {

                fecharFotoPerfil();

            }

        }
    );

}
