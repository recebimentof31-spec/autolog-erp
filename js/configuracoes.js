// =====================================================
// CONFIGURAÇÕES V2 - SUPABASE
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {

    await carregarConfiguracoesSupabase();

    configurarEventosConfiguracoes();

});

let configuracaoId = null;


// =====================================================
// CARREGA CONFIGURAÇÕES DO SUPABASE
// =====================================================

async function carregarConfiguracoesSupabase() {

    try {

        const { data, error } = await supabaseClient
            .from("configuracoes")
            .select(`
                id,
                nome_empresa,
                setor_principal,
                responsavel,
                email,
                pontuacao_maxima,
                periodicidade,
                semanas_mes,
                nota_minima,
                confirmar_exclusao,
                mostrar_inativos,
                destacar_criticos
            `)
            .limit(1)
            .maybeSingle();


        if (error) {

            throw error;

        }


        if (!data) {

            mostrarMensagemConfiguracoes(
                "Nenhuma configuração encontrada no banco.",
                "erro"
            );

            return;

        }


        configuracaoId =
            data.id;


        preencherCampo(
            "configEmpresa",
            data.nome_empresa
        );


        preencherCampo(
            "configSetor",
            data.setor_principal
        );


        preencherCampo(
            "configResponsavel",
            data.responsavel
        );


        preencherCampo(
            "configEmail",
            data.email
        );


        preencherCampo(
            "configPontuacaoMaxima",
            data.pontuacao_maxima
        );


        preencherCampo(
            "configPeriodicidade",
            data.periodicidade
        );


        preencherCampo(
            "configSemanasMes",
            data.semanas_mes
        );


        preencherCampo(
            "configNotaMinima",
            data.nota_minima
        );


        preencherCheckbox(
            "configConfirmarExclusao",
            data.confirmar_exclusao
        );


        preencherCheckbox(
            "configMostrarInativos",
            data.mostrar_inativos
        );


        preencherCheckbox(
            "configDestacarCriticos",
            data.destacar_criticos
        );


        console.log(
            "Configurações carregadas do Supabase:",
            data
        );

    }

    catch (erro) {

        console.error(
            "Erro ao carregar configurações:",
            erro
        );


        mostrarMensagemConfiguracoes(
            "Não foi possível carregar as configurações.",
            "erro"
        );

    }

}


// =====================================================
// EVENTOS
// =====================================================

function configurarEventosConfiguracoes() {

    const botao =
        document.getElementById(
            "btnSalvarConfiguracoes"
        );


    if (!botao) {

        return;

    }


    botao.addEventListener(
        "click",
        salvarConfiguracoesSupabase
    );

}


// =====================================================
// SALVA CONFIGURAÇÕES NO SUPABASE
// =====================================================

async function salvarConfiguracoesSupabase() {

    const botao =
        document.getElementById(
            "btnSalvarConfiguracoes"
        );


    if (!configuracaoId) {

        mostrarMensagemConfiguracoes(
            "Registro de configuração não localizado.",
            "erro"
        );

        return;

    }


    const dados = {

        nome_empresa:
            obterCampo(
                "configEmpresa"
            )
            || "Gestão de Desempenho",

        setor_principal:
            obterCampo(
                "configSetor"
            ),

        responsavel:
            obterCampo(
                "configResponsavel"
            )
            || null,

        email:
            obterCampo(
                "configEmail"
            )
            || null,

        pontuacao_maxima:
            Number(
                obterCampo(
                    "configPontuacaoMaxima"
                )
            ),

        periodicidade:
            obterCampo(
                "configPeriodicidade"
            ),

        semanas_mes:
            Number(
                obterCampo(
                    "configSemanasMes"
                )
            ),

        nota_minima:
            Number(
                obterCampo(
                    "configNotaMinima"
                )
            ),

        confirmar_exclusao:
            obterCheckbox(
                "configConfirmarExclusao"
            ),

        mostrar_inativos:
            obterCheckbox(
                "configMostrarInativos"
            ),

        destacar_criticos:
            obterCheckbox(
                "configDestacarCriticos"
            ),

        updated_at:
            new Date().toISOString()

    };


    // =================================================
    // VALIDAÇÕES
    // =================================================

    if (
        dados.pontuacao_maxima < 1
        ||
        dados.pontuacao_maxima > 100
    ) {

        mostrarMensagemConfiguracoes(
            "A pontuação máxima deve estar entre 1 e 100.",
            "erro"
        );

        return;

    }


    if (
        dados.nota_minima < 0
        ||
        dados.nota_minima >
        dados.pontuacao_maxima
    ) {

        mostrarMensagemConfiguracoes(
            "A nota mínima deve estar entre 0 e a pontuação máxima.",
            "erro"
        );

        return;

    }


    try {

        if (botao) {

            botao.disabled =
                true;

            botao.textContent =
                "Salvando...";

        }


        const { data, error } =
            await supabaseClient
                .from("configuracoes")
                .update(dados)
                .eq(
                    "id",
                    configuracaoId
                )
                .select()
                .single();


        if (error) {

            throw error;

        }


        console.log(
            "Configurações atualizadas:",
            data
        );


        mostrarMensagemConfiguracoes(
            "Configurações salvas na nuvem com sucesso.",
            "sucesso"
        );

    }

    catch (erro) {

        console.error(
            "Erro ao salvar configurações:",
            erro
        );


        mostrarMensagemConfiguracoes(
            "Não foi possível salvar as configurações no Supabase.",
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

            }, 400);

        }

    }

}


// =====================================================
// CAMPOS
// =====================================================

function obterCampo(id) {

    const elemento =
        document.getElementById(id);


    if (!elemento) {

        return "";

    }


    return String(
        elemento.value ?? ""
    ).trim();

}


function preencherCampo(
    id,
    valor
) {

    const elemento =
        document.getElementById(id);


    if (!elemento) {

        return;

    }


    elemento.value =
        valor ?? "";

}


// =====================================================
// CHECKBOXES
// =====================================================

function obterCheckbox(id) {

    const elemento =
        document.getElementById(id);


    return Boolean(
        elemento?.checked
    );

}


function preencherCheckbox(
    id,
    valor
) {

    const elemento =
        document.getElementById(id);


    if (!elemento) {

        return;

    }


    elemento.checked =
        Boolean(valor);

}


// =====================================================
// MENSAGENS
// =====================================================

function mostrarMensagemConfiguracoes(
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