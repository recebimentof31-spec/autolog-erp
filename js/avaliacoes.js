document.addEventListener("DOMContentLoaded", async () => {
    await carregarFuncionarios();
    configurarSliders();
    atualizarNota();
});


// ========================================
// CARREGA FUNCIONÁRIOS ATIVOS DO SUPABASE
// ========================================

async function carregarFuncionarios() {
    const select = document.getElementById("funcionario");

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

        option.value = funcionario.id;

        option.textContent =
            `${funcionario.nome} - ${funcionario.matricula || "Sem matrícula"}`;

        select.appendChild(option);
    });
}


// ========================================
// CONFIGURA OS SLIDERS
// ========================================

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
        const slider = document.getElementById(id);

        if (slider) {
            slider.addEventListener(
                "input",
                atualizarNota
            );
        }
    });
}


// ========================================
// CALCULA A NOTA EM TEMPO REAL
// ========================================

function atualizarNota() {
    const produtividade =
        Number(
            document.getElementById("produtividade").value
        );

    const prazo =
        Number(
            document.getElementById("prazo").value
        );

    const qualidade =
        Number(
            document.getElementById("qualidade").value
        );

    const conhecimentoTecnico =
        Number(
            document.getElementById("conhecimentoTecnico").value
        );

    const proatividade =
        Number(
            document.getElementById("proatividade").value
        );

    const trabalhoEquipe =
        Number(
            document.getElementById("trabalhoEquipe").value
        );

    const adaptabilidade =
        Number(
            document.getElementById("adaptabilidade").value
        );

    const responsabilidade =
        Number(
            document.getElementById("responsabilidade").value
        );


    // Atualiza os valores exibidos ao lado dos sliders

    document.getElementById(
        "produtividadeValor"
    ).textContent = produtividade;

    document.getElementById(
        "prazoValor"
    ).textContent = prazo;

    document.getElementById(
        "qualidadeValor"
    ).textContent = qualidade;

    document.getElementById(
        "conhecimentoTecnicoValor"
    ).textContent = conhecimentoTecnico;

    document.getElementById(
        "proatividadeValor"
    ).textContent = proatividade;

    document.getElementById(
        "trabalhoEquipeValor"
    ).textContent = trabalhoEquipe;

    document.getElementById(
        "adaptabilidadeValor"
    ).textContent = adaptabilidade;

    document.getElementById(
        "responsabilidadeValor"
    ).textContent = responsabilidade;


    // Soma máxima = 100 pontos

    const nota =
        produtividade +
        prazo +
        qualidade +
        conhecimentoTecnico +
        proatividade +
        trabalhoEquipe +
        adaptabilidade +
        responsabilidade;


    document.getElementById(
        "notaFinal"
    ).textContent = nota;

    atualizarClassificacao(nota);
}


// ========================================
// CLASSIFICAÇÃO DO DESEMPENHO
// ========================================

function atualizarClassificacao(nota) {
    const classificacao =
        document.getElementById("classificacao");

    if (!classificacao) {
        console.error(
            "Elemento classificacao não encontrado."
        );
        return;
    }

    if (nota >= 90) {
        classificacao.textContent =
            "🟢 EXCELENTE";

        classificacao.style.color =
            "#16a34a";

    } else if (nota >= 80) {
        classificacao.textContent =
            "🔵 MUITO BOM";

        classificacao.style.color =
            "#2563eb";

    } else if (nota >= 70) {
        classificacao.textContent =
            "🟡 BOM";

        classificacao.style.color =
            "#ca8a04";

    } else if (nota >= 60) {
        classificacao.textContent =
            "🟠 ATENÇÃO";

        classificacao.style.color =
            "#ea580c";

    } else {
        classificacao.textContent =
            "🔴 CRÍTICO";

        classificacao.style.color =
            "#dc2626";
    }
}