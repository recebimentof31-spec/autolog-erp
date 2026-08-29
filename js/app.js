// =====================================================
// GESTÃO DE DESEMPENHO
// AUTENTICAÇÃO DA TELA DE LOGIN
// =====================================================


const loginForm =
    document.getElementById(
        "loginForm"
    );


const emailInput =
    document.getElementById(
        "usuario"
    );


const senhaInput =
    document.getElementById(
        "senha"
    );


const entrarButton =
    document.getElementById(
        "entrar"
    );


const entrarTexto =
    document.getElementById(
        "entrarTexto"
    );


const mensagem =
    document.getElementById(
        "mensagem"
    );


const toggleSenhaButton =
    document.getElementById(
        "toggleSenha"
    );


const recuperarSenhaButton =
    document.getElementById(
        "recuperarSenha"
    );


// =====================================================
// MENSAGENS
// =====================================================


function mostrarMensagem(
    texto,
    tipo = "info"
) {

    if (!mensagem) {
        return;
    }


    mensagem.textContent =
        texto;


    mensagem.className =
        `login-message is-visible is-${tipo}`;

}


function limparMensagem() {

    if (!mensagem) {
        return;
    }


    mensagem.textContent =
        "";


    mensagem.className =
        "login-message";

}


// =====================================================
// ESTADO DE CARREGAMENTO
// =====================================================


function definirCarregamento(
    carregando,
    texto = "Entrando..."
) {

    if (!entrarButton) {
        return;
    }


    entrarButton.disabled =
        carregando;


    entrarButton.classList.toggle(
        "is-loading",
        carregando
    );


    if (entrarTexto) {

        entrarTexto.textContent =
            carregando
                ? texto
                : "Entrar no sistema";

    }


    if (emailInput) {

        emailInput.disabled =
            carregando;

    }


    if (senhaInput) {

        senhaInput.disabled =
            carregando;

    }

}


// =====================================================
// TRATAMENTO DE ERROS
// =====================================================


function obterMensagemErro(
    erro
) {

    const codigo =
        String(
            erro?.code || ""
        )
            .trim()
            .toLowerCase();


    const texto =
        String(
            erro?.message || ""
        )
            .trim()
            .toLowerCase();


    if (
        codigo === "invalid_credentials"
        ||
        texto.includes(
            "invalid login credentials"
        )
    ) {

        return "E-mail ou senha incorretos.";

    }


    if (
        codigo === "email_not_confirmed"
        ||
        texto.includes(
            "email not confirmed"
        )
    ) {

        return "Este e-mail ainda não foi confirmado.";

    }


    if (
        codigo === "over_request_rate_limit"
        ||
        codigo === "over_email_send_rate_limit"
        ||
        texto.includes(
            "rate limit"
        )
    ) {

        return "Muitas tentativas foram realizadas. Aguarde alguns minutos.";

    }


    if (
        texto.includes(
            "failed to fetch"
        )
        ||
        texto.includes(
            "network"
        )
    ) {

        return "Não foi possível conectar ao sistema. Verifique sua internet.";

    }


    return "Não foi possível acessar o sistema. Tente novamente.";

}


// =====================================================
// LOGIN
// =====================================================


async function login() {

    const email =
        emailInput?.value
            .trim()
            .toLowerCase()
        || "";


    const senha =
        senhaInput?.value
        || "";


    limparMensagem();


    if (
        !email
        ||
        !senha
    ) {

        mostrarMensagem(
            "Informe o e-mail e a senha.",
            "error"
        );


        if (!email) {

            emailInput?.focus();

        }

        else {

            senhaInput?.focus();

        }


        return;

    }


    if (
        !emailInput.checkValidity()
    ) {

        mostrarMensagem(
            "Informe um endereço de e-mail válido.",
            "error"
        );


        emailInput.focus();


        return;

    }


    definirCarregamento(
        true
    );


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .signInWithPassword({
                    email,
                    password: senha
                });


        if (error) {

            throw error;

        }


        if (
            !data?.session
        ) {

            throw new Error(
                "Sessão não criada."
            );

        }


        mostrarMensagem(
            "Acesso autorizado. Redirecionando...",
            "success"
        );


        window.location.replace(
            "dashboard.html"
        );

    }

    catch (erro) {

        console.error(
            "Erro ao realizar login:",
            erro
        );


        mostrarMensagem(
            obterMensagemErro(
                erro
            ),
            "error"
        );


        definirCarregamento(
            false
        );

    }

}


// =====================================================
// MOSTRAR E OCULTAR SENHA
// =====================================================


function alternarVisibilidadeSenha() {

    if (
        !senhaInput
        ||
        !toggleSenhaButton
    ) {

        return;

    }


    const senhaVisivel =
        senhaInput.type ===
        "text";


    senhaInput.type =
        senhaVisivel
            ? "password"
            : "text";


    toggleSenhaButton.textContent =
        senhaVisivel
            ? "Mostrar"
            : "Ocultar";


    toggleSenhaButton.setAttribute(
        "aria-label",
        senhaVisivel
            ? "Mostrar senha"
            : "Ocultar senha"
    );


    toggleSenhaButton.setAttribute(
        "aria-pressed",
        String(
            !senhaVisivel
        )
    );


    senhaInput.focus();

}


// =====================================================
// RECUPERAÇÃO DE SENHA
// =====================================================


async function recuperarSenha() {

    const email =
        emailInput?.value
            .trim()
            .toLowerCase()
        || "";


    limparMensagem();


    if (!email) {

        mostrarMensagem(
            "Informe seu e-mail para recuperar a senha.",
            "error"
        );


        emailInput?.focus();


        return;

    }


    if (
        !emailInput.checkValidity()
    ) {

        mostrarMensagem(
            "Informe um endereço de e-mail válido.",
            "error"
        );


        emailInput.focus();


        return;

    }


    recuperarSenhaButton.disabled =
        true;


    try {

        const destino =
            new URL(
                "perfil.html",
                window.location.href
            )
                .href;


        const {
            error
        } =
            await supabaseClient
                .auth
                .resetPasswordForEmail(
                    email,
                    {
                        redirectTo:
                            destino
                    }
                );


        if (error) {

            throw error;

        }


        mostrarMensagem(
            "Enviamos as instruções de recuperação para o e-mail informado.",
            "success"
        );

    }

    catch (erro) {

        console.error(
            "Erro ao solicitar recuperação de senha:",
            erro
        );


        mostrarMensagem(
            obterMensagemErro(
                erro
            ),
            "error"
        );

    }

    finally {

        recuperarSenhaButton.disabled =
            false;

    }

}


// =====================================================
// VERIFICAÇÃO DE SESSÃO
// =====================================================


async function verificarSessaoExistente() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .getSession();


        if (error) {

            throw error;

        }


        if (
            data?.session
        ) {

            window.location.replace(
                "dashboard.html"
            );

            return true;

        }


        return false;

    }

    catch (erro) {

        console.error(
            "Erro ao verificar sessão:",
            erro
        );


        mostrarMensagem(
            "Não foi possível verificar a sessão atual.",
            "error"
        );


        return false;

    }

}


// =====================================================
// EVENTOS
// =====================================================


document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const sessaoEncontrada =
            await verificarSessaoExistente();


        if (
            sessaoEncontrada
        ) {

            return;

        }


        emailInput?.focus();


        loginForm
            ?.addEventListener(
                "submit",
                event => {

                    event.preventDefault();

                    login();

                }
            );


        toggleSenhaButton
            ?.addEventListener(
                "click",
                alternarVisibilidadeSenha
            );


        recuperarSenhaButton
            ?.addEventListener(
                "click",
                recuperarSenha
            );

    }
);