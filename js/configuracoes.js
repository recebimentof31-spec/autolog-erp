// =====================================================
// CONFIGURAÇÕES V2
// Gestão de Desempenho
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    carregarConfiguracoes();

    configurarEventos();

});


// =====================================================
// CHAVE DE ARMAZENAMENTO
// =====================================================

const CONFIG_STORAGE_KEY =
    "gestao-desempenho-config-v2";


// =====================================================
// CONFIGURAÇÃO PADRÃO
// =====================================================

function configuracaoPadrao() {

    return {

        empresa: {
            nome: "Gestão de Desempenho",
            setor: "Recebimento",
            responsavel: "",
            email: ""
        },

        avaliacao: {
            pontuacaoMaxima: 100,
            periodicidade: "semanal",
            semanasMes: 4,
            notaMinima: 70
        },

        preferencias: {
            confirmarExclusao: true,
            mostrarInativos: false,
            destacarCriticos: true
        }

    };
}


// =====================================================
// OBTÉM CONFIGURAÇÕES SALVAS
// =====================================================

function obterConfiguracoes() {

    try {

        const salvo =
            localStorage.getItem(
                CONFIG_STORAGE_KEY
            );


        if (!salvo) {

            return configuracaoPadrao();

        }


        const dados =
            JSON.parse(salvo);


        return mesclarConfiguracoes(
            configuracaoPadrao(),
            dados
        );

    }

    catch (erro) {

        console.error(
            "Erro ao carregar configurações:",
            erro
        );


        return configuracaoPadrao();

    }

}


// =====================================================
// MESCLA CONFIGURAÇÃO PADRÃO + SALVA
// =====================================================

function mesclarConfiguracoes(
    padrao,
    salvo
) {

    return {

        empresa: {
            ...padrao.empresa,
            ...(salvo?.empresa || {})
        },

        avaliacao: {
            ...padrao.avaliacao,
            ...(salvo?.avaliacao || {})
        },

        preferencias: {
            ...padrao.preferencias,
            ...(salvo?.preferencias || {})
        }

    };

}


// =====================================================
// CARREGA CONFIGURAÇÕES NA TELA
// =====================================================

function carregarConfiguracoes() {

    const config =
        obterConfiguracoes();


    // -----------------------------------------
    // EMPRESA
    // -----------------------------------------

    definirValor(
        "configEmpresa",
        config.empresa.nome
    );


    definirValor(
        "configSetor",
        config.empresa.setor
    );


    definirValor(
        "configResponsavel",
        config.empresa.responsavel
    );


    definirValor(
        "configEmail",
        config.empresa.email
    );


    // -----------------------------------------
    // AVALIAÇÃO
    // -----------------------------------------

    definirValor(
        "configPontuacaoMaxima",
        config.avaliacao.pontuacaoMaxima
    );


    definirValor(
        "configPeriodicidade",
        config.avaliacao.periodicidade
    );


    definirValor(
        "configSemanasMes",
        config.avaliacao.semanasMes
    );


    definirValor(
        "configNotaMinima",
        config.avaliacao.notaMinima
    );


    // -----------------------------------------
    // PREFERÊNCIAS
    // -----------------------------------------

    definirCheckbox(
        "configConfirmarExclusao",
        config.preferencias.confirmarExclusao
    );


    definirCheckbox(
        "configMostrarInativos",
        config.preferencias.mostrarInativos
    );


    definirCheckbox(
        "configDestacarCriticos",
        config.preferencias.destacarCriticos
    );

}


// =====================================================
// CONFIGURA EVENTOS
// =====================================================

function configurarEventos() {

    const botaoSalvar =
        document.getElementById(
            "btnSalvarConfiguracoes"
        );


    if (botaoSalvar) {

        botaoSalvar.addEventListener(
            "click",
            salvarConfiguracoes
        );

    }

}


// =====================================================
// SALVA CONFIGURAÇÕES
// =====================================================

function salvarConfiguracoes() {

    const botao =
        document.getElementById(
            "btnSalvarConfiguracoes"
        );


    if (botao) {

        botao.disabled = true;

        botao.textContent =
            "Salvando...";

    }


    try {

        const configuracoes = {

            empresa: {

                nome:
                    obterValor(
                        "configEmpresa"
                    )
                    ||
                    "Gestão de Desempenho",

                setor:
                    obterValor(
                        "configSetor"
                    ),

                responsavel:
                    obterValor(
                        "configResponsavel"
                    ),

                email:
                    obterValor(
                        "configEmail"
                    )

            },


            avaliacao: {

                pontuacaoMaxima:
                    Number(
                        obterValor(
                            "configPontuacaoMaxima"
                        )
                    )
                    || 100,

                periodicidade:
                    obterValor(
                        "configPeriodicidade"
                    )
                    || "semanal",

                semanasMes:
                    Number(
                        obterValor(
                            "configSemanasMes"
                        )
                    )
                    || 4,

                notaMinima:
                    Number(
                        obterValor(
                            "configNotaMinima"
                        )
                    )
                    || 70

            },


            preferencias: {

                confirmarExclusao:
                    obterCheckbox(
                        "configConfirmarExclusao"
                    ),

                mostrarInativos:
                    obterCheckbox(
                        "configMostrarInativos"
                    ),

                destacarCriticos:
                    obterCheckbox(
                        "configDestacarCriticos"
                    )

            }

        };


        // -----------------------------------------
        // VALIDAÇÕES
        // -----------------------------------------

        if (
            configuracoes.avaliacao
                .pontuacaoMaxima <= 0
            ||
            configuracoes.avaliacao
                .pontuacaoMaxima > 100
        ) {

            mostrarMensagem(
                "A pontuação máxima deve estar entre 1 e 100.",
                "erro"
            );

            return;

        }


        if (
            configuracoes.avaliacao
                .notaMinima < 0
            ||
            configuracoes.avaliacao
                .notaMinima >
            configuracoes.avaliacao
                .pontuacaoMaxima
        ) {

            mostrarMensagem(
                "A nota mínima deve estar dentro da pontuação máxima.",
                "erro"
            );

            return;

        }


        // -----------------------------------------
        // SALVA
        // -----------------------------------------

        localStorage.setItem(
            CONFIG_STORAGE_KEY,
            JSON.stringify(
                configuracoes
            )
        );


        console.log(
            "Configurações salvas:",
            configuracoes
        );


        mostrarMensagem(
            "Configurações salvas com sucesso.",
            "sucesso"
        );

    }

    catch (erro) {

        console.error(
            "Erro ao salvar configurações:",
            erro
        );


        mostrarMensagem(
            "Não foi possível salvar as configurações.",
            "erro"
        );

    }

    finally {

        if (botao) {

            setTimeout(() => {

                botao.disabled =
                    false;

                botao.textContent =
                    "Salvar alterações";

            }, 500);

        }

    }

}


// =====================================================
// MENSAGEM
// =====================================================

function mostrarMensagem(
    texto,
    tipo = "sucesso"
) {

    const elemento =
        document.getElementById(
            "configMensagem"
        );


    if (!elemento) {

        return;

    }


    elemento.textContent =
        texto;


    elemento.classList.remove(
        "sucesso",
        "erro",
        "visivel"
    );


    elemento.classList.add(
        tipo,
        "visivel"
    );


    setTimeout(() => {

        elemento.classList.remove(
            "visivel"
        );

    }, 3500);

}


// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function obterValor(id) {

    const elemento =
        document.getElementById(id);


    if (!elemento) {

        return "";

    }


    return String(
        elemento.value || ""
    ).trim();

}


function definirValor(
    id,
    valor
) {

    const elemento =
        document.getElementById(id);


    if (elemento) {

        elemento.value =
            valor ?? "";

    }

}


function obterCheckbox(id) {

    const elemento =
        document.getElementById(id);


    return Boolean(
        elemento?.checked
    );

}


function definirCheckbox(
    id,
    valor
) {

    const elemento =
        document.getElementById(id);


    if (elemento) {

        elemento.checked =
            Boolean(valor);

    }

}


// =====================================================
// EXPÕE CONFIGURAÇÃO PARA OUTRAS PÁGINAS
// =====================================================

window.obterConfiguracoesSistema =
    obterConfiguracoes;