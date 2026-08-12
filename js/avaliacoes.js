// =====================================================
// GESTÃO DE DESEMPENHO
// AVALIAÇÕES SEMANAIS - V2
// COM CADASTRO + CORREÇÃO DE AVALIAÇÃO
// =====================================================


// =====================================================
// CONFIGURAÇÃO
// =====================================================

let configuracaoAvaliacao = {
    pontuacaoMaxima: 100,
    notaMinima: 70
};


// Avaliação que já existe no banco.
// Se for null = nova avaliação.
// Se tiver ID = estamos corrigindo uma avaliação.
let avaliacaoExistenteId = null;


// Cache do perfil do avaliador logado.
let avaliadorAtualId = null;


// Evita consultas simultâneas ao trocar campos rapidamente.
let carregamentoAvaliacaoAtual = 0;


// =====================================================
// INICIALIZAÇÃO
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const logado =
            await verificarSessaoAvaliacao();

        if (!logado) {
            return;
        }

        await carregarConfiguracaoAvaliacao();

        await carregarFuncionarios();

        configurarSliders();

        configurarEventos();

        atualizarNota();

        atualizarSemanaResumo();

        atualizarEstadoBotao();

    }
);


// =====================================================
// VERIFICA SESSÃO
// =====================================================

async function verificarSessaoAvaliacao() {

    const {
        data,
        error
    } =
        await supabaseClient
            .auth
            .getSession();

    if (
        error
        ||
        !data?.session
    ) {

        window.location.href =
            "index.html";

        return false;
    }

    return true;
}


// =====================================================
// CARREGA CONFIGURAÇÕES
// =====================================================

async function carregarConfiguracaoAvaliacao() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient

                .from("configuracoes")

                .select(`
                    pontuacao_maxima,
                    nota_minima
                `)

                .limit(1)

                .maybeSingle();

        if (error) {
            throw error;
        }

        if (data) {

            configuracaoAvaliacao = {

                pontuacaoMaxima:
                    Number(
                        data.pontuacao_maxima
                    )
                    || 100,

                notaMinima:
                    Number(
                        data.nota_minima
                    )
                    || 70

            };

        }

        console.log(
            "Configuração da avaliação:",
            configuracaoAvaliacao
        );

    }

    catch (erro) {

        console.error(
            "Erro ao carregar configuração:",
            erro
        );

    }
}


// =====================================================
// CARREGA FUNCIONÁRIOS ATIVOS
// =====================================================

async function carregarFuncionarios() {

    const select =
        document.getElementById(
            "funcionario"
        );

    if (!select) {

        console.error(
            "Campo funcionario não encontrado."
        );

        return;
    }

    select.innerHTML = `
        <option value="">
            Carregando funcionários...
        </option>
    `;

    try {

        const {
            data,
            error
        } =
            await supabaseClient

                .from("funcionarios")

                .select(`
                    id,
                    nome,
                    matricula,
                    cargo,
                    setor,
                    status
                `)

                .eq(
                    "status",
                    "Ativo"
                )

                .order(
                    "nome",
                    {
                        ascending: true
                    }
                );

        if (error) {
            throw error;
        }

        select.innerHTML = `
            <option value="">
                Selecione um funcionário
            </option>
        `;

        const funcionarios =
            data || [];

        funcionarios.forEach(
            funcionario => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    funcionario.id;

                option.textContent =
                    `${funcionario.nome} - ${
                        funcionario.matricula
                        || "Sem matrícula"
                    }`;

                select.appendChild(
                    option
                );

            }
        );

        console.log(
            "Funcionários carregados:",
            funcionarios
        );

    }

    catch (erro) {

        console.error(
            "Erro ao carregar funcionários:",
            erro
        );

        select.innerHTML = `
            <option value="">
                Erro ao carregar funcionários
            </option>
        `;

    }
}


// =====================================================
// EVENTOS GERAIS
// =====================================================

function configurarEventos() {

    const botaoSalvar =
        document.getElementById(
            "salvarAvaliacao"
        );

    if (botaoSalvar) {

        botaoSalvar.addEventListener(
            "click",
            salvarAvaliacao
        );

    }


    const semana =
        document.getElementById(
            "semana"
        );

    if (semana) {

        semana.addEventListener(
            "change",
            async () => {

                atualizarSemanaResumo();

                await carregarAvaliacaoExistente();

            }
        );

    }


    const funcionario =
        document.getElementById(
            "funcionario"
        );

    if (funcionario) {

        funcionario.addEventListener(
            "change",
            async () => {

                await carregarAvaliacaoExistente();

            }
        );

    }
}


// =====================================================
// CONFIGURA SLIDERS
// =====================================================

function configurarSliders() {

    const sliders = [
        "produtividade",
        "prazo",
        "qualidade",
        "conhecimento",
        "proatividade",
        "trabalhoEquipe",
        "adaptabilidade",
        "responsabilidade"
    ];

    sliders.forEach(
        id => {

            const slider =
                document.getElementById(
                    id
                );

            if (!slider) {

                console.warn(
                    `Slider ${id} não encontrado.`
                );

                return;
            }

            slider.addEventListener(
                "input",
                atualizarNota
            );

        }
    );
}


// =====================================================
// SEMANA NO RESUMO
// =====================================================

function atualizarSemanaResumo() {

    const semana =
        document.getElementById(
            "semana"
        );

    const resumo =
        document.getElementById(
            "semanaResumo"
        );

    if (
        !semana
        ||
        !resumo
    ) {
        return;
    }

    resumo.textContent =
        `Semana ${semana.value}`;
}


// =====================================================
// CALCULA NOTA
// =====================================================

function atualizarNota() {

    const produtividade =
        obterValorSlider(
            "produtividade"
        );

    const prazo =
        obterValorSlider(
            "prazo"
        );

    const qualidade =
        obterValorSlider(
            "qualidade"
        );

    const conhecimento =
        obterValorSlider(
            "conhecimento"
        );

    const proatividade =
        obterValorSlider(
            "proatividade"
        );

    const trabalhoEquipe =
        obterValorSlider(
            "trabalhoEquipe"
        );

    const adaptabilidade =
        obterValorSlider(
            "adaptabilidade"
        );

    const responsabilidade =
        obterValorSlider(
            "responsabilidade"
        );


    atualizarValorVisual(
        "valorProdutividade",
        produtividade
    );

    atualizarValorVisual(
        "valorPrazo",
        prazo
    );

    atualizarValorVisual(
        "valorQualidade",
        qualidade
    );

    atualizarValorVisual(
        "valorConhecimento",
        conhecimento
    );

    atualizarValorVisual(
        "valorProatividade",
        proatividade
    );

    atualizarValorVisual(
        "valorTrabalhoEquipe",
        trabalhoEquipe
    );

    atualizarValorVisual(
        "valorAdaptabilidade",
        adaptabilidade
    );

    atualizarValorVisual(
        "valorResponsabilidade",
        responsabilidade
    );


    const nota =
        produtividade
        +
        prazo
        +
        qualidade
        +
        conhecimento
        +
        proatividade
        +
        trabalhoEquipe
        +
        adaptabilidade
        +
        responsabilidade;


    const notaFinal =
        document.getElementById(
            "notaFinal"
        );


    if (notaFinal) {

        notaFinal.textContent =
            nota;

    }


    atualizarClassificacao(
        nota
    );
}


// =====================================================
// VALOR DO SLIDER
// =====================================================

function obterValorSlider(id) {

    const elemento =
        document.getElementById(
            id
        );

    if (!elemento) {
        return 0;
    }

    return Number(
        elemento.value
        || 0
    );
}


// =====================================================
// DEFINE VALOR DO SLIDER
// =====================================================

function definirValorSlider(
    id,
    valor
) {

    const elemento =
        document.getElementById(
            id
        );

    if (!elemento) {
        return;
    }

    elemento.value =
        Number(
            valor || 0
        );
}


// =====================================================
// VALOR VISUAL
// =====================================================

function atualizarValorVisual(
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


// =====================================================
// CLASSIFICAÇÃO
// =====================================================

function obterClassificacao(nota) {

    const valor =
        Number(
            nota || 0
        );

    const pontuacaoMaxima =
        Number(
            configuracaoAvaliacao
                .pontuacaoMaxima
        )
        || 100;

    const notaMinima =
        Number(
            configuracaoAvaliacao
                .notaMinima
        )
        || 70;


    const limiteExcelente =
        pontuacaoMaxima * 0.90;

    const limiteMuitoBom =
        pontuacaoMaxima * 0.80;

    const limiteBom =
        notaMinima;

    const limiteAtencao =
        Math.max(
            0,
            notaMinima - 10
        );


    if (
        valor >=
        limiteExcelente
    ) {

        return "EXCELENTE";

    }


    if (
        valor >=
        limiteMuitoBom
    ) {

        return "MUITO BOM";

    }


    if (
        valor >=
        limiteBom
    ) {

        return "BOM";

    }


    if (
        valor >=
        limiteAtencao
    ) {

        return "ATENÇÃO";

    }


    return "CRÍTICO";
}


// =====================================================
// CLASSIFICAÇÃO VISUAL
// =====================================================

function atualizarClassificacao(nota) {

    const elemento =
        document.getElementById(
            "classificacaoFinal"
        );

    if (!elemento) {
        return;
    }


    const classificacao =
        obterClassificacao(
            nota
        );


    elemento.textContent =
        classificacao;


    elemento.className =
        "avaliacao-classificacao";


    switch (
        classificacao
    ) {

        case "EXCELENTE":

            elemento.classList.add(
                "excelente"
            );

            elemento.style.color =
                "#4ade80";

            break;


        case "MUITO BOM":

            elemento.classList.add(
                "muito-bom"
            );

            elemento.style.color =
                "#5c85ff";

            break;


        case "BOM":

            elemento.classList.add(
                "bom"
            );

            elemento.style.color =
                "#f5c451";

            break;


        case "ATENÇÃO":

            elemento.classList.add(
                "atencao"
            );

            elemento.style.color =
                "#ff7a1a";

            break;


        default:

            elemento.classList.add(
                "critico"
            );

            elemento.style.color =
                "#f87171";

            break;

    }
}


// =====================================================
// OBTÉM PERFIL DO AVALIADOR
// =====================================================

async function obterAvaliadorAtual() {

    if (avaliadorAtualId) {

        return avaliadorAtualId;

    }


    const {
        data: sessaoData,
        error: sessaoError
    } =
        await supabaseClient
            .auth
            .getSession();


    if (
        sessaoError
        ||
        !sessaoData?.session?.user?.id
    ) {

        throw (
            sessaoError
            ||
            new Error(
                "Usuário não autenticado."
            )
        );

    }


    const authUserId =
        sessaoData
            .session
            .user
            .id;


    const {
        data: perfil,
        error: perfilError
    } =
        await supabaseClient

            .from(
                "perfis_usuario"
            )

            .select("id")

            .eq(
                "auth_user_id",
                authUserId
            )

            .maybeSingle();


    if (
        perfilError
        ||
        !perfil
    ) {

        throw (
            perfilError
            ||
            new Error(
                "Perfil do avaliador não encontrado."
            )
        );

    }


    avaliadorAtualId =
        perfil.id;


    return avaliadorAtualId;
}


// =====================================================
// CALCULA PERÍODO DA SEMANA
// =====================================================

function calcularPeriodoSemana(
    semana
) {

    const hoje =
        new Date();


    const ano =
        hoje.getFullYear();


    const mes =
        hoje.getMonth();


    const primeiroDia =
        ((semana - 1) * 7)
        +
        1;


    const ultimoDiaMes =
        new Date(
            ano,
            mes + 1,
            0
        ).getDate();


    const ultimoDia =
        Math.min(
            primeiroDia + 6,
            ultimoDiaMes
        );


    return {

        ano:
            ano,

        mes:
            mes,

        competencia:
            formatarDataLocal(
                new Date(
                    ano,
                    mes,
                    1
                )
            ),

        periodoInicio:
            formatarDataLocal(
                new Date(
                    ano,
                    mes,
                    primeiroDia
                )
            ),

        periodoFim:
            formatarDataLocal(
                new Date(
                    ano,
                    mes,
                    ultimoDia
                )
            )

    };
}


// =====================================================
// CARREGA AVALIAÇÃO EXISTENTE
// =====================================================

async function carregarAvaliacaoExistente() {

    const funcionario =
        document.getElementById(
            "funcionario"
        );


    const campoSemana =
        document.getElementById(
            "semana"
        );


    avaliacaoExistenteId =
        null;


    atualizarEstadoBotao();


    if (
        !funcionario?.value
        ||
        !campoSemana?.value
    ) {

        resetarSlidersPadrao();

        return;

    }


    const funcionarioId =
        funcionario.value;


    const semana =
        Number(
            campoSemana.value
        );


    if (
        !semana
        ||
        semana < 1
        ||
        semana > 5
    ) {

        return;

    }


    const numeroCarregamento =
        ++carregamentoAvaliacaoAtual;


    try {

        const avaliadorId =
            await obterAvaliadorAtual();


        const {
            periodoInicio
        } =
            calcularPeriodoSemana(
                semana
            );


        const {
            data,
            error
        } =
            await supabaseClient

                .from(
                    "avaliacoes_semanais"
                )

                .select(`
                    id,
                    produtividade,
                    prazo,
                    qualidade,
                    conhecimento_tecnico,
                    proatividade,
                    trabalho_equipe,
                    adaptabilidade,
                    responsabilidade,
                    nota_final,
                    classificacao
                `)

                .eq(
                    "funcionario_id",
                    funcionarioId
                )

                .eq(
                    "avaliador_id",
                    avaliadorId
                )

                .eq(
                    "periodo_inicio",
                    periodoInicio
                )

                .maybeSingle();


        if (
            numeroCarregamento
            !==
            carregamentoAvaliacaoAtual
        ) {

            return;

        }


        if (error) {
            throw error;
        }


        if (!data) {

            avaliacaoExistenteId =
                null;


            resetarSlidersPadrao();


            atualizarEstadoBotao();


            return;
        }


        avaliacaoExistenteId =
            data.id;


        // =====================================
        // PREENCHE OS SLIDERS
        // =====================================

        definirValorSlider(
            "produtividade",
            data.produtividade
        );


        definirValorSlider(
            "prazo",
            data.prazo
        );


        definirValorSlider(
            "qualidade",
            data.qualidade
        );


        definirValorSlider(
            "conhecimento",
            data.conhecimento_tecnico
        );


        definirValorSlider(
            "proatividade",
            data.proatividade
        );


        definirValorSlider(
            "trabalhoEquipe",
            data.trabalho_equipe
        );


        definirValorSlider(
            "adaptabilidade",
            data.adaptabilidade
        );


        definirValorSlider(
            "responsabilidade",
            data.responsabilidade
        );


        atualizarNota();


        atualizarEstadoBotao();


        console.log(
            "Avaliação existente carregada:",
            data
        );

    }

    catch (erro) {

        console.error(
            "Erro ao verificar avaliação existente:",
            erro
        );


        avaliacaoExistenteId =
            null;


        resetarSlidersPadrao();


        atualizarEstadoBotao();

    }
}


// =====================================================
// RESETA SLIDERS PARA O VALOR MÁXIMO
// =====================================================

function resetarSlidersPadrao() {

    const ids = [
        "produtividade",
        "prazo",
        "qualidade",
        "conhecimento",
        "proatividade",
        "trabalhoEquipe",
        "adaptabilidade",
        "responsabilidade"
    ];


    ids.forEach(
        id => {

            const slider =
                document.getElementById(
                    id
                );


            if (!slider) {
                return;
            }


            slider.value =
                slider.max;

        }
    );


    atualizarNota();
}


// =====================================================
// TEXTO DO BOTÃO
// =====================================================

function atualizarEstadoBotao() {

    const botao =
        document.getElementById(
            "salvarAvaliacao"
        );


    if (!botao) {
        return;
    }


    if (avaliacaoExistenteId) {

        botao.textContent =
            "Atualizar Avaliação";

    }

    else {

        botao.textContent =
            "Salvar Avaliação";

    }
}


// =====================================================
// SALVAR / ATUALIZAR AVALIAÇÃO
// =====================================================

async function salvarAvaliacao() {

    const botao =
        document.getElementById(
            "salvarAvaliacao"
        );


    const funcionario =
        document.getElementById(
            "funcionario"
        );


    const campoSemana =
        document.getElementById(
            "semana"
        );


    if (
        !funcionario
        ||
        !funcionario.value
    ) {

        alert(
            "Selecione um funcionário."
        );

        return;
    }


    if (!campoSemana) {

        alert(
            "Campo de semana não encontrado."
        );

        return;
    }


    const funcionarioId =
        funcionario.value;


    const semana =
        Number(
            campoSemana.value
        );


    if (
        !semana
        ||
        semana < 1
        ||
        semana > 5
    ) {

        alert(
            "Semana inválida."
        );

        return;
    }


    // =================================================
    // CRITÉRIOS
    // =================================================

    const produtividade =
        obterValorSlider(
            "produtividade"
        );


    const prazo =
        obterValorSlider(
            "prazo"
        );


    const qualidade =
        obterValorSlider(
            "qualidade"
        );


    const conhecimento =
        obterValorSlider(
            "conhecimento"
        );


    const proatividade =
        obterValorSlider(
            "proatividade"
        );


    const trabalhoEquipe =
        obterValorSlider(
            "trabalhoEquipe"
        );


    const adaptabilidade =
        obterValorSlider(
            "adaptabilidade"
        );


    const responsabilidade =
        obterValorSlider(
            "responsabilidade"
        );


    const notaFinal =
        produtividade
        +
        prazo
        +
        qualidade
        +
        conhecimento
        +
        proatividade
        +
        trabalhoEquipe
        +
        adaptabilidade
        +
        responsabilidade;


    const classificacao =
        obterClassificacao(
            notaFinal
        );


    const {
        competencia,
        periodoInicio,
        periodoFim
    } =
        calcularPeriodoSemana(
            semana
        );


    let avaliadorId;


    try {

        avaliadorId =
            await obterAvaliadorAtual();

    }

    catch (erro) {

        console.error(
            "Erro ao identificar avaliador:",
            erro
        );


        alert(
            "Perfil do avaliador não encontrado."
        );


        return;
    }


    const avaliacao = {

        funcionario_id:
            funcionarioId,

        avaliador_id:
            avaliadorId,

        semana:
            semana,

        competencia:
            competencia,

        periodo_inicio:
            periodoInicio,

        periodo_fim:
            periodoFim,

        status:
            "enviada",

        produtividade:
            produtividade,

        prazo:
            prazo,

        qualidade:
            qualidade,

        conhecimento_tecnico:
            conhecimento,

        proatividade:
            proatividade,

        trabalho_equipe:
            trabalhoEquipe,

        adaptabilidade:
            adaptabilidade,

        responsabilidade:
            responsabilidade,

        nota_final:
            notaFinal,

        classificacao:
            classificacao

    };


    const estaAtualizando =
        Boolean(
            avaliacaoExistenteId
        );


    if (botao) {

        botao.disabled =
            true;


        botao.textContent =
            estaAtualizando
                ? "Atualizando..."
                : "Salvando...";

    }


    try {

        let data;
        let error;


        // =====================================
        // ATUALIZA REGISTRO EXISTENTE
        // =====================================

        if (estaAtualizando) {

            const resultado =
                await supabaseClient

                    .from(
                        "avaliacoes_semanais"
                    )

                    .update(
                        avaliacao
                    )

                    .eq(
                        "id",
                        avaliacaoExistenteId
                    )

                    .select();


            data =
                resultado.data;


            error =
                resultado.error;

        }


        // =====================================
        // CRIA NOVO REGISTRO
        // =====================================

        else {

            const resultado =
                await supabaseClient

                    .from(
                        "avaliacoes_semanais"
                    )

                    .insert([
                        avaliacao
                    ])

                    .select();


            data =
                resultado.data;


            error =
                resultado.error;

        }


        if (error) {
            throw error;
        }


        if (
            data?.[0]?.id
        ) {

            avaliacaoExistenteId =
                data[0].id;

        }


        atualizarEstadoBotao();


        console.log(
            estaAtualizando
                ? "Avaliação atualizada:"
                : "Avaliação salva:",
            data
        );


        alert(
            estaAtualizando

                ? (
                    "Avaliação atualizada com sucesso!\n\n"
                    +
                    `Nota: ${notaFinal}/100\n`
                    +
                    `Classificação: ${classificacao}`
                )

                : (
                    "Avaliação salva com sucesso!\n\n"
                    +
                    `Nota: ${notaFinal}/100\n`
                    +
                    `Classificação: ${classificacao}`
                )
        );

    }

    catch (erro) {

        console.error(
            "Erro ao salvar avaliação:",
            erro
        );


        // Segurança adicional contra duplicidade.
        if (
            erro?.code === "23505"
        ) {

            alert(
                "Já existe uma avaliação deste colaborador para esta semana. O sistema irá recarregar o registro existente."
            );


            await carregarAvaliacaoExistente();


            return;
        }


        alert(
            "Não foi possível salvar a avaliação.\n\n"
            +
            (
                erro?.message
                ||
                "Erro desconhecido."
            )
        );

    }

    finally {

        if (botao) {

            botao.disabled =
                false;


            atualizarEstadoBotao();

        }

    }
}


// =====================================================
// FORMATA DATA LOCAL
// YYYY-MM-DD
// =====================================================

function formatarDataLocal(data) {

    const ano =
        data.getFullYear();


    const mes =
        String(
            data.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const dia =
        String(
            data.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${ano}-${mes}-${dia}`;
}