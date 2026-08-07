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
        "organizacao",
        "coletividade",
        "limpeza",
        "efetividade",
        "conferencia",
        "agilidade"
    ];

    sliders.forEach(id => {

        const slider =
            document.getElementById(id);

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

    const organizacao =
        Number(document.getElementById("organizacao").value);

    const coletividade =
        Number(document.getElementById("coletividade").value);

    const limpeza =
        Number(document.getElementById("limpeza").value);

    const efetividade =
        Number(document.getElementById("efetividade").value);

    const conferencia =
        Number(document.getElementById("conferencia").value);

    const agilidade =
        Number(document.getElementById("agilidade").value);


    // Atualiza os números ao lado dos sliders

    document.getElementById("organizacaoValor").textContent =
        organizacao;

    document.getElementById("coletividadeValor").textContent =
        coletividade;

    document.getElementById("limpezaValor").textContent =
        limpeza;

    document.getElementById("efetividadeValor").textContent =
        efetividade;

    document.getElementById("conferenciaValor").textContent =
        conferencia;

    document.getElementById("agilidadeValor").textContent =
        agilidade;


    // Soma final = máximo 100

    const nota =
        organizacao +
        coletividade +
        limpeza +
        efetividade +
        conferencia +
        agilidade;


    document.getElementById("notaFinal").textContent =
        nota;


    atualizarClassificacao(nota);
}


// ========================================
// CLASSIFICAÇÃO DO DESEMPENHO
// ========================================

function atualizarClassificacao(nota) {
    const classificacao = document.getElementById("classificacao");

    if (!classificacao) {
        console.error("Elemento classificacao não encontrado.");
        return;
    }

    if (nota >= 90) {
        classificacao.textContent = "🟢 EXCELENTE";
        classificacao.style.color = "#16a34a";
    } else if (nota >= 80) {
        classificacao.textContent = "🔵 MUITO BOM";
        classificacao.style.color = "#2563eb";
    } else if (nota >= 70) {
        classificacao.textContent = "🟡 BOM";
        classificacao.style.color = "#ca8a04";
    } else if (nota >= 60) {
        classificacao.textContent = "🟠 ATENÇÃO";
        classificacao.style.color = "#ea580c";
    } else {
        classificacao.textContent = "🔴 CRÍTICO";
        classificacao.style.color = "#dc2626";
    }

    console.log("Nota:", nota, "Classificação:", classificacao.textContent);
}