let configuracaoAvaliacao = {
    pontuacaoMaxima: 100,
    notaMinima: 70
};
document.addEventListener("DOMContentLoaded", async () => {
    await carregarConfiguracaoAvaliacao();
    await carregarFuncionarios();
    configurarSliders();
    atualizarNota();
    configurarEventos();
});
async function carregarConfiguracaoAvaliacao() {

    try {

        const { data, error } = await supabaseClient
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
                    Number(data.pontuacao_maxima) || 100,

                notaMinima:
                    Number(data.nota_minima) || 70
            };

        }

        console.log(
            "Configuração da avaliação carregada:",
            configuracaoAvaliacao
        );

    }

    catch (erro) {

        console.error(
            "Erro ao carregar configuração da avaliação:",
            erro
        );

    }

}

// =====================================================
// CARREGA FUNCIONÁRIOS ATIVOS
// =====================================================

async function carregarFuncionarios() {
    const select = document.getElementById("funcionario");

    if (!select) {
        console.error("Campo funcionario não encontrado.");
        return;
    }

    select.innerHTML =
        '<option value="">Carregando...</option>';

    const { data, error } = await supabaseClient
        .from("funcionarios")
        .select("id, nome, matricula, cargo, setor, status")
        .eq("status", "Ativo")
        .order("nome", { ascending: true });

    if (error) {
        console.error(
            "Erro ao carregar funcionários:",
            error
        );

        select.innerHTML =
            '<option value="">Erro ao carregar funcionários</option>';

        return;
    }

    select.innerHTML =
        '<option value="">Selecione um funcionário</option>';

    data.forEach(funcionario => {
        const option =
            document.createElement("option");

        option.value =
            funcionario.id;

        option.textContent =
            `${funcionario.nome} - ${funcionario.matricula || "Sem matrícula"}`;

        select.appendChild(option);
    });

    console.log(
        "Funcionários carregados:",
        data
    );
}


// =====================================================
// CONFIGURA EVENTOS GERAIS
// =====================================================

function configurarEventos() {
    const botaoSalvar =
        document.getElementById("salvar");

    if (botaoSalvar) {
        botaoSalvar.addEventListener(
            "click",
            salvarAvaliacao
        );
    }

    const semana =
        document.getElementById("semana");

    if (semana) {
        semana.addEventListener(
            "change",
            atualizarSemanaResultado
        );

        atualizarSemanaResultado();
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
        "conhecimentoTecnico",
        "proatividade",
        "trabalhoEquipe",
        "adaptabilidade",
        "responsabilidade"
    ];

    sliders.forEach(id => {
        const slider =
            document.getElementById(id);

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
    });
}


// =====================================================
// ATUALIZA SEMANA NO CARD RESULTADO
// =====================================================

function atualizarSemanaResultado() {
    const semana =
        document.getElementById("semana");

    const resultadoSemana =
        document.getElementById("resultadoSemana");

    if (
        semana &&
        resultadoSemana
    ) {
        resultadoSemana.textContent =
            semana.value;
    }
}


// =====================================================
// CALCULA A NOTA
// =====================================================

function atualizarNota() {
    const produtividade =
        obterValorSlider("produtividade");

    const prazo =
        obterValorSlider("prazo");

    const qualidade =
        obterValorSlider("qualidade");

    const conhecimentoTecnico =
        obterValorSlider("conhecimentoTecnico");

    const proatividade =
        obterValorSlider("proatividade");

    const trabalhoEquipe =
        obterValorSlider("trabalhoEquipe");

    const adaptabilidade =
        obterValorSlider("adaptabilidade");

    const responsabilidade =
        obterValorSlider("responsabilidade");


    atualizarValorVisual(
        "produtividadeValor",
        produtividade
    );

    atualizarValorVisual(
        "prazoValor",
        prazo
    );

    atualizarValorVisual(
        "qualidadeValor",
        qualidade
    );

    atualizarValorVisual(
        "conhecimentoTecnicoValor",
        conhecimentoTecnico
    );

    atualizarValorVisual(
        "proatividadeValor",
        proatividade
    );

    atualizarValorVisual(
        "trabalhoEquipeValor",
        trabalhoEquipe
    );

    atualizarValorVisual(
        "adaptabilidadeValor",
        adaptabilidade
    );

    atualizarValorVisual(
        "responsabilidadeValor",
        responsabilidade
    );


    const nota =
        produtividade +
        prazo +
        qualidade +
        conhecimentoTecnico +
        proatividade +
        trabalhoEquipe +
        adaptabilidade +
        responsabilidade;


    const notaFinal =
        document.getElementById("notaFinal");

    if (notaFinal) {
        notaFinal.textContent =
            nota;
    }


    atualizarClassificacao(nota);
}


// =====================================================
// PEGA VALOR DO SLIDER
// =====================================================

function obterValorSlider(id) {
    const elemento =
        document.getElementById(id);

    if (!elemento) {
        return 0;
    }

    return Number(
        elemento.value
    );
}


// =====================================================
// ATUALIZA VALOR AO LADO DO SLIDER
// =====================================================

function atualizarValorVisual(
    id,
    valor
) {
    const elemento =
        document.getElementById(id);

    if (elemento) {
        elemento.textContent =
            valor;
    }
}


// =====================================================
// CLASSIFICAÇÃO
// =====================================================

function atualizarClassificacao(nota) {

    const classificacao =
        document.getElementById("classificacao");

    if (!classificacao) {
        return;
    }

    const pontuacaoMaxima =
        Number(configuracaoAvaliacao.pontuacaoMaxima) || 100;

    const notaMinima =
        Number(configuracaoAvaliacao.notaMinima) || 70;

    const limiteExcelente = pontuacaoMaxima * 0.90;
    const limiteMuitoBom = pontuacaoMaxima * 0.80;
    const limiteBom = notaMinima;
    const limiteAtencao = Math.max(0, notaMinima - 10);

    if (nota >= limiteExcelente) {

        classificacao.textContent = "🟢 EXCELENTE";
        classificacao.style.color = "#35c979";

    } else if (nota >= limiteMuitoBom) {

        classificacao.textContent = "🔵 MUITO BOM";
        classificacao.style.color = "#5c85ff";

    } else if (nota >= limiteBom) {

        classificacao.textContent = "🟡 BOM";
        classificacao.style.color = "#f5c451";

    } else if (nota >= limiteAtencao) {

        classificacao.textContent = "🟠 ATENÇÃO";
        classificacao.style.color = "#ff7518";

    } else {

        classificacao.textContent = "🔴 CRÍTICO";
        classificacao.style.color = "#ef5350";

    }
}


// =====================================================
// RETORNA CLASSIFICAÇÃO EM TEXTO
// =====================================================

function obterClassificacao(nota) {
    if (nota >= 90) {
        return "EXCELENTE";
    }

    if (nota >= 80) {
        return "MUITO BOM";
    }

    if (nota >= 70) {
        return "BOM";
    }

    if (nota >= 60) {
        return "ATENÇÃO";
    }

    return "CRÍTICO";
}


// =====================================================
// SALVA A AVALIAÇÃO NO SUPABASE
// =====================================================

async function salvarAvaliacao() {
    const botao =
        document.getElementById("salvar");

    const funcionario =
        document.getElementById(
            "funcionario"
        );

    const campoSemana =
        document.getElementById(
            "semana"
        );


    if (
        !funcionario ||
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

    const semanaTexto =
        campoSemana.value;


    const semana =
        Number(
            semanaTexto.replace(
                /\D/g,
                ""
            )
        );


    if (
        !semana ||
        semana < 1 ||
        semana > 5
    ) {
        alert(
            "Semana inválida."
        );

        return;
    }


    // =========================================
    // NOTAS
    // =========================================

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

    const conhecimentoTecnico =
        obterValorSlider(
            "conhecimentoTecnico"
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


    // =========================================
    // NOTA FINAL
    // =========================================

    const notaFinal =
        produtividade +
        prazo +
        qualidade +
        conhecimentoTecnico +
        proatividade +
        trabalhoEquipe +
        adaptabilidade +
        responsabilidade;


    const classificacao =
        obterClassificacao(
            notaFinal
        );


    // =========================================
    // DATA / COMPETÊNCIA
    // =========================================

    const hoje =
        new Date();

    const ano =
        hoje.getFullYear();

    const mes =
        hoje.getMonth();


    const competencia =
        formatarDataLocal(
            new Date(
                ano,
                mes,
                1
            )
        );


    // =========================================
    // PERÍODO DA SEMANA
    // =========================================

    const primeiroDia =
        ((semana - 1) * 7) + 1;


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


    const periodoInicio =
        formatarDataLocal(
            new Date(
                ano,
                mes,
                primeiroDia
            )
        );


    const periodoFim =
        formatarDataLocal(
            new Date(
                ano,
                mes,
                ultimoDia
            )
        );


     // =========================================
    // USUÁRIO LOGADO / AVALIADOR
    // =========================================

    const {
        data: sessaoData,
        error: sessaoError
    } = await supabaseClient.auth.getSession();

    if (sessaoError) {
        console.error(
            "Erro ao obter sessão:",
            sessaoError
        );
        return;
    }

    const authUserId =
        sessaoData?.session?.user?.id;

    if (!authUserId) {
        alert("Usuário não autenticado.");
        return;
    }


    // =========================================
    // BUSCA O PERFIL DO AVALIADOR
    // =========================================

    const {
        data: perfil,
        error: perfilError
    } = await supabaseClient
        .from("perfis_usuario")
        .select("id")
        .eq("auth_user_id", authUserId)
        .single();

    if (perfilError || !perfil) {
        console.error(
            "Erro ao localizar perfil do avaliador:",
            perfilError
        );

        alert(
            "Perfil do avaliador não encontrado."
        );

        return;
    }

    const avaliadorId = perfil.id;


    // =========================================
    // OBJETO DA AVALIAÇÃO
    // =========================================

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
            conhecimentoTecnico,

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

    // =========================================
    // ESTADO DO BOTÃO
    // =========================================

    if (botao) {
        botao.disabled =
            true;

        botao.textContent =
            "Salvando...";
    }


    try {

        // =====================================
        // SALVA
        // =====================================

        const {
            data,
            error
        } =
            await supabaseClient
                .from(
                    "avaliacoes_semanais"
                )
                .insert([
                    avaliacao
                ])
                .select();


        if (error) {
            throw error;
        }


        console.log(
            "Avaliação salva com sucesso:",
            data
        );


        alert(
            "Avaliação salva com sucesso!\n\n" +
            `Nota: ${notaFinal}/100\n` +
            `Classificação: ${classificacao}`
        );


        atualizarSemanaResultado();

    } catch (error) {

        console.error(
            "Erro ao salvar avaliação:",
            error
        );


        alert(
            "Não foi possível salvar a avaliação.\n\n" +
            "Abra o Console do navegador para ver o erro."
        );

    } finally {

        if (botao) {
            botao.disabled =
                false;

            botao.textContent =
                "Salvar Avaliação";
        }
    }
}


// =====================================================
// FORMATA DATA SEM PROBLEMA DE FUSO
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